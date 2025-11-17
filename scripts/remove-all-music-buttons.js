const fs = require('fs');

// Read the current file
let content = fs.readFileSync('components/builder/EditModal.js', 'utf8');

// Step 1: Remove the entire Music Button and Music Type Selector section
// This includes everything from "Music Button" comment to closing </div> of that section
const startMarker = '          {/* Music Button - Inline with Video/Text */}';
const endMarker = '          </div>\n        )}\n      </div>\n\n      {/* Video Upload Section */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const beforeSection = content.substring(0, startIndex);
  const afterSection = content.substring(endIndex + endMarker.length);

  // Replace with just the closing tags and Video Upload Section comment
  content = beforeSection + '        </div>\n      </div>\n\n      {/* Video Upload Section */' + afterSection;
  console.log('Step 1: Removed Music Button and Music Type Selector');
} else {
  console.log('Could not find markers for music section removal');
}

// Step 2: Add music upload ONLY in Text Slide Editor section
const textSlideMarker = '      {/* Text Slide Editor */}\n      {slideType === \'text\' && (\n        <div className="space-y-4">\n          <div>\n            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>';

const newTextSlideSection = `      {/* Text Slide Editor */}
      {slideType === 'text' && (
        <div className="space-y-4">
          {/* Background Music Upload - ONLY for Text Slides */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Background Music (Max 5MB)</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="audio/*" id="textSlideMusic" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; } try { const signedRes = await fetch("/api/upload/signed-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) }); const signedData = await signedRes.json(); if (!signedRes.ok) { alert("Error: " + signedData.error); return; } const uploadRes = await fetch(signedData.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }); if (!uploadRes.ok) { alert("Upload failed: " + uploadRes.statusText); return; } setEditingStep({ ...editingStep, backgroundMusic: { enabled: true, type: "custom", customUrl: signedData.publicUrl } }); alert("Music uploaded successfully!"); } catch (err) { alert("Upload error: " + err.message); } } }} />
              <label htmlFor="textSlideMusic" className="flex-1 px-4 py-3 bg-white border-2 border-dashed border-purple-300 rounded-lg text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"><i className="fas fa-music mr-2 text-purple-500"></i><span className="text-sm font-medium text-purple-700">{editingStep.backgroundMusic?.customUrl ? "✓ Music Uploaded - Click to Replace" : "Click to Upload MP3"}</span></label>
              {editingStep.backgroundMusic?.customUrl && (<button type="button" onClick={() => setEditingStep({ ...editingStep, backgroundMusic: { enabled: false, type: "none", customUrl: null } })} className="px-3 py-3 rounded-lg border-2 border-red-300 text-red-600 text-sm hover:bg-red-50 transition font-medium">Remove</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>`;

if (content.includes(textSlideMarker)) {
  content = content.replace(textSlideMarker, newTextSlideSection);
  console.log('Step 2: Added music upload to Text Slide Editor');
} else {
  console.log('Text Slide section not found - may already have music upload');
}

// Write the updated file
fs.writeFileSync('components/builder/EditModal.js', content);
console.log('Done! Music buttons removed, upload added only for Text slides');
