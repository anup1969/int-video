(function() {
  'use strict';

  // Get configuration from window
  const config = window.IntVideoWidget || {};
  const campaignId = config.campaignId;
  const greeting = config.greeting || 'Have a question? Chat with us!';
  const apiUrl = config.apiUrl || 'https://int-video.vercel.app';

  if (!campaignId) {
    console.error('IntVideoWidget: campaignId is required');
    return;
  }

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .int-video-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .int-video-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 3px solid #fff;
    }

    .int-video-circle:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }

    .int-video-circle video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .int-video-greeting {
      position: absolute;
      bottom: 95px;
      right: 0;
      background: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      max-width: 250px;
      font-size: 14px;
      color: #333;
      animation: int-video-fade-in 0.3s;
    }

    .int-video-greeting-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-center;
    }

    .int-video-greeting-close:hover {
      color: #333;
    }

    .int-video-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-center;
      animation: int-video-fade-in 0.3s;
    }

    .int-video-modal-content {
      background: #fff;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      position: relative;
    }

    .int-video-modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.9);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .int-video-modal-close:hover {
      background: #fff;
    }

    .int-video-modal-iframe {
      width: 100%;
      height: 90vh;
      max-height: 700px;
      border: none;
    }

    @keyframes int-video-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 640px) {
      .int-video-modal-content {
        width: 100%;
        height: 100%;
        max-width: none;
        max-height: none;
        border-radius: 0;
      }
      .int-video-modal-iframe {
        height: 100vh;
        max-height: none;
      }
    }
  `;
  document.head.appendChild(style);

  // Create widget container
  const widget = document.createElement('div');
  widget.className = 'int-video-widget';

  // Create greeting tooltip
  const greetingDiv = document.createElement('div');
  greetingDiv.className = 'int-video-greeting';
  greetingDiv.innerHTML = `
    ${greeting}
    <button class="int-video-greeting-close" aria-label="Close">×</button>
  `;

  // Hide greeting after 10 seconds or on close
  setTimeout(() => {
    if (greetingDiv.parentNode) {
      greetingDiv.style.opacity = '0';
      setTimeout(() => greetingDiv.remove(), 300);
    }
  }, 10000);

  greetingDiv.querySelector('.int-video-greeting-close').addEventListener('click', (e) => {
    e.stopPropagation();
    greetingDiv.style.opacity = '0';
    setTimeout(() => greetingDiv.remove(), 300);
  });

  // Create circular video player
  const circle = document.createElement('div');
  circle.className = 'int-video-circle';

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.style.pointerEvents = 'none';

  // Fetch campaign data to get first video
  fetch(`${apiUrl}/api/campaigns/${campaignId}`)
    .then(res => res.json())
    .then(data => {
      const campaign = data.campaign;
      const firstStep = campaign.steps && campaign.steps.length > 0 ? campaign.steps[0] : null;

      if (firstStep && firstStep.video_url) {
        video.src = firstStep.video_url;
        video.addEventListener('loadeddata', () => {
          video.play().catch(err => console.log('Autoplay prevented:', err));

          // Stop after 5 seconds
          setTimeout(() => {
            video.pause();
            video.currentTime = 0;
          }, 5000);
        });
      } else {
        // Fallback: show placeholder
        circle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        circle.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">▶</div>';
      }
    })
    .catch(err => {
      console.error('IntVideoWidget: Failed to load campaign', err);
      circle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      circle.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">▶</div>';
    });

  circle.appendChild(video);

  // Open modal on click
  circle.addEventListener('click', () => {
    openModal();
  });

  // Assemble widget
  widget.appendChild(greetingDiv);
  widget.appendChild(circle);
  document.body.appendChild(widget);

  // Modal functionality
  function openModal() {
    const modal = document.createElement('div');
    modal.className = 'int-video-modal';

    modal.innerHTML = `
      <div class="int-video-modal-content">
        <button class="int-video-modal-close" aria-label="Close">×</button>
        <iframe
          src="${apiUrl}/campaign/${campaignId}"
          class="int-video-modal-iframe"
          allow="autoplay; microphone; camera"
        ></iframe>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    modal.querySelector('.int-video-modal-close').addEventListener('click', closeModal);

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    function closeModal() {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }

    // Close on Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

})();
