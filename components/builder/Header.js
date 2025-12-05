import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Header({ campaignName, scale, onSave, saveStatus, hasUnsavedChanges, campaignId, onOpenSettings, onTemplatesClick }) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [embedGreeting, setEmbedGreeting] = useState('Have a question? Chat with us!');
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <i className="fas fa-spinner fa-spin"></i> Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <i className="fas fa-check-circle"></i> Saved
          </span>
        );
      case 'error':
        return (
          <span className="text-sm text-red-600 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i> Save failed
          </span>
        );
      default:
        if (hasUnsavedChanges) {
          return (
            <span className="text-sm text-orange-600 flex items-center gap-1">
              <i className="fas fa-circle text-xs"></i> Unsaved changes
            </span>
          );
        }
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition flex items-center gap-2"
        >
          <i className="fas fa-arrow-left text-gray-600"></i>
          <span className="text-gray-700">Back to Dashboard</span>
        </button>
        <input
          type="text"
          defaultValue={campaignName || "Untitled Campaign"}
          className="text-lg font-semibold border-none outline-none bg-transparent"
        />
        {getSaveStatusDisplay()}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600 mr-2">
          Zoom: {Math.round(scale * 100)}%
        </div>
        {onTemplatesClick && (
          <button
            onClick={onTemplatesClick}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <i className="fas fa-layer-group mr-2"></i>
            Templates
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-save mr-2"></i>
          {saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
        {campaignId && (
          <button
            onClick={() => window.open(`/campaign/${campaignId}`, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <i className="fas fa-external-link-alt mr-2"></i> View Campaign
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
        >
          <i className="fas fa-cog mr-1"></i> Settings
        </button>
        <button
          onClick={() => {
            if (campaignId) {
              setShowShareModal(true);
            } else {
              alert('Please save the campaign first');
            }
          }}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
        >
          <i className="fas fa-share mr-2"></i> Share
        </button>
      </div>
    </div>

    {/* Share Modal */}
    {showShareModal && campaignId && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <i className="fas fa-share text-violet-600"></i>
              Share Campaign
            </h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Option 1: Copy Campaign URL */}
            <div className="border border-gray-200 rounded-lg p-5 hover:border-violet-300 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <i className="fas fa-link text-violet-600"></i>
                    Campaign URL
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Share direct link to your campaign</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/campaign/${campaignId}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/campaign/${campaignId}`;
                        navigator.clipboard.writeText(url);
                        alert('URL copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition flex items-center gap-2"
                    >
                      <i className="fas fa-copy"></i>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Option 2: Get Embed Code */}
            <div className="border border-gray-200 rounded-lg p-5 hover:border-violet-300 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <i className="fas fa-code text-violet-600"></i>
                    Embed Code
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Add a floating video widget to your website</p>

                  {/* Greeting Message Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Greeting Message
                    </label>
                    <input
                      type="text"
                      value={embedGreeting}
                      onChange={(e) => setEmbedGreeting(e.target.value)}
                      placeholder="Have a question? Chat with us!"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const embedCode = `<!-- Int-Video Widget -->
<script>
  (function() {
    window.IntVideoWidget = {
      campaignId: '${campaignId}',
      greeting: '${embedGreeting.replace(/'/g, "\\'")}',
      apiUrl: '${window.location.origin}'
    };
    var script = document.createElement('script');
    script.src = '${window.location.origin}/embed/widget.js';
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`;
                      navigator.clipboard.writeText(embedCode);
                      alert('Embed code copied to clipboard!\n\nPaste it before the </body> tag on your website.');
                    }}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition flex items-center gap-2"
                  >
                    <i className="fas fa-clipboard"></i>
                    Copy Embed Code
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowShareModal(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
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
