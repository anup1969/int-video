import { useState } from 'react';
import { answerTypes } from '../../lib/utils/constants';

export default function PreviewModal({
  show,
  previewMode,
  setPreviewMode,
  previewStep,
  steps,
  nodes,
  connections,
  onClose,
  onNext,
  onPrev,
  onReset,
}) {
  const [showResponseUI, setShowResponseUI] = useState(null); // 'video', 'audio', or 'text'
  const [textResponse, setTextResponse] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  if (!show) return null;

  const currentStep = steps[previewStep];
  const currentNode = nodes.find(n => n.stepNumber === currentStep?.stepNumber);

  const handleResponseClick = (type) => {
    setShowResponseUI(type);
  };

  const handleSubmitResponse = (responseType = null) => {
    // Check if there are logic rules to follow
    if (currentNode?.logicRules && currentNode.logicRules.length > 0) {
      // Find matching logic rule based on the response
      const matchingRule = currentNode.logicRules.find(rule => {
        if (responseType && rule.condition === 'response_type') {
          return rule.value === responseType;
        }
        if (selectedOption && rule.condition === 'answer_equals') {
          return rule.value === selectedOption;
        }
        return false;
      });

      if (matchingRule && matchingRule.action === 'go_to_step') {
        // Find the target step index
        const targetStepIndex = steps.findIndex(s => s.id === matchingRule.targetStep);
        if (targetStepIndex !== -1) {
          // Jump to that step
          setShowResponseUI(null);
          setTextResponse('');
          setSelectedOption(null);
          onReset(); // Reset to start, then we'd need to navigate to specific step
          // For now, just go to next as we'd need to modify FlowBuilder to support direct step navigation
          onNext();
          return;
        }
      }
    }

    // Default behavior: go to next step
    setShowResponseUI(null);
    setTextResponse('');
    setSelectedOption(null);
    onNext();
  };

  const handleCancelResponse = () => {
    setShowResponseUI(null);
    setTextResponse('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Campaign Preview</h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'mobile' ? 'bg-white shadow-sm' : ''
                }`}
              >
                📱 Mobile
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-1 text-sm rounded ${
                  previewMode === 'desktop' ? 'bg-white shadow-sm' : ''
                }`}
              >
                💻 Desktop
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <i className="fas fa-times text-gray-500"></i>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-8 bg-gray-50 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {steps.length > 0 ? (
            <>
              <div className={previewMode === 'mobile' ? 'preview-mobile' : 'preview-desktop'}>
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">{currentStep.label}</h3>
                  <p className="text-sm opacity-90">
                    Step {previewStep + 1} of {steps.length}
                  </p>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">{currentStep.videoPlaceholder}</div>
                    <div className="font-semibold text-lg text-gray-800">
                      {answerTypes.find((t) => t.id === currentStep.answerType)?.label}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 text-center text-sm text-gray-300 mb-4 aspect-video flex items-center justify-center">
                    <div>
                      <i className="fas fa-play-circle text-4xl mb-2"></i>
                      <div>Video player</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* Multiple Choice */}
                    {currentStep.answerType === 'multiple-choice' && (
                      <>
                        {currentStep.mcOptions && currentStep.mcOptions.length > 0 ? (
                          currentStep.mcOptions.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={onNext}
                              className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                            >
                              {opt}
                            </button>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-4">No options configured</div>
                        )}
                      </>
                    )}

                    {/* Button/CTA */}
                    {currentStep.answerType === 'button' && (
                      <>
                        {currentStep.buttonOptions && currentStep.buttonOptions.length > 0 ? (
                          currentStep.buttonOptions.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={onNext}
                              className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                            >
                              {btn.text}
                            </button>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-4">No buttons configured</div>
                        )}
                      </>
                    )}

                    {/* Contact Form */}
                    {currentStep.answerType === 'contact-form' && (
                      <div className="space-y-3">
                        {currentStep.contactFormFields && currentStep.contactFormFields.length > 0 ? (
                          <>
                            {currentStep.contactFormFields
                              .filter(field => field.enabled)
                              .map((field, idx) => (
                                <div key={field.id || idx}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  <input
                                    type={field.type}
                                    required={field.required}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                  />
                                </div>
                              ))}
                            <button
                              onClick={onNext}
                              className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                            >
                              Submit
                            </button>
                          </>
                        ) : (
                          <div className="text-center text-gray-500 py-4">No form fields configured</div>
                        )}
                      </div>
                    )}

                    {/* NPS Scale */}
                    {currentStep.answerType === 'nps' && (
                      <div className="space-y-3">
                        <div className="text-center text-sm text-gray-700 mb-2">
                          How likely are you to recommend us?
                        </div>
                        <div className="flex gap-1 justify-center">
                          {[...Array(11)].map((_, i) => (
                            <button
                              key={i}
                              onClick={onNext}
                              className="flex-1 max-w-[50px] py-3 bg-violet-100 hover:bg-violet-600 hover:text-white text-violet-700 rounded-lg font-medium transition text-sm"
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Not likely</span>
                          <span>Very likely</span>
                        </div>
                      </div>
                    )}

                    {/* Open-Ended */}
                    {currentStep.answerType === 'open-ended' && (
                      <>
                        {!showResponseUI ? (
                          <div className="flex gap-2 justify-center">
                            {currentStep.enabledResponseTypes?.video && (
                              <button
                                onClick={() => handleResponseClick('video')}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                              >
                                📹 Video
                              </button>
                            )}
                            {currentStep.enabledResponseTypes?.audio && (
                              <button
                                onClick={() => handleResponseClick('audio')}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                              >
                                🎤 Audio
                              </button>
                            )}
                            {currentStep.enabledResponseTypes?.text && (
                              <button
                                onClick={() => handleResponseClick('text')}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                              >
                                📝 Text
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {showResponseUI === 'video' && (
                              <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
                                <i className="fas fa-video text-4xl mb-3"></i>
                                <p className="mb-4">Video recording interface would appear here</p>
                                <div className="text-sm text-gray-400">In production, this would access the camera</div>
                              </div>
                            )}
                            {showResponseUI === 'audio' && (
                              <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
                                <i className="fas fa-microphone text-4xl mb-3"></i>
                                <p className="mb-4">Audio recording interface would appear here</p>
                                <div className="text-sm text-gray-400">In production, this would access the microphone</div>
                              </div>
                            )}
                            {showResponseUI === 'text' && (
                              <div>
                                <textarea
                                  value={textResponse}
                                  onChange={(e) => setTextResponse(e.target.value)}
                                  placeholder="Type your response here..."
                                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-violet-500 focus:outline-none"
                                  rows="4"
                                />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={handleCancelResponse}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitResponse(showResponseUI)}
                                className="flex-1 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
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
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={onReset}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  <i className="fas fa-redo mr-2"></i> Reset
                </button>
                <button
                  onClick={onPrev}
                  disabled={previewStep === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-arrow-left mr-2"></i> Previous
                </button>
                <button
                  onClick={onNext}
                  disabled={previewStep === steps.length - 1}
                  className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">No steps to preview</div>
              <div className="text-sm text-gray-500">Create some steps first</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
