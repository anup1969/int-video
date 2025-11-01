import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { answerTypes } from '../../lib/utils/constants';
import packageInfo from '../../package.json';

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Response tracking
  const sessionId = useRef(null);
  const startTime = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!id) return;

    // Initialize session tracking
    if (!sessionId.current) {
      sessionId.current = generateSessionId();
      startTime.current = Date.now();
    }

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

  // Save response to API
  const saveResponse = async (answerData, isCompleted = false) => {
    try {
      const duration = startTime.current ? Math.floor((Date.now() - startTime.current) / 1000) : 0;

      const responsePayload = {
        sessionId: sessionId.current,
        stepId: currentStep.id,
        stepNumber: currentStep.stepNumber,
        answerType: currentStep.answerType,
        answerData: answerData,
        completed: isCompleted,
        duration: duration,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent
      };

      // Extract contact info if available
      if (formData.name) responsePayload.userName = formData.name;
      if (formData.email) responsePayload.email = formData.email;

      await fetch(`/api/campaigns/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responsePayload)
      });
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

  const handleSubmitResponse = async (responseType = null, optionValue = null) => {
    // Prepare answer data based on response type
    let answerData = {};
    if (responseType === 'text') {
      answerData = { type: 'text', value: textResponse };
    } else if (responseType === 'video' || responseType === 'audio') {
      answerData = { type: responseType, value: 'recorded' };
    } else if (optionValue !== null) {
      answerData = { type: 'selection', value: optionValue };
    } else if (currentStep.answerType === 'contact-form') {
      answerData = { type: 'contact-form', value: formData };
    }

    // Save response before navigation
    await saveResponse(answerData, false);


    // Check if there are logic rules to follow
    if (currentNode?.logicRules && currentNode.logicRules.length > 0) {
      const matchingRule = currentNode.logicRules.find(rule => {
        if (responseType && rule.condition === 'response_type') {
          return rule.value === responseType;
        }
        if (optionValue !== null) {
          // Check if rule label contains the option value (for mc/buttons)
          if (rule.label && rule.label.includes(optionValue)) {
            return true;
          }
          // Also check button index conditions (button_0, button_1, etc)
          if (rule.condition && rule.condition.startsWith('button_')) {
            const buttonIndex = parseInt(rule.condition.replace('button_', ''));
            const buttons = currentStep.buttonOptions || currentStep.mcOptions || [];
            const selectedButton = buttons[buttonIndex];
            if (selectedButton) {
              const buttonText = selectedButton.text || selectedButton;
              return buttonText === optionValue;
            }
          }
        }
        return false;
      });

      if (matchingRule) {
        if (matchingRule.targetType === 'end') {
          await saveResponse(answerData, true);
          setEndConfig({
            endMessage: matchingRule.endMessage || 'Thank you for your response!',
            ctaText: matchingRule.ctaText,
            ctaUrl: matchingRule.ctaUrl,
          });
          setCampaignEnded(true);
          return;
        } else if (matchingRule.targetType === 'url' && matchingRule.url) {
          // Add protocol if missing
          let url = matchingRule.url;
          if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
          }
          window.location.href = url;
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
      await saveResponse(answerData, true);
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

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsMuted(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      {currentStep.videoUrl ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          src={currentStep.videoUrl}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <i className="fas fa-play-circle text-6xl mb-4"></i>
            <div className="text-xl">Video placeholder</div>
          </div>
        </div>
      )}

      {/* Unmute Button - Top Left */}
      {isMuted && currentStep.videoUrl && (
        <button
          onClick={handleUnmute}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-black/70 hover:bg-black/90 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 transition backdrop-blur-sm z-20 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              clipRule="evenodd"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
          <span className="font-medium">Click to Unmute</span>
        </button>
      )}

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-3 z-20">
        {/* Play/Pause Button */}
        {currentStep.videoUrl && (
          <button
            onClick={handlePlayPause}
            className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 sm:p-3 rounded-lg transition"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Step Progress */}
        <div className="bg-black/60 backdrop-blur-md text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>

      {/* Bottom Overlay - Contains all interactive elements */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 md:pb-10">

          {/* Step Label / Question */}
          <div className="text-white text-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
              {currentStep.label}
            </h3>
          </div>

          {/* Contact Form (if enabled and showing) */}
          {currentStep.showContactForm && (
            <div className="mb-4 sm:mb-6 mx-auto max-w-md lg:max-w-lg">
              <div className="bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-xl">
                <div className="text-sm font-semibold text-white mb-3">Contact Information</div>
                <div className="space-y-3">
                  {currentStep.contactFormFields
                    ?.filter(field => field.enabled)
                    .map((field, idx) => (
                      <div key={field.id || idx}>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Answer Type UI */}
          <div className="mx-auto max-w-md lg:max-w-lg">

            {/* Multiple Choice */}
            {currentStep.answerType === 'multiple-choice' && (
              <div className="space-y-3 sm:space-y-4">
                {currentStep.mcOptions && currentStep.mcOptions.length > 0 ? (
                  currentStep.mcOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitResponse(null, opt)}
                      className="w-full px-6 py-4 sm:py-5 bg-black/60 hover:bg-purple-600/80 backdrop-blur-md text-white rounded-xl font-medium transition text-base sm:text-lg border border-white/10"
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-white/60 py-4">No options available</div>
                )}
              </div>
            )}

            {/* Button/CTA */}
            {currentStep.answerType === 'button' && (
              <div className="space-y-3 sm:space-y-4">
                {currentStep.buttonOptions && currentStep.buttonOptions.length > 0 ? (
                  currentStep.buttonOptions.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitResponse(null, btn.text)}
                      className="w-full px-6 py-4 sm:py-5 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl font-semibold transition text-base sm:text-lg border border-white/20 shadow-lg"
                    >
                      {btn.text}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-white/60 py-4">No buttons available</div>
                )}
              </div>
            )}

            {/* Contact Form */}
            {currentStep.answerType === 'contact-form' && (
              <form onSubmit={handleFormSubmit} className="space-y-3 sm:space-y-4">
                {currentStep.contactFormFields && currentStep.contactFormFields.length > 0 ? (
                  <>
                    <div className="bg-black/60 backdrop-blur-md p-4 sm:p-5 rounded-xl space-y-3">
                      {currentStep.contactFormFields
                        .filter(field => field.enabled)
                        .map((field, idx) => (
                          <div key={field.id || idx}>
                            <label className="block text-sm font-medium text-white/90 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <input
                              type={field.type}
                              required={field.required}
                              value={formData[field.id] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                            />
                          </div>
                        ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-4 sm:py-5 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl font-semibold transition text-base sm:text-lg border border-white/20"
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/60 py-4">No form fields configured</div>
                )}
              </form>
            )}

            {/* NPS Scale */}
            {currentStep.answerType === 'nps' && (
              <div className="space-y-4 bg-black/60 backdrop-blur-md p-4 sm:p-6 rounded-xl">
                <div className="text-center text-base sm:text-lg text-white font-medium mb-4">
                  How likely are you to recommend us?
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitResponse(null, i.toString())}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-purple-600 hover:text-white text-white/90 rounded-lg font-bold transition backdrop-blur-sm border border-white/30"
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-white/70">
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
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        📹 Video
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.audio && (
                      <button
                        onClick={() => handleResponseClick('audio')}
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        🎤 Audio
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.text && (
                      <button
                        onClick={() => handleResponseClick('text')}
                        className="flex-1 py-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        📝 Text
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showResponseUI === 'video' && (
                      <div className="bg-black/70 backdrop-blur-md rounded-xl p-8 sm:p-10 text-center text-white border border-white/20">
                        <i className="fas fa-video text-4xl sm:text-5xl mb-4"></i>
                        <p className="mb-4 text-base sm:text-lg">Video recording interface</p>
                        <div className="text-sm text-white/60">Click "Record" to start recording your video response</div>
                      </div>
                    )}
                    {showResponseUI === 'audio' && (
                      <div className="bg-black/70 backdrop-blur-md rounded-xl p-8 sm:p-10 text-center text-white border border-white/20">
                        <i className="fas fa-microphone text-4xl sm:text-5xl mb-4"></i>
                        <p className="mb-4 text-base sm:text-lg">Audio recording interface</p>
                        <div className="text-sm text-white/60">Click "Record" to start recording your audio response</div>
                      </div>
                    )}
                    {showResponseUI === 'text' && (
                      <div>
                        <textarea
                          value={textResponse}
                          onChange={(e) => setTextResponse(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50"
                          rows="5"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelResponse}
                        className="flex-1 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitResponse(showResponseUI)}
                        className="flex-1 py-3 bg-purple-600/70 hover:bg-purple-600/90 backdrop-blur-md text-white rounded-xl transition font-medium border border-white/20"
                      >
                        Submit & Continue
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Version Badge */}
          <div className="mt-4 sm:mt-6 text-center">
            <span className="text-xs text-white/40">v{packageInfo.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
