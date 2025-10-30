import VideoUpload from "./VideoUpload";
import { answerTypes } from '../../lib/utils/constants';

export default function EditModal({
  show,
  editingStep,
  setEditingStep,
  activeTab,
  setActiveTab,
  nodes,
  onSave,
  onClose,
  onAnswerTypeChange,
  onResponseTypeToggle,
  addMCOption,
  updateMCOption,
  removeMCOption,
  addButtonOption,
  updateButtonOption,
  removeButtonOption,
  addContactFormField,
  updateContactFormField,
  removeContactFormField,
  updateLogicRule,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Edit Step: {editingStep.label}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['video', 'answer', 'logic'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition ${
                activeTab === tab
                  ? 'tab-active'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'video' && '🎬'}
              {tab === 'answer' && '💬'}
              {tab === 'logic' && '🔀'} {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {activeTab === 'video' && (
            <VideoTab
              editingStep={editingStep}
              setEditingStep={setEditingStep}
              updateContactFormField={updateContactFormField}
              removeContactFormField={removeContactFormField}
              addContactFormField={addContactFormField}
            />
          )}

          {activeTab === 'answer' && (
            <AnswerTab
              editingStep={editingStep}
              setEditingStep={setEditingStep}
              onResponseTypeToggle={onResponseTypeToggle}
              addMCOption={addMCOption}
              updateMCOption={updateMCOption}
              removeMCOption={removeMCOption}
              addButtonOption={addButtonOption}
              updateButtonOption={updateButtonOption}
              removeButtonOption={removeButtonOption}
              addContactFormField={addContactFormField}
              updateContactFormField={updateContactFormField}
              removeContactFormField={removeContactFormField}
            />
          )}

          {activeTab === 'logic' && (
            <LogicTab
              editingStep={editingStep}
              nodes={nodes}
              updateLogicRule={updateLogicRule}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition shadow-sm"
          >
            <i className="fas fa-check mr-2"></i>Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Video Tab Component
function VideoTab({ editingStep, setEditingStep, updateContactFormField, removeContactFormField, addContactFormField }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Step Name</label>
        <input
          type="text"
          value={editingStep.label}
          onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="e.g., Welcome Video"
        />
      </div>
      <VideoUpload
        currentVideoUrl={editingStep.videoUrl}
        onVideoUploaded={(url) => setEditingStep({ ...editingStep, videoUrl: url })}
      />

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editingStep.showContactForm}
            onChange={(e) => setEditingStep({ ...editingStep, showContactForm: e.target.checked })}
            className="w-4 h-4 text-violet-600"
          />
          <span className="text-sm font-medium">Show contact form on this step</span>
        </label>
        {editingStep.showContactForm && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-600 mb-2">Configure which fields to collect:</div>
            {editingStep.contactFormFields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2 bg-white p-2 rounded">
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={(e) => updateContactFormField(idx, 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateContactFormField(idx, 'label', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateContactFormField(idx, 'type', e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="number">Number</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateContactFormField(idx, 'required', e.target.checked)}
                  />
                  Required
                </label>
                {idx !== 0 && (
                  <button
                    onClick={() => removeContactFormField(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addContactFormField}
              className="text-violet-600 text-xs font-medium hover:text-violet-700"
            >
              <i className="fas fa-plus mr-1"></i> Add Custom Field
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Answer Tab Component
function AnswerTab({
  editingStep,
  setEditingStep,
  onResponseTypeToggle,
  addMCOption,
  updateMCOption,
  removeMCOption,
  addButtonOption,
  updateButtonOption,
  removeButtonOption,
  addContactFormField,
  updateContactFormField,
  removeContactFormField,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Answer Type</label>
        <div className="grid grid-cols-2 gap-3">
          {answerTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onAnswerTypeChange(type.id)}
              className={`p-3 border-2 rounded-lg text-left transition ${
                editingStep.answerType === type.id
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              <div className="font-semibold text-sm">{type.label}</div>
              <div className="text-xs text-gray-500">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Open-Ended Options */}
      {editingStep.answerType === 'open-ended' && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="font-medium text-sm text-gray-700 mb-2">Response Options</div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-violet-600"
              checked={editingStep.enabledResponseTypes.video}
              onChange={() => onResponseTypeToggle('video')}
            />
            <span className="text-sm">Allow video responses</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-violet-600"
              checked={editingStep.enabledResponseTypes.audio}
              onChange={() => onResponseTypeToggle('audio')}
            />
            <span className="text-sm">Allow audio responses</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-violet-600"
              checked={editingStep.enabledResponseTypes.text}
              onChange={() => onResponseTypeToggle('text')}
            />
            <span className="text-sm">Allow text responses</span>
          </label>
          <div>
            <label className="text-sm text-gray-700 font-medium">Time limit (seconds)</label>
            <input
              type="number"
              defaultValue="120"
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Multiple Choice Options */}
      {editingStep.answerType === 'multiple-choice' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Button Options</label>
          {editingStep.mcOptions.map((option, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateMCOption(idx, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={() => removeMCOption(idx)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button
            onClick={addMCOption}
            className="text-violet-600 text-sm font-medium hover:text-violet-700"
          >
            <i className="fas fa-plus mr-1"></i> Add Option
          </button>
        </div>
      )}

      {/* Button/CTA Options */}
      {editingStep.answerType === 'button' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Button Options</label>
          {editingStep.buttonOptions.map((btn, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600">Button {idx + 1}</span>
                <button
                  onClick={() => removeButtonOption(idx)}
                  className="text-red-600 text-xs hover:text-red-700"
                >
                  <i className="fas fa-trash mr-1"></i> Remove
                </button>
              </div>
              <input
                type="text"
                value={btn.text}
                onChange={(e) => updateButtonOption(idx, 'text', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="Button text"
              />
            </div>
          ))}
          <button
            onClick={addButtonOption}
            className="w-full px-4 py-2 bg-violet-50 text-violet-600 rounded-lg font-medium hover:bg-violet-100"
          >
            <i className="fas fa-plus mr-2"></i> Add Button
          </button>
        </div>
      )}

      {/* Contact Form Options */}
      {editingStep.answerType === 'contact-form' && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">Contact Form Fields</div>
          {editingStep.contactFormFields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={(e) => updateContactFormField(idx, 'enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateContactFormField(idx, 'label', e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded"
                disabled={!field.enabled}
              />
              <select
                value={field.type}
                onChange={(e) => updateContactFormField(idx, 'type', e.target.value)}
                className="px-2 py-1 text-sm border rounded"
                disabled={!field.enabled}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="number">Number</option>
              </select>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateContactFormField(idx, 'required', e.target.checked)}
                  disabled={!field.enabled}
                />
                Required
              </label>
              {idx !== 0 && (
                <button
                  onClick={() => removeContactFormField(idx)}
                  className="text-red-600 hover:text-red-700"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addContactFormField}
            className="text-violet-600 text-sm font-medium hover:text-violet-700"
          >
            <i className="fas fa-plus mr-1"></i> Add Custom Field
          </button>
        </div>
      )}

      {/* NPS Scale */}
      {editingStep.answerType === 'nps' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-700 mb-3 font-medium">
            Visitors will rate from 0-10
          </div>
          <div className="flex gap-1 mb-3">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="flex-1 text-center py-2 bg-white border rounded text-xs font-medium">
                {i}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• 0-6 = Detractors</div>
            <div>• 7-8 = Passives</div>
            <div>• 9-10 = Promoters</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Logic Tab Component
function LogicTab({ editingStep, nodes, updateLogicRule }) {
  return (
    <div className="space-y-4">
      <div className="bg-violet-50 p-4 rounded-lg mb-4">
        <div className="text-sm font-medium text-violet-800 mb-1">
          🔀 Logic Paths for: {answerTypes.find(t => t.id === editingStep.answerType)?.label}
        </div>
        <div className="text-xs text-violet-600">
          Set a path for EACH possible outcome. Incomplete paths show orange warning.
        </div>
      </div>

      {editingStep.logicRules.map((rule, idx) => {
        const isIncomplete = !rule.target || rule.target === '';
        return (
          <div key={idx} className={`logic-rule-item ${isIncomplete ? 'incomplete' : 'required'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm text-gray-700">{rule.label}</div>
                {isIncomplete ? (
                  <span className="incomplete-badge">Incomplete</span>
                ) : (
                  <span className="required-badge">Set</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Then:</label>
                <select
                  value={rule.targetType || 'node'}
                  onChange={(e) => updateLogicRule(idx, 'targetType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                >
                  <option value="node">Go to another step</option>
                  <option value="url">Redirect to URL</option>
                  <option value="text">Show text message</option>
                  <option value="end">End campaign</option>
                </select>
              </div>

              {rule.targetType === 'node' && (
                <select
                  value={rule.target}
                  onChange={(e) => updateLogicRule(idx, 'target', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select target step...</option>
                  {nodes.filter(n => n.type === 'video' && n.id !== editingStep.id).map(node => (
                    <option key={node.id} value={node.id}>
                      Step {node.stepNumber}: {node.label}
                    </option>
                  ))}
                </select>
              )}

              {rule.targetType === 'url' && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Enter URL:</label>
                  <input
                    type="url"
                    value={rule.url || ''}
                    onChange={(e) => {
                      updateLogicRule(idx, 'url', e.target.value);
                      updateLogicRule(idx, 'target', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {rule.targetType === 'text' && (
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Message text:</label>
                  <textarea
                    value={rule.text || ''}
                    onChange={(e) => {
                      updateLogicRule(idx, 'text', e.target.value);
                      updateLogicRule(idx, 'target', 'text_message');
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                    rows="2"
                    placeholder="Enter message to show..."
                  />
                </div>
              )}

              {rule.targetType === 'end' && (
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                  Campaign will end and show thank you screen
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
