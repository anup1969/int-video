import { useState } from 'react';

export default function VideoUpload({ onVideoUploaded, currentVideoUrl }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, MOV, or WebM)');
      return;
    }

    // Validate file size (500MB = 524288000 bytes)
    if (file.size > 524288000) {
      alert('Video file is too large. Maximum size is 500MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();

      setProgress(100);
      onVideoUploaded(url);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Video</label>

      {currentVideoUrl ? (
        <div className="space-y-2">
          <video
            src={currentVideoUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: '200px' }}
          />
          <button
            onClick={() => document.getElementById('video-upload').click()}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <i className="fas fa-upload mr-2"></i>Replace Video
          </button>
        </div>
      ) : (
        <label
          htmlFor="video-upload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-violet-400 cursor-pointer transition block"
        >
          {uploading ? (
            <div>
              <i className="fas fa-spinner fa-spin text-4xl text-violet-600 mb-3"></i>
              <p className="text-sm text-gray-600 font-medium">Uploading... {progress}%</p>
            </div>
          ) : (
            <div>
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
              <p className="text-sm text-gray-600 font-medium">Click to upload or drag video here</p>
              <p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM up to 500MB</p>
            </div>
          )}
        </label>
      )}

      <input
        id="video-upload"
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
