const fs = require('fs');
let c = fs.readFileSync('components/builder/EditModal.js', 'utf8');

// Simple find and replace - remove Music Button and selector entirely
c = c.replace(/          \{\/\* Music Button - Inline with Video\/Text \*\/\}[\s\S]*?        <\/div>\n\n        \{\/\* Music Type Selector[\s\S]*?        \)}\n      <\/div>/g,
  '        </div>\n      </div>');

console.log('Step 1: Removed all music buttons');

// Add music upload to Text Slide section
const oldText = `      {/* Text Slide Editor */}
      {slideType === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>`;

const newText = `      {/* Text Slide Editor */}
      {slideType === 'text' && (
        <div className="space-y-4">
          {/* Background Music Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Background Music (Max 5MB)</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="audio/*" id="textSlideMusic" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; } try { const signedRes = await fetch("/api/upload/signed-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) }); const signedData = await signedRes.json(); if (!signedRes.ok) { alert("Error: " + signedData.error); return; } const uploadRes = await fetch(signedData.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }); if (!uploadRes.ok) { alert("Upload failed: " + uploadRes.statusText); return; } setEditingStep({ ...editingStep, backgroundMusic: { enabled: true, type: "custom", customUrl: signedData.publicUrl } }); alert("Music uploaded!"); } catch (err) { alert("Upload error: " + err.message); } } }} />
              <label htmlFor="textSlideMusic" className="flex-1 px-4 py-3 bg-white border-2 border-dashed border-purple-300 rounded-lg text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"><i className="fas fa-music mr-2 text-purple-500"></i><span className="text-sm font-medium text-purple-700">{editingStep.backgroundMusic?.customUrl ? "✓ Music Uploaded" : "Upload MP3"}</span></label>
              {editingStep.backgroundMusic?.customUrl && (<button type="button" onClick={() => setEditingStep({ ...editingStep, backgroundMusic: { enabled: false, type: "none", customUrl: null } })} className="px-3 py-3 rounded-lg border-2 border-red-300 text-red-600 text-sm hover:bg-red-50 transition font-medium">Remove</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>`;

c = c.replace(oldText, newText);
console.log('Step 2: Added music upload to Text Slide');

fs.writeFileSync('components/builder/EditModal.js', c);
console.log('Done!');
