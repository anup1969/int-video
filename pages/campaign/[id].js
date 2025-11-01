import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { answerTypes } from '../../lib/utils/constants';
import packageInfo from '../../package.json';

export default function CampaignViewer() {
  const router = useRouter();
  const { id } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showResponseUI, setShowResponseUI] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [formData, setFormData] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [campaignEnded, setCampaignEnded] = useState(false);
  const [endConfig, setEndConfig] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Load campaign from API
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        // Transform API response to match expected structure
        const transformedData = {
          ...data.campaign,
          nodes: data.steps.map(step => ({
            id: step.id,
            type: 'video',
            stepNumber: step.step_number,
            label: step.label,
            answerType: step.answer_type,
            videoUrl: step.data?.videoUrl || null,
            mcOptions: step.data?.mcOptions || [],
            buttonOptions: step.data?.buttonOptions || [],
            contactFormFields: step.data?.contactFormFields || [],
            enabledResponseTypes: step.data?.enabledResponseTypes || {},
            showContactForm: step.data?.showContactForm || false,
            logicRules: step.data?.logicRules || [],
          }))
        };
        setCampaign(transformedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load campaign:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading campaign...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">Campaign not found</div>
          <div className="text-gray-600">This campaign may have been deleted or the link is incorrect.</div>
        </div>
      </div>
    );
  }

  const steps = campaign.nodes
    .filter(n => n.type === 'video')
    .sort((a, b) => a.stepNumber - b.stepNumber);

  if (campaignEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-2xl font-bold text-gray-800 mb-4">
            {endConfig?.endMessage || 'Thank you for your response!'}
          </div>
          {endConfig?.ctaText && endConfig?.ctaUrl && (
            <a
              href={endConfig.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
            >
              {endConfig.ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const currentNode = campaign.nodes.find(n => n.stepNumber === currentStep?.stepNumber);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowResponseUI(null);
      setTextResponse('');
      setFormData({});
      setSelectedOption(null);
    }
  };

  const handleResponseClick = (type) => {
    setShowResponseUI(type);
  };

  const handleSubmitResponse = (responseType = null, optionValue = null) => {
    // Check if there are logic rules to follow
    if (currentNode?.logicRules && currentNode.logicRules.length > 0) {
      const matchingRule = currentNode.logicRules.find(rule => {
        if (responseType && rule.condition === 'response_type') {
          return rule.value === responseType;
        }
        if (optionValue !== null) {
          return rule.label && rule.label.includes(optionValue);
        }
        return false;
      });

      if (matchingRule) {
        if (matchingRule.targetType === 'end') {
          setEndConfig({
            endMessage: matchingRule.endMessage || 'Thank you for your response!',
            ctaText: matchingRule.ctaText,
            ctaUrl: matchingRule.ctaUrl,
          });
          setCampaignEnded(true);
          return;
        } else if (matchingRule.targetType === 'url' && matchingRule.url) {
          window.location.href = matchingRule.url;
          return;
        } else if (matchingRule.targetType === 'node' && matchingRule.target) {
          const targetStepIndex = steps.findIndex(s => s.id === matchingRule.target);
          if (targetStepIndex !== -1) {
            setCurrentStepIndex(targetStepIndex);
            setShowResponseUI(null);
            setTextResponse('');
            setFormData({});
            setSelectedOption(null);
            return;
          }
        }
      }
    }

    // Default behavior: go to next step or end
    if (currentStepIndex < steps.length - 1) {
      handleNext();
    } else {
      setCampaignEnded(true);
      setEndConfig({ endMessage: 'Thank you for completing this campaign!' });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmitResponse();
  };

  const handleCancelResponse = () => {
    setShowResponseUI(null);
    setTextResponse('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">{currentStep.label}</h3>
          <p className="text-sm opacity-90">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Player */}
          {currentStep.videoUrl ? (
            <div className="mb-6 rounded-lg overflow-hidden">
              <video
                controls
                className="w-full"
                src={currentStep.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-8 text-center text-sm text-gray-300 mb-6 aspect-video flex items-center justify-center">
              <div>
                <i className="fas fa-play-circle text-5xl mb-3"></i>
                <div className="text-lg">Video placeholder</div>
              </div>
            </div>
          )}

          {/* Contact Form (if enabled) */}
          {currentStep.showContactForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-3">Contact Information</div>
              <div className="space-y-3">
                {currentStep.contactFormFields
                  ?.filter(field => field.enabled)
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
              </div>
            </div>
          )}

          {/* Answer Type UI */}
          <div className="space-y-3">
            {/* Multiple Choice */}
            {currentStep.answerType === 'multiple-choice' && (
              <>
                {currentStep.mcOptions && currentStep.mcOptions.length > 0 ? (
                  currentStep.mcOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitResponse(null, opt)}
                      className="w-full px-6 py-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-lg"
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No options available</div>
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
                      onClick={() => handleSubmitResponse(null, btn.text)}
                      className="w-full px-6 py-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-lg"
                    >
                      {btn.text}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">No buttons available</div>
                )}
              </>
            )}

            {/* Contact Form */}
            {currentStep.answerType === 'contact-form' && (
              <form onSubmit={handleFormSubmit} className="space-y-3">
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
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    <button
                      type="submit"
                      className="w-full px-6 py-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition text-lg"
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-4">No form fields configured</div>
                )}
              </form>
            )}

            {/* NPS Scale */}
            {currentStep.answerType === 'nps' && (
              <div className="space-y-4">
                <div className="text-center text-base text-gray-700 font-medium">
                  How likely are you to recommend us?
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitResponse(null, i.toString())}
                      className="w-12 h-12 bg-violet-100 hover:bg-violet-600 hover:text-white text-violet-700 rounded-lg font-bold transition"
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* Open-Ended */}
            {currentStep.answerType === 'open-ended' && (
              <>
                {!showResponseUI ? (
                  <div className="flex gap-3 justify-center">
                    {currentStep.enabledResponseTypes?.video && (
                      <button
                        onClick={() => handleResponseClick('video')}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                      >
                        📹 Video
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.audio && (
                      <button
                        onClick={() => handleResponseClick('audio')}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                      >
                        🎤 Audio
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.text && (
                      <button
                        onClick={() => handleResponseClick('text')}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                      >
                        📝 Text
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showResponseUI === 'video' && (
                      <div className="bg-gray-800 rounded-lg p-10 text-center text-white">
                        <i className="fas fa-video text-5xl mb-4"></i>
                        <p className="mb-4 text-lg">Video recording interface</p>
                        <div className="text-sm text-gray-400">Click "Record" to start recording your video response</div>
                      </div>
                    )}
                    {showResponseUI === 'audio' && (
                      <div className="bg-gray-800 rounded-lg p-10 text-center text-white">
                        <i className="fas fa-microphone text-5xl mb-4"></i>
                        <p className="mb-4 text-lg">Audio recording interface</p>
                        <div className="text-sm text-gray-400">Click "Record" to start recording your audio response</div>
                      </div>
                    )}
                    {showResponseUI === 'text' && (
                      <div>
                        <textarea
                          value={textResponse}
                          onChange={(e) => setTextResponse(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-violet-500 focus:outline-none"
                          rows="5"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelResponse}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitResponse(showResponseUI)}
                        className="flex-1 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium"
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
        {/* Version Badge */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
          <span className="text-xs text-gray-400">v{packageInfo.version}</span>
        </div>
      </div>
    </div>
  );
}
