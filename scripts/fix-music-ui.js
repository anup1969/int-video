const fs = require('fs');
let content = fs.readFileSync('components/builder/EditModal.js', 'utf8');

// Remove the music preset buttons section and keep only upload for TEXT slides
// Find and remove the entire music type selector section
const oldMusicSection = `        {/* Music Type Selector - Shows when music is enabled */}
        {editingStep.backgroundMusic?.enabled && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              Select music type (plays when user records response):
            </p>
            <div className="grid grid-cols-4 gap-2">
              {backgroundMusicOptions.map((music) => (
                <button
                  key={music.id}
                  type="button"
                  onClick={() => setEditingStep({
                    ...editingStep,
                    backgroundMusic: {
                      ...editingStep.backgroundMusic,
                      type: music.id
                    }
                  })}
                  className={\`p-2 rounded-lg border-2 text-center transition \${
                    editingStep.backgroundMusic?.type === music.id
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }\`}
                >
                  <span className="text-lg block">{music.icon}</span>
                  <span className="text-xs font-medium">{music.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Or upload your own music:</p>
              <div className="flex items-center gap-2">
                <input type="file" accept="audio/*" id="customMusicUpload" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; } try { const signedRes = await fetch("/api/upload/signed-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) }); const signedData = await signedRes.json(); if (!signedRes.ok) { alert("Error: " + signedData.error); return; } const uploadRes = await fetch(signedData.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }); if (!uploadRes.ok) { alert("Upload failed: " + uploadRes.statusText); return; } setEditingStep({ ...editingStep, backgroundMusic: { ...editingStep.backgroundMusic, type: "custom", customUrl: signedData.publicUrl } }); } catch (err) { alert("Upload error: " + err.message); } } }} />
                <label htmlFor="customMusicUpload" className="flex-1 px-3 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 transition"><i className="fas fa-upload mr-2 text-gray-500"></i><span className="text-sm text-gray-600">{editingStep.backgroundMusic?.customUrl ? "Custom Uploaded" : "Upload MP3"}</span></label>
                {editingStep.backgroundMusic?.customUrl && (<button type="button" onClick={() => setEditingStep({ ...editingStep, backgroundMusic: { ...editingStep.backgroundMusic, type: "custom" } })} className={\`px-3 py-2 rounded-lg border-2 text-xs transition \${editingStep.backgroundMusic?.type === "custom" ? "border-purple-500 bg-purple-100 text-purple-700" : "border-gray-300 hover:border-purple-400"}\`}>Use Custom</button>)}
              </div>
            </div>
          </div>
        )}
      </div>`;

const newMusicSection = `      </div>`;

content = content.replace(oldMusicSection, newMusicSection);

// Now add the music upload section ONLY under TEXT slides
const textSlideSection = `      {/* Text Slide Editor */}
      {slideType === 'text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>
            <textarea
              value={editingStep.textContent || ''}
              onChange={(e) => setEditingStep({ ...editingStep, textContent: e.target.value })}`;

const newTextSlideSection = `      {/* Text Slide Editor */}
      {slideType === 'text' && (
        <div className="space-y-4">
          {/* Background Music Upload for Text Slides */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Background Music (Max 5MB)</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="audio/*" id="customMusicUpload" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; } try { const signedRes = await fetch("/api/upload/signed-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) }); const signedData = await signedRes.json(); if (!signedRes.ok) { alert("Error: " + signedData.error); return; } const uploadRes = await fetch(signedData.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file }); if (!uploadRes.ok) { alert("Upload failed: " + uploadRes.statusText); return; } setEditingStep({ ...editingStep, backgroundMusic: { enabled: true, type: "custom", customUrl: signedData.publicUrl } }); } catch (err) { alert("Upload error: " + err.message); } } }} />
              <label htmlFor="customMusicUpload" className="flex-1 px-3 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 transition"><i className="fas fa-upload mr-2 text-gray-500"></i><span className="text-sm text-gray-600">{editingStep.backgroundMusic?.customUrl ? "✓ Music Uploaded" : "Upload MP3"}</span></label>
              {editingStep.backgroundMusic?.customUrl && (<button type="button" onClick={() => setEditingStep({ ...editingStep, backgroundMusic: { enabled: false, type: 'none', customUrl: null } })} className="px-3 py-2 rounded-lg border-2 border-red-300 text-red-600 text-xs hover:bg-red-50 transition">Remove</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Content</label>
            <textarea
              value={editingStep.textContent || ''}
              onChange={(e) => setEditingStep({ ...editingStep, textContent: e.target.value })}`;

content = content.replace(textSlideSection, newTextSlideSection);

// Remove the Music ON/OFF toggle button since it's no longer needed
const musicToggleButton = `          <button
            type="button"
            onClick={() => setEditingStep({
              ...editingStep,
              backgroundMusic: {
                ...editingStep.backgroundMusic,
                enabled: !editingStep.backgroundMusic?.enabled,
                type: editingStep.backgroundMusic?.type || 'calm'
              }
            })}
            className={\`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition font-medium text-sm \${
              editingStep.backgroundMusic?.enabled
                ? 'border-purple-500 bg-purple-100 text-purple-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-purple-400'
            }\`}
          >
            <i className="fas fa-music"></i>
            <span>Music {editingStep.backgroundMusic?.enabled ? 'ON' : 'OFF'}</span>
          </button>`;

content = content.replace(musicToggleButton, '');

fs.writeFileSync('components/builder/EditModal.js', content);
console.log('Fixed music UI: Removed preset buttons, added upload ONLY for TEXT slides');
