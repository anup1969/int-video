import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PhotoUpload({ onPhotoUploaded, currentPhotoUrl }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type - accept all image types
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    // Validate file size (50MB = 52428800 bytes)
    if (file.size > 52428800) {
      alert('Image file is too large. Maximum size is 50MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `photos/${fileName}`;

      setProgress(20);

      // Upload directly to Supabase from browser
      const { data, error } = await supabase.storage
        .from('videos') // Using same bucket as videos
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 80) / progressEvent.total) + 20;
            setProgress(percentCompleted);
          }
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setProgress(100);
      onPhotoUploaded(urlData.publicUrl);

      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload photo: ${error.message}`);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>

      {currentPhotoUrl ? (
        <div className="space-y-2">
          <img
            src={currentPhotoUrl}
            alt="Uploaded photo"
            className="w-full rounded-lg object-contain"
            style={{ maxHeight: '200px' }}
          />
          <button
            onClick={() => document.getElementById('photo-upload').click()}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <i className="fas fa-upload mr-2"></i>Replace Photo
          </button>
        </div>
      ) : (
        <label
          htmlFor="photo-upload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-violet-400 cursor-pointer transition block"
        >
          <i className="fas fa-image text-4xl text-gray-400 mb-2"></i>
          <p className="text-sm text-gray-600">Click to upload photo</p>
          <p className="text-xs text-gray-500 mt-1">All image formats supported (Max 50MB)</p>
        </label>
      )}

      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}
