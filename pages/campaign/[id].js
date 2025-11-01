import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { answerTypes } from '../../lib/utils/constants';

export default function CampaignViewer() {
  const router = useRouter();
  const { id } = router.query;
  const videoRef = useRef(null);

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
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [startTime] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({ type: 'desktop', userAgent: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Load campaign from API
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Campaign data loaded:', data);
        // Transform steps into nodes format for the viewer
        if (data.steps && data.steps.length > 0) {
          const nodes = data.steps.map(step => ({
            id: step.id,
            type: 'video',
            stepNumber: step.step_number,
            label: step.label,
            answerType: step.answer_type,
            // Extract all properties from data JSONB field
            videoUrl: step.data?.videoUrl,
            videoThumbnail: step.data?.videoThumbnail,
            videoPlaceholder: step.data?.videoPlaceholder || '🎬',
            mcOptions: step.data?.mcOptions || [],
            buttonOptions: step.data?.buttonOptions || [],
            buttonShowTime: step.data?.buttonShowTime || 0,
            enabledResponseTypes: step.data?.enabledResponseTypes || { video: true, audio: true, text: true },
            showContactForm: step.data?.showContactForm || false,
            contactFormFields: step.data?.contactFormFields || [],
            logicRules: step.data?.logicRules || [],
          }));

          console.log('Transformed nodes:', nodes);
          setCampaign({ ...data.campaign, nodes });
        } else {
          // If no steps, just set campaign with empty nodes array
          setCampaign({ ...data.campaign, nodes: [] });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load campaign:', err);
        setLoading(false);
      });
  }, [id]);

  // Detect device type on mount
  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      let deviceType = 'desktop';

      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'tablet';
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = 'mobile';
      }

      setDeviceInfo({ type: deviceType, userAgent: ua });
    };

    detectDevice();
  }, []);

  // Toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Save response to database
  const saveResponse = async (answerData, isCompleted = false) => {
    if (!campaign || !campaign.nodes) {
      console.log('Cannot save response: campaign or nodes not loaded');
      return;
    }

    const steps = campaign.nodes
      .filter(n => n.type === 'video')
      .sort((a, b) => a.stepNumber - b.stepNumber);

    if (steps.length === 0) {
      console.log('Cannot save response: no steps found');
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      console.log('Cannot save response: current step not found', { currentStepIndex, stepsLength: steps.length });
      return;
    }

    console.log('Saving response:', {
      sessionId,
      stepId: currentStep.id,
      stepNumber: currentStep.stepNumber,
      answerType: currentStep.answerType,
      answerData
    });

    try {
      const response = await fetch(`/api/campaigns/${id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          stepId: currentStep.id,
          stepNumber: currentStep.stepNumber,
          answerType: currentStep.answerType,
          answerData,
          userName: formData.name || null,
          email: formData.email || null,
          completed: isCompleted,
          duration: Math.floor((Date.now() - startTime) / 1000),
          deviceType: deviceInfo.type,
          userAgent: deviceInfo.userAgent
        })
      });

      const result = await response.json();
      console.log('Response saved successfully:', result);
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

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

  const steps = campaign?.nodes
    ? campaign.nodes
        .filter(n => n.type === 'video')
        .sort((a, b) => a.stepNumber - b.stepNumber)
    : [];

  console.log('Steps computed:', steps.length, 'currentStepIndex:', currentStepIndex);

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

  if (steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">No steps found</div>
          <div className="text-gray-600">This campaign has no steps configured.</div>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const currentNode = campaign?.nodes ? campaign.nodes.find(n => n.stepNumber === currentStep?.stepNumber) : null;

  console.log('currentStep:', currentStep);
  console.log('currentStep.videoUrl:', currentStep?.videoUrl);

  if (!currentStep && steps.length > 0) {
    // If currentStepIndex is out of bounds, reset to first step
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(0);
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading step...</div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-bold text-gray-800 mb-2">No step available</div>
          <div className="text-gray-600">Step {currentStepIndex + 1} not found.</div>
        </div>
      </div>
    );
  }

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

  const handleSubmitResponse = async (responseType = null, optionValue = null) => {
    if (!campaign || !campaign.nodes) return;

    const steps = campaign.nodes
      .filter(n => n.type === 'video')
      .sort((a, b) => a.stepNumber - b.stepNumber);

    const currentStep = steps[currentStepIndex];
    const currentNode = campaign.nodes.find(n => n.stepNumber === currentStep?.stepNumber);

    // Prepare answer data based on response type
    let answerData = {};
    if (responseType === 'text') {
      answerData = { type: 'text', value: textResponse };
    } else if (responseType === 'video') {
      answerData = { type: 'video', value: 'Video recorded' };
    } else if (responseType === 'audio') {
      answerData = { type: 'audio', value: 'Audio recorded' };
    } else if (optionValue !== null) {
      answerData = { type: 'option', value: optionValue };
    } else if (currentStep?.answerType === 'contact-form') {
      answerData = { type: 'contact-form', value: formData };
    }

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
          // Save response before ending
          await saveResponse(answerData, true);
          setEndConfig({
            endMessage: matchingRule.endMessage || 'Thank you for your response!',
            ctaText: matchingRule.ctaText,
            ctaUrl: matchingRule.ctaUrl,
          });
          setCampaignEnded(true);
          return;
        } else if (matchingRule.targetType === 'url' && matchingRule.url) {
          // Save response before redirecting
          await saveResponse(answerData, true);
          window.location.href = matchingRule.url;
          return;
        } else if (matchingRule.targetType === 'node' && matchingRule.target) {
          const targetStepIndex = steps.findIndex(s => s.id === matchingRule.target);
          if (targetStepIndex !== -1) {
            // Save response before navigating
            await saveResponse(answerData, false);
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
      // Save response before moving to next step
      await saveResponse(answerData, false);
      handleNext();
    } else {
      // This is the last step - save as completed
      await saveResponse(answerData, true);
      setCampaignEnded(true);
      setEndConfig({ endMessage: 'Thank you for completing this campaign!' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await handleSubmitResponse();
  };

  const handleCancelResponse = () => {
    setShowResponseUI(null);
    setTextResponse('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Fullscreen Video Container */}
      <div className="w-full h-screen relative">
        {/* Video Background */}
        {currentStep.videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-black"
              src={currentStep.videoUrl}
            >
              Your browser does not support the video tag.
            </video>

            {/* Top overlay - Step counter */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-20">
              <div className="text-white text-xs sm:text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
            </div>

            {/* Unmute Button Overlay */}
            {isMuted && (
              <button
                onClick={toggleMute}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 hover:bg-red-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-110 flex items-center gap-3 animate-pulse backdrop-blur-sm z-30"
              >
                <i className="fas fa-volume-up text-2xl sm:text-3xl"></i>
                <span className="text-base sm:text-lg">Tap to Unmute</span>
              </button>
            )}

            {/* Bottom overlay - Content on video */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-20 max-h-[70vh] overflow-y-auto">
              {/* Question Title */}
              {currentStep.label && (
                <div className="mb-4 text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                    {currentStep.label}
                  </h2>
                </div>
              )}

              {/* Answer Type UI */}
              <div className="space-y-3 max-w-2xl mx-auto">
            {/* Multiple Choice */}
            {currentStep.answerType === 'multiple-choice' && (
              <>
                {currentStep.mcOptions && currentStep.mcOptions.length > 0 ? (
                  currentStep.mcOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitResponse(null, opt)}
                      className="w-full px-6 py-4 sm:py-5 bg-black/40 hover:bg-violet-600/60 text-white rounded-xl sm:rounded-2xl font-medium transition text-base sm:text-lg backdrop-blur-md border border-white/20"
                    >
                      {opt}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-white/70 py-4">No options available</div>
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
                      className="w-full px-6 py-4 sm:py-5 bg-violet-600/60 hover:bg-violet-700/70 text-white rounded-xl sm:rounded-2xl font-semibold transition text-base sm:text-lg backdrop-blur-md shadow-lg"
                    >
                      {btn.text}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-white/70 py-4">No buttons available</div>
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
                          <label className="block text-sm font-medium text-white mb-2">
                            {field.label}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.id] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 bg-black/50 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 backdrop-blur-md"
                          />
                        </div>
                      ))}
                    <button
                      type="submit"
                      className="w-full px-6 py-4 sm:py-5 bg-violet-600/60 hover:bg-violet-700/70 text-white rounded-xl sm:rounded-2xl font-semibold transition text-base sm:text-lg backdrop-blur-md shadow-lg"
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/70 py-4">No form fields configured</div>
                )}
              </form>
            )}

            {/* NPS Scale */}
            {currentStep.answerType === 'nps' && (
              <div className="space-y-4">
                <div className="text-center text-base text-white font-medium mb-4">
                  How likely are you to recommend us?
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmitResponse(null, i.toString())}
                      className="w-12 h-12 bg-black/40 hover:bg-violet-600/60 text-white rounded-xl font-bold transition backdrop-blur-md border border-white/20"
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-white/70">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* Calendar */}
            {currentStep.answerType === 'calendar' && (
              <div className="space-y-4">
                <div className="text-center text-base text-white font-medium mb-4">
                  📅 Select a date and time
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 backdrop-blur-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 backdrop-blur-md"
                      required
                    />
                  </div>
                  <button
                    onClick={() => handleSubmitResponse(null, `${selectedDate} ${selectedTime}`)}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full px-6 py-4 sm:py-5 bg-violet-600/60 hover:bg-violet-700/70 text-white rounded-xl sm:rounded-2xl font-semibold transition text-base sm:text-lg backdrop-blur-md shadow-lg disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                  >
                    Confirm Date & Time
                  </button>
                </div>
              </div>
            )}

            {/* File Upload */}
            {currentStep.answerType === 'file-upload' && (
              <div className="space-y-4">
                <div className="text-center text-base text-white font-medium mb-4">
                  📎 Upload a file
                </div>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-violet-500 transition bg-black/40 backdrop-blur-md">
                    <input
                      type="file"
                      onChange={(e) => setUploadedFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {!uploadedFile ? (
                        <div>
                          <div className="text-4xl mb-2">📄</div>
                          <div className="text-white mb-1">Click to upload a file</div>
                          <div className="text-sm text-white/70">or drag and drop</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-4xl mb-2">✅</div>
                          <div className="text-white font-medium">{uploadedFile.name}</div>
                          <div className="text-sm text-white/70 mt-1">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  <button
                    onClick={() => handleSubmitResponse(null, uploadedFile ? uploadedFile.name : 'No file')}
                    disabled={!uploadedFile}
                    className="w-full px-6 py-4 sm:py-5 bg-violet-600/60 hover:bg-violet-700/70 text-white rounded-xl sm:rounded-2xl font-semibold transition text-base sm:text-lg backdrop-blur-md shadow-lg disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                  >
                    Submit File
                  </button>
                </div>
              </div>
            )}

            {/* Open-Ended */}
            {currentStep.answerType === 'open-ended' && (
              <>
                {!showResponseUI ? (
                  <div className="flex gap-3 justify-center flex-wrap">
                    {currentStep.enabledResponseTypes?.video && (
                      <button
                        onClick={() => handleResponseClick('video')}
                        className="flex-1 min-w-[120px] py-4 bg-black/40 hover:bg-orange-600/60 text-white rounded-xl font-medium transition backdrop-blur-md border border-white/20"
                      >
                        📹 Video
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.audio && (
                      <button
                        onClick={() => handleResponseClick('audio')}
                        className="flex-1 min-w-[120px] py-4 bg-black/40 hover:bg-orange-600/60 text-white rounded-xl font-medium transition backdrop-blur-md border border-white/20"
                      >
                        🎤 Audio
                      </button>
                    )}
                    {currentStep.enabledResponseTypes?.text && (
                      <button
                        onClick={() => handleResponseClick('text')}
                        className="flex-1 min-w-[120px] py-4 bg-black/40 hover:bg-orange-600/60 text-white rounded-xl font-medium transition backdrop-blur-md border border-white/20"
                      >
                        📝 Text
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showResponseUI === 'video' && (
                      <div className="bg-black/40 rounded-xl p-10 text-center text-white backdrop-blur-md border border-white/20">
                        <i className="fas fa-video text-5xl mb-4"></i>
                        <p className="mb-4 text-lg">Video recording interface</p>
                        <div className="text-sm text-white/70">Click "Record" to start recording your video response</div>
                      </div>
                    )}
                    {showResponseUI === 'audio' && (
                      <div className="bg-black/40 rounded-xl p-10 text-center text-white backdrop-blur-md border border-white/20">
                        <i className="fas fa-microphone text-5xl mb-4"></i>
                        <p className="mb-4 text-lg">Audio recording interface</p>
                        <div className="text-sm text-white/70">Click "Record" to start recording your audio response</div>
                      </div>
                    )}
                    {showResponseUI === 'text' && (
                      <div>
                        <textarea
                          value={textResponse}
                          onChange={(e) => setTextResponse(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full p-4 bg-black/50 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 backdrop-blur-md"
                          rows="5"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelResponse}
                        className="flex-1 py-3 bg-black/40 hover:bg-black/60 text-white rounded-xl font-medium transition backdrop-blur-md border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitResponse(showResponseUI)}
                        className="flex-1 py-3 bg-violet-600/60 hover:bg-violet-700/70 text-white rounded-xl font-semibold transition backdrop-blur-md shadow-lg"
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
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-play-circle text-6xl text-gray-600 mb-4"></i>
              <div className="text-xl text-gray-400">No video</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
