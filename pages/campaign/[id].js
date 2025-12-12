import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { answerTypes } from '../../lib/utils/constants';
import packageInfo from '../../package.json';

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to upload file in chunks
async function uploadFileInChunks(blob, fileName, fileType, onProgress) {
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (base64 encoding adds ~33% overhead, so 2MB -> ~2.7MB with JSON)
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
  let lastResult = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, blob.size);
    const chunk = blob.slice(start, end);

    // Convert chunk to base64
    const reader = new FileReader();
    const chunkBase64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });

    // Upload chunk
    const response = await fetch('/api/upload/chunked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunk: chunkBase64,
        fileName,
        chunkIndex: i,
        totalChunks,
        fileType
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chunk upload failed:', response.status, errorText);
      throw new Error(`Chunk upload failed: ${errorText}`);
    }

    const result = await response.json();
    lastResult = result;

    console.log(`Chunk ${i + 1}/${totalChunks} uploaded`, result);

    // Update progress
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    // If completed, return the result
    if (result.completed) {
      return result;
    }
  }

  // Fallback: return last result if no chunk was marked as completed
  if (lastResult) {
    return lastResult;
  }

  throw new Error('Upload completed but no result was returned');
}

export default function CampaignViewer() {
  const router = useRouter();
  const { id } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showResponseUI, setShowResponseUI] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [formData, setFormData] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [campaignEnded, setCampaignEnded] = useState(false);
  const [endConfig, setEndConfig] = useState(null);
  const [scheduleMessage, setScheduleMessage] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [volume, setVolume] = useState(0.6); // 60% default volume
  const [showButtons, setShowButtons] = useState(false); // For delayed button display
  const [videoProgress, setVideoProgress] = useState(0); // Video progress percentage (0-100)
  const [errorMessage, setErrorMessage] = useState(null); // Copyable error modal

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingVideoRef = useRef(null);

  // Response tracking
  const sessionId = useRef(null);
  const startTime = useRef(null);
  const videoRef = useRef(null);
  const hideButtonTimeout = useRef(null);
  const buttonDelayTimeout = useRef(null);

  useEffect(() => {
    if (!id) return;

    // Initialize session tracking
    if (!sessionId.current) {
      sessionId.current = generateSessionId();
      startTime.current = Date.now();
    }

    // Load campaign from API
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        // Transform API response to match expected structure
        const transformedData = {
          ...data.campaign,
          nodes: data.steps.map(step => ({
            id: step.id,
            originalId: step.data?.originalId || step.id,
            type: 'video',
            stepNumber: step.step_number,
            label: step.label,
            answerType: step.answer_type,
            videoUrl: step.data?.videoUrl || null,
            mcOptions: step.data?.mcOptions || [],
            buttonOptions: step.data?.buttonOptions || [],
            buttonShowTime: step.data?.buttonShowTime || 0,
            contactFormFields: step.data?.contactFormFields || [],
            enabledResponseTypes: step.data?.enabledResponseTypes || {},
            showContactForm: step.data?.showContactForm || false,
            logicRules: step.data?.logicRules || [],
            slideType: step.data?.slideType || 'video',
            textContent: step.data?.textContent || '',
            backgroundColor: step.data?.backgroundColor || '',
            fontFamily: step.data?.fontFamily || '',
          }))
        };

        // Set campaign data first (so error messages work correctly)
        setCampaign(transformedData);

        // Check campaign schedule
        const now = new Date();
        if (data.campaign.schedule_start) {
          const startDate = new Date(data.campaign.schedule_start);
          if (now < startDate) {
            const startTimeIST = startDate.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              dateStyle: 'medium',
              timeStyle: 'short'
            });
            setScheduleMessage(`This campaign will start on ${startTimeIST} IST`);
            setCampaignEnded(true);
            setLoading(false);
            return;
          }
        }
        if (data.campaign.schedule_end) {
          const endDate = new Date(data.campaign.schedule_end);
          if (now > endDate) {
            setScheduleMessage('This campaign has ended');
            setCampaignEnded(true);
            setLoading(false);
            return;
          }
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load campaign:', err);
        setLoading(false);
      });
  }, [id]);

  // Track visit and check usage limit
  useEffect(() => {
    if (!id) return;

    const trackVisit = async () => {
      try {
        const response = await fetch(`/api/campaigns/${id}/track-visit`, {
          method: 'POST'
        });
        const data = await response.json();

        if (data.limitReached) {
          setLimitReached(true);
        }
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackVisit();
  }, [id]);

  // Handle button delay based on buttonShowTime
  // Must be before conditional returns to comply with Rules of Hooks
  useEffect(() => {
    if (!campaign || loading || campaignEnded) return;

    const steps = campaign.nodes
      ?.filter(n => n.type === 'video')
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const currentStep = steps?.[currentStepIndex];
    if (!currentStep) return;

    // Clear any existing timeout
    if (buttonDelayTimeout.current) {
      clearTimeout(buttonDelayTimeout.current);
    }

    const delayTime = (currentStep.buttonShowTime || 0) * 1000; // Convert seconds to milliseconds

    if (delayTime > 0) {
      // Hide buttons initially
      setShowButtons(false);

      // Show buttons after delay
      buttonDelayTimeout.current = setTimeout(() => {
        setShowButtons(true);
      }, delayTime);
    } else {
      // Show buttons immediately if no delay
      setShowButtons(true);
    }

    // Cleanup on unmount or step change
    return () => {
      if (buttonDelayTimeout.current) {
        clearTimeout(buttonDelayTimeout.current);
      }
    };
  }, [campaign, loading, campaignEnded, currentStepIndex]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !campaign || loading || campaignEnded) return;

    const steps = campaign.nodes
      ?.filter(n => n.type === 'video')
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const currentStep = steps?.[currentStepIndex];
    if (!currentStep || !currentStep.videoUrl) return;

    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        const progress = (video.currentTime / video.duration) * 100;
        setVideoProgress(progress);
      }
    };

    // Reset progress when step changes
    setVideoProgress(0);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [currentStepIndex, campaign, loading, campaignEnded]);

  // Set recording video stream (prevents flickering)
  useEffect(() => {
    if (recordingVideoRef.current && recordingStreamRef.current && isRecording) {
      recordingVideoRef.current.srcObject = recordingStreamRef.current;
    } else if (recordingVideoRef.current && !isRecording) {
      // Clear srcObject when not recording
      recordingVideoRef.current.srcObject = null;
    }
  }, [isRecording]);

  // Create stable video URL to prevent flickering
  const recordedVideoUrl = useMemo(() => {
    if (recordedBlob) {
      return URL.createObjectURL(recordedBlob);
    }
    return null;
  }, [recordedBlob]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading campaign...</div>
        </div>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Campaign No Longer Available
          </h1>
          <p className="text-gray-600 text-lg">
            This campaign has reached its usage limit and is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">Campaign not found</div>
          <div className="text-gray-600">This campaign may have been deleted or the link is incorrect.</div>
        </div>
      </div>
    );
  }

  const steps = campaign.nodes
    .filter(n => n.type === 'video')
    .sort((a, b) => a.stepNumber - b.stepNumber);

  if (campaignEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">{scheduleMessage ? '⏰' : '✅'}</div>
          <div className="text-2xl font-bold text-gray-800 mb-4">
            {scheduleMessage || endConfig?.endMessage || 'Thank you for your response!'}
          </div>
          {endConfig?.ctaText && endConfig?.ctaUrl && (
            <a
              href={endConfig.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
            >
              {endConfig.ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const currentNode = campaign.nodes.find(n => n.stepNumber === currentStep?.stepNumber);

  // Guard clause: If no current step, show loading
  if (!currentStep) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading campaign...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowResponseUI(null);
      setTextResponse('');
      setFormData({});
      setSelectedOption(null);
      setUploadedFile(null);
      discardRecording(); // Clear recording when moving to next step
    }
  };

  const handleResponseClick = (type) => {
    setShowResponseUI(type);
  };

  // Save response to API
  const saveResponse = async (answerData, isCompleted = false) => {
    try {
      const duration = startTime.current ? Math.floor((Date.now() - startTime.current) / 1000) : 0;

      const responsePayload = {
        sessionId: sessionId.current,
        stepId: currentStep.id,
        stepNumber: currentStep.stepNumber,
        answerType: currentStep.answerType,
        slideType: currentStep.slideType || 'video', // Include slide type (video, text, etc.)
        answerData: answerData,
        completed: isCompleted,
        duration: duration,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent
      };

      // Extract contact info if available
      if (formData.name) responsePayload.userName = formData.name;
      if (formData.email) responsePayload.email = formData.email;

      await fetch(`/api/campaigns/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responsePayload)
      });
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

  const handleSubmitResponse = async (responseType = null, optionValue = null) => {
    // Prepare answer data based on response type
    let answerData = {};
    if (responseType === 'text') {
      answerData = { type: 'text', value: textResponse };
    } else if (responseType === 'video' || responseType === 'audio') {
      answerData = { type: responseType, value: 'recorded' };
    } else if (optionValue !== null) {
      answerData = { type: 'selection', value: optionValue };
    } else if (currentStep.answerType === 'contact-form') {
      answerData = { type: 'contact-form', value: formData };
    } else if (currentStep.answerType === 'file-upload' && uploadedFile) {
      // Upload file
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch('/api/upload/file', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || errorData.details || 'File upload failed');
        }

        const uploadData = await uploadResponse.json();
        answerData = {
          type: 'file',
          value: uploadData.fileName,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          fileUrl: uploadData.fileUrl
        };
      } catch (error) {
        console.error('File upload error:', error);
        setErrorMessage(`Failed to upload file: ${error.message}\n\nFile: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)\n\nPlease try a smaller file or contact support.`);
        setUploadingFile(false);
        return;
      } finally {
        setUploadingFile(false);
      }
    } else if (currentStep.answerType === 'open-ended' && recordedBlob) {
      // Upload recorded audio/video using direct upload (now compressed to stay under 4MB)
      setUploadingFile(true);
      try {
        const fileExtension = recordedBlob.type.includes('video') ? 'webm' : (recordedBlob.type.includes('audio') ? 'webm' : 'mp4');
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `recording-${timestamp}-${randomString}.${fileExtension}`;

        const formData = new FormData();
        formData.append('file', recordedBlob, fileName);

        const uploadResponse = await fetch('/api/upload/file', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const responseText = await uploadResponse.text();
          console.error('Upload response:', uploadResponse.status, responseText);
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: `Server error (${uploadResponse.status}): ${responseText.substring(0, 100)}` };
          }
          throw new Error(errorData.error || errorData.details || 'Recording upload failed');
        }

        const uploadData = await uploadResponse.json();
        answerData = {
          type: recordedBlob.type.includes('video') ? 'video' : 'audio',
          value: uploadData.fileName,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          fileUrl: uploadData.fileUrl
        };

        // Don't clear recording here - will be cleared when moving to next step
      } catch (error) {
        console.error('Recording upload error:', error);
        setErrorMessage(`Failed to upload recording: ${error.message}\n\nPlease try again or contact support.`);
        setUploadingFile(false);
        return;
      } finally {
        setUploadingFile(false);
      }
    }

    // Save response before navigation
    await saveResponse(answerData, false);


    // Check if there are logic rules to follow
    if (currentNode?.logicRules && currentNode.logicRules.length > 0) {
      const matchingRule = currentNode.logicRules.find(rule => {
        if (responseType && rule.condition === 'response_type') {
          return rule.value === responseType;
        }
        if (optionValue !== null) {
          // Check if rule label contains the option value (for mc/buttons)
          if (rule.label && rule.label.includes(optionValue)) {
            return true;
          }
          // Check button index conditions (button_0, button_1, etc)
          if (rule.condition && rule.condition.startsWith('button_')) {
            const buttonIndex = parseInt(rule.condition.replace('button_', ''));
            const buttons = currentStep.buttonOptions || currentStep.mcOptions || [];
            const selectedButton = buttons[buttonIndex];
            if (selectedButton) {
              const buttonText = selectedButton.text || selectedButton;
              return buttonText === optionValue;
            }
          }
          // Also check option index conditions (option_0, option_1, etc) for multiple-choice
          if (rule.condition && rule.condition.startsWith('option_')) {
            const optionIndex = parseInt(rule.condition.replace('option_', ''));
            const options = currentStep.mcOptions || [];
            const selectedOption = options[optionIndex];
            if (selectedOption === optionValue) {
              return true;
            }
          }
        }
        return false;
      });

      if (matchingRule) {
        if (matchingRule.targetType === 'end') {
          await saveResponse(answerData, true);
          setEndConfig({
            endMessage: matchingRule.endMessage || 'Thank you for your response!',
            ctaText: matchingRule.ctaText,
            ctaUrl: matchingRule.ctaUrl,
          });
          setCampaignEnded(true);
          return;
        } else if (matchingRule.targetType === 'url' && matchingRule.url) {
          // Add protocol if missing
          let url = matchingRule.url;
          if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
          }
          window.location.href = url;
          return;
        } else if (matchingRule.targetType === 'node' && matchingRule.target) {
          // Try to find by ID first, then by originalId, then by data.originalId (for nodes that were recreated multiple times)
          console.log('[ROUTING DEBUG] Looking for target:', matchingRule.target);
          console.log('[ROUTING DEBUG] Available steps:', steps.map(s => ({ id: s.id, originalId: s.originalId, label: s.label })));

          let targetStepIndex = steps.findIndex(s => s.id === matchingRule.target);
          if (targetStepIndex === -1) {
            targetStepIndex = steps.findIndex(s => s.originalId === matchingRule.target);
          }
          // Also check nested data.originalId as a third fallback
          if (targetStepIndex === -1) {
            targetStepIndex = steps.findIndex(s => s.data?.originalId === matchingRule.target);
          }

          console.log('[ROUTING DEBUG] Target step index found:', targetStepIndex);

          if (targetStepIndex !== -1) {
            setCurrentStepIndex(targetStepIndex);
            setShowResponseUI(null);
            discardRecording(); // Clear recording when moving to next step
            setTextResponse('');
            setFormData({});
            setSelectedOption(null);
            setUploadedFile(null);
            return;
          } else {
            console.error('[ROUTING ERROR] Could not find target step for ID:', matchingRule.target);
          }
        }
      }
    }

    // Default behavior: go to next step or end
    if (currentStepIndex < steps.length - 1) {
      handleNext();
    } else {
      await saveResponse(answerData, true);
      setCampaignEnded(true);
      setEndConfig({ endMessage: 'Thank you for completing this campaign!' });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmitResponse();
  };

  const handleCancelResponse = () => {
    setShowResponseUI(null);
    setTextResponse("");
  };

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume; // Set to 60% default
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsMuted(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMouseMove = () => {
    setShowPlayButton(true);

    // Clear existing timeout
    if (hideButtonTimeout.current) {
      clearTimeout(hideButtonTimeout.current);
    }

    // Set new timeout to hide button after 500ms
    hideButtonTimeout.current = setTimeout(() => {
      setShowPlayButton(false);
    }, 500);
  };

  const handleMouseEnterButton = () => {
    // Clear timeout when hovering over button
    if (hideButtonTimeout.current) {
      clearTimeout(hideButtonTimeout.current);
    }
    setShowPlayButton(true);
  };

  const handleMouseLeaveButton = () => {
    // Hide button after 500ms when leaving button area
    hideButtonTimeout.current = setTimeout(() => {
      setShowPlayButton(false);
    }, 500);
  };

  // Recording functions
  const startRecording = async (type) => {
    try {
      const constraints = type === 'video'
        ? { video: { facingMode: 'user' }, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      recordingStreamRef.current = stream;

      const mimeType = type === 'video'
        ? (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

      // Add compression options to reduce file size
      const options = {
        mimeType,
        videoBitsPerSecond: 1000000, // 1 Mbps (good quality, ~7.5MB per minute)
        audioBitsPerSecond: 128000   // 128 kbps (good audio quality)
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access camera/microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop all stream tracks immediately
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }

      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsRecording(false);

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      style={{ height: '100vh', height: '100dvh' }}
    >
      {/* Fullscreen Video, Photo or Text Background */}
      {currentStep.slideType === 'text' ? (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16"
          style={{ background: currentStep.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <p
            className="text-white text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold break-words max-w-4xl leading-tight"
            style={{ fontFamily: currentStep.fontFamily || 'system-ui, -apple-system, sans-serif' }}
          >
            {currentStep.textContent || ''}
          </p>
        </div>
      ) : (currentStep.displayPriority === 'photo' && currentStep.photoUrl) ? (
        // Show photo if display priority is photo
        <img
          src={currentStep.photoUrl}
          alt="Step background"
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : currentStep.videoUrl ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
            src={currentStep.videoUrl}
          >
            Your browser does not support the video tag.
          </video>
          {/* Video Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-30">
            <div
              className="h-full bg-violet-500 transition-all duration-200 ease-linear"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        </>
      ) : currentStep.photoUrl ? (
        // Show photo if no video or if only photo exists
        <img
          src={currentStep.photoUrl}
          alt="Step background"
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <i className="fas fa-image text-6xl mb-4"></i>
            <div className="text-xl">No media uploaded</div>
          </div>
        </div>
      )}

      {/* Unmute Button - Top Right */}
      {isMuted && currentStep.videoUrl && (
        <button
          onClick={handleUnmute}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/70 hover:bg-black/90 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 transition backdrop-blur-sm z-20 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              clipRule="evenodd"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
          <span className="font-medium">Click to Unmute</span>
        </button>
      )}

      {/* Volume Control - Top Right */}
      {!isMuted && currentStep.videoUrl && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/70 backdrop-blur-sm rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 z-20">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #fff 0%, #fff ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
          <span className="text-white text-xs sm:text-sm font-medium min-w-[2rem] sm:min-w-[2.5rem]">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* Centered Play/Pause Button */}
      {currentStep.videoUrl && showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <button
            onClick={handlePlayPause}
            onMouseEnter={handleMouseEnterButton}
            onMouseLeave={handleMouseLeaveButton}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-md text-white p-5 sm:p-6 rounded-full transition-all pointer-events-auto"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            style={{
              opacity: showPlayButton ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            {isPlaying ? (
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Bottom Overlay - Contains all interactive elements */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 md:pb-10">

          {/* Contact Form (if enabled and showing) */}
          {currentStep.showContactForm && (
            <div className="mb-4 sm:mb-6 mx-auto max-w-md lg:max-w-lg">
              <div className="bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-xl">
                <div className="text-sm font-semibold text-white mb-3">Contact Information</div>
                <div className="space-y-3">
                  {currentStep.contactFormFields
                    ?.filter(field => field.enabled)
                    .map((field, idx) => (
                      <div key={field.id || idx}>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Answer Type UI */}
          <div className="mx-auto max-w-md lg:max-w-lg">

            {/* Multiple Choice */}
            {currentStep.answerType === 'multiple-choice' && (
              <div className="space-y-3 sm:space-y-4">
                {showButtons ? (
                  currentStep.mcOptions && currentStep.mcOptions.length > 0 ? (
                    currentStep.mcOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmitResponse(null, opt)}
                        className="w-full px-6 py-4 sm:py-5 bg-black/60 hover:bg-purple-600/80 backdrop-blur-md text-white rounded-xl font-medium transition text-base sm:text-lg border border-white/10"
                      >
                        {opt}
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-white/60 py-4">No options available</div>
                  )
                ) : null}
              </div>
            )}

            {/* Button/CTA */}
            {currentStep.answerType === 'button' && (
              <div className="space-y-3 sm:space-y-4">
                {showButtons ? (
                  currentStep.buttonOptions && currentStep.buttonOptions.length > 0 ? (
                    currentStep.buttonOptions.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmitResponse(null, btn.text)}
                        className="w-full px-6 py-4 sm:py-5 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl font-semibold transition text-base sm:text-lg border border-white/20 shadow-lg"
                      >
                        {btn.text}
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-white/60 py-4">No buttons available</div>
                  )
                ) : null}
              </div>
            )}

            {/* Contact Form */}
            {currentStep.answerType === 'contact-form' && (
              <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4">
                {currentStep.contactFormFields && currentStep.contactFormFields.length > 0 ? (
                  <>
                    <div className="bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-xl space-y-3">
                      {currentStep.contactFormFields
                        .filter(field => field.enabled)
                        .map((field, idx) => (
                          <div key={field.id || idx}>
                            <label className="block text-sm font-medium text-white/90 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <input
                              type={field.type}
                              required={field.required}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                            />
                          </div>
                        ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-4 sm:py-5 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl font-semibold transition text-base sm:text-lg border border-white/20"
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/60 py-4">No form fields configured</div>
                )}
              </form>
            )}

            {/* NPS Scale */}
            {currentStep.answerType === 'nps' && (
              <div className="space-y-4 bg-black/60 backdrop-blur-md p-4 sm:p-6 rounded-xl">
                <div className="text-center text-base sm:text-lg text-white font-medium mb-4">
                  How likely are you to recommend us?
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitResponse(null, i.toString())}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-purple-600 hover:text-white text-white/90 rounded-lg font-bold transition backdrop-blur-sm border border-white/30"
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-white/70">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* File Upload */}
            {currentStep.answerType === 'file-upload' && (
              <div className="space-y-4 bg-black/60 backdrop-blur-md p-4 sm:p-6 rounded-xl">
                <div className="text-center">
                  <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-white/30 rounded-xl p-8 hover:border-purple-500 hover:bg-white/5 transition">
                    <div className="text-5xl mb-3">📎</div>
                    <div className="text-white font-medium mb-1">
                      {uploadedFile ? uploadedFile.name : 'Click to upload file'}
                    </div>
                    <div className="text-white/60 text-sm">
                      {uploadedFile
                        ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : 'PDF, DOC, Image, or any file type'
                      }
                    </div>
                    <input
                      type="file"
                      onChange={(e) => setUploadedFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadedFile && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setUploadedFile(null)}
                      disabled={uploadingFile}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleSubmitResponse()}
                      disabled={uploadingFile}
                      className="flex-1 px-4 py-3 bg-purple-600/70 hover:bg-purple-600/90 text-white rounded-lg font-medium transition border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingFile ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Uploading...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Open-Ended */}
            {currentStep.answerType === 'open-ended' && (
              <>
                {!showResponseUI ? (
                  <div className="flex gap-3 justify-center">
                    {(currentStep.enabledResponseTypes?.video ?? true) && (
                      <button
                        onClick={() => handleResponseClick('video')}
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        📹 Video
                      </button>
                    )}
                    {(currentStep.enabledResponseTypes?.audio ?? true) && (
                      <button
                        onClick={() => handleResponseClick('audio')}
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        🎤 Audio
                      </button>
                    )}
                    {(currentStep.enabledResponseTypes?.text ?? true) && (
                      <button
                        onClick={() => handleResponseClick('text')}
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        📝 Text
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showResponseUI === 'video' && (
                      <div className="bg-black/70 backdrop-blur-md rounded-xl p-6 sm:p-8 text-white border border-white/20">
                        {!isRecording && !recordedBlob && (
                          <div className="text-center">
                            <i className="fas fa-video text-4xl sm:text-5xl mb-4 text-purple-400"></i>
                            <p className="mb-4 text-base sm:text-lg">Record your video response</p>
                            <button
                              onClick={() => startRecording('video')}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                            >
                              <i className="fas fa-circle"></i>
                              Start Recording
                            </button>
                            <div className="text-sm text-white/60 mt-3">Click to start recording with your camera</div>
                          </div>
                        )}

                        {isRecording && showResponseUI === 'video' && (
                          <div className="space-y-4">
                            <video
                              ref={recordingVideoRef}
                              autoPlay
                              muted
                              playsInline
                              className="w-full rounded-lg bg-black"
                            />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-500 mb-4">
                                <i className="fas fa-circle animate-pulse mr-2"></i>
                                Recording {formatTime(recordingTime)}
                              </div>
                              <div className="flex gap-3 justify-center">
                                <button
                                  onClick={stopRecording}
                                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                                >
                                  <i className="fas fa-stop mr-2"></i>
                                  Stop Recording
                                </button>
                                <button
                                  onClick={discardRecording}
                                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                                >
                                  <i className="fas fa-times mr-2"></i>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {recordedBlob && showResponseUI === 'video' && recordedVideoUrl && (
                          <div className="space-y-4">
                            <video
                              src={recordedVideoUrl}
                              controls
                              className="w-full rounded-lg bg-black"
                            />
                            <div className="text-center text-sm text-white/70 mb-3">
                              Recording length: {formatTime(recordingTime)}
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={discardRecording}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                              >
                                <i className="fas fa-redo mr-2"></i>
                                Re-record
                              </button>
                              <button
                                onClick={() => handleSubmitResponse()}
                                disabled={uploadingFile}
                                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                              >
                                {uploadingFile ? 'Uploading...' : 'Submit Video'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {showResponseUI === 'audio' && (
                      <div className="bg-black/70 backdrop-blur-md rounded-xl p-6 sm:p-8 text-white border border-white/20">
                        {!isRecording && !recordedBlob && (
                          <div className="text-center">
                            <i className="fas fa-microphone text-4xl sm:text-5xl mb-4 text-purple-400"></i>
                            <p className="mb-4 text-base sm:text-lg">Record your audio response</p>
                            <button
                              onClick={() => startRecording('audio')}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                            >
                              <i className="fas fa-circle"></i>
                              Start Recording
                            </button>
                            <div className="text-sm text-white/60 mt-3">Click to start recording with your microphone</div>
                          </div>
                        )}

                        {isRecording && showResponseUI === 'audio' && (
                          <div className="text-center space-y-6">
                            <div className="flex justify-center">
                              <div className="relative">
                                <i className="fas fa-microphone text-6xl text-red-500 animate-pulse"></i>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-20 h-20 border-4 border-red-500 rounded-full animate-ping"></div>
                                </div>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-red-500">
                              <i className="fas fa-circle animate-pulse mr-2"></i>
                              Recording {formatTime(recordingTime)}
                            </div>
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={stopRecording}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
                              >
                                <i className="fas fa-stop mr-2"></i>
                                Stop Recording
                              </button>
                              <button
                                onClick={discardRecording}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                              >
                                <i className="fas fa-times mr-2"></i>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {recordedBlob && showResponseUI === 'audio' && (
                          <div className="space-y-4">
                            <div className="bg-black/50 rounded-lg p-6 text-center">
                              <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                              <p className="text-lg mb-2">Audio recorded successfully!</p>
                              <p className="text-sm text-white/70">Recording length: {formatTime(recordingTime)}</p>
                            </div>
                            <audio
                              src={recordedVideoUrl}
                              controls
                              className="w-full"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={discardRecording}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                              >
                                <i className="fas fa-redo mr-2"></i>
                                Re-record
                              </button>
                              <button
                                onClick={() => handleSubmitResponse()}
                                disabled={uploadingFile}
                                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                              >
                                {uploadingFile ? 'Uploading...' : 'Submit Audio'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {showResponseUI === 'text' && (
                      <div>
                        <textarea
                          value={textResponse}
                          onChange={(e) => setTextResponse(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                          rows="5"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelResponse}
                        className="flex-1 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitResponse(showResponseUI)}
                        className="flex-1 py-3 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        Submit & Continue
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Error Modal - Copyable error messages */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">Error</h3>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap select-text font-mono text-sm">
                {errorMessage}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorMessage);
                  const btn = event.target;
                  const originalText = btn.textContent;
                  btn.textContent = 'Copied!';
                  setTimeout(() => btn.textContent = originalText, 2000);
                }}
                className="flex-1 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition font-medium"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy Error
              </button>
              <button
                onClick={() => setErrorMessage(null)}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
