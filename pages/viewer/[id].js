import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MediaViewer() {
  const router = useRouter();
  const { id, responseId, stepId } = router.query;

  const [loading, setLoading] = useState(true);
  const [mediaData, setMediaData] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !responseId || !stepId) return;

    loadMediaData();
  }, [id, responseId, stepId]);

  const loadMediaData = async () => {
    try {
      setLoading(true);

      // Fetch response data
      const res = await fetch(`/api/campaigns/${id}/responses`);
      const data = await res.json();

      // Find the specific response
      const response = data.responses.find(r => r.id === responseId);
      if (!response) {
        setError('Response not found');
        setLoading(false);
        return;
      }

      // Find the specific step
      const step = response.data?.steps?.find(s => s.stepId === stepId);
      if (!step) {
        setError('Media not found');
        setLoading(false);
        return;
      }

      setMediaData({
        type: step.answerData?.type,
        fileUrl: step.answerData?.fileUrl,
        fileName: step.answerData?.value,
        stepNumber: step.stepNumber,
        userName: response.user_name || 'Anonymous'
      });

      setTranscription(step.transcription || null);
      setLoading(false);
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media');
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!mediaData?.fileUrl) return;

    setTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: mediaData.fileUrl,
          responseId: responseId,
          stepId: stepId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await res.json();
      setTranscription(data.transcription);
    } catch (err) {
      console.error('Transcription error:', err);
      alert('Failed to transcribe: ' + err.message);
    } finally {
      setTranscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading media...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">{error}</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fas fa-arrow-left text-gray-600"></i>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {mediaData?.type === 'video' ? 'Video Response' : 'Audio Response'}
                </h1>
                <p className="text-sm text-gray-600">
                  {mediaData?.userName} - Step {mediaData?.stepNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Media Player */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {mediaData?.type === 'video' ? (
            <video
              controls
              className="w-full rounded-lg"
              src={mediaData.fileUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
              <i className="fas fa-volume-up text-6xl text-violet-600 mb-6"></i>
              <audio
                controls
                className="w-full max-w-md"
                src={mediaData.fileUrl}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          {/* Download Link */}
          <div className="mt-4 flex items-center justify-between">
            <a
              href={mediaData.fileUrl}
              download
              className="text-violet-600 hover:text-violet-800 font-medium flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Download {mediaData?.type === 'video' ? 'Video' : 'Audio'}
            </a>
          </div>
        </div>

        {/* Transcription Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="fas fa-file-alt text-violet-600"></i>
              Transcription
            </h2>
            {!transcription && (
              <button
                onClick={handleTranscribe}
                disabled={transcribing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {transcribing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Transcribing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-alt"></i>
                    Transcribe {mediaData?.type === 'video' ? 'Video' : 'Audio'}
                  </>
                )}
              </button>
            )}
          </div>

          {transcription ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{transcription}</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <i className="fas fa-file-alt text-4xl mb-3"></i>
              <p>No transcription available yet.</p>
              <p className="text-sm mt-1">Click the button above to transcribe this {mediaData?.type}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
