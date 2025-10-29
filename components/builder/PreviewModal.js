import { answerTypes } from '../../lib/utils/constants';

export default function PreviewModal({
  show,
  previewMode,
  setPreviewMode,
  previewStep,
  steps,
  onClose,
  onNext,
  onPrev,
  onReset,
}) {
  if (!show) return null;

  const currentStep = steps[previewStep];

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
                    {currentStep.answerType === 'multiple-choice' &&
                      currentStep.mcOptions?.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={onNext}
                          className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    {currentStep.answerType === 'button' &&
                      currentStep.buttonOptions?.map((btn, idx) => (
                        <button
                          key={idx}
                          onClick={onNext}
                          className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                        >
                          {btn.text}
                        </button>
                      ))}
                    {currentStep.answerType === 'open-ended' && (
                      <div className="flex gap-2 justify-center">
                        {currentStep.enabledResponseTypes?.video && (
                          <button
                            onClick={onNext}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            📹 Video
                          </button>
                        )}
                        {currentStep.enabledResponseTypes?.audio && (
                          <button
                            onClick={onNext}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            🎤 Audio
                          </button>
                        )}
                        {currentStep.enabledResponseTypes?.text && (
                          <button
                            onClick={onNext}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                          >
                            📝 Text
                          </button>
                        )}
                      </div>
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
