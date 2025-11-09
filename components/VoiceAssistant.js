import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function VoiceAssistant() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);
  const wakeWordDetected = useRef(false);

  // Initialize speech recognition and auto-start
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase().trim();

        console.log('Transcript:', transcriptText, 'isFinal:', event.results[current].isFinal);

        setTranscript(transcriptText);

        // Only process final results
        if (!event.results[current].isFinal) {
          return;
        }

        // Check for wake word
        if (!wakeWordDetected.current && (transcriptText.includes('hey jarvis') || transcriptText.includes('hey javis') || transcriptText.includes('hi jarvis'))) {
          wakeWordDetected.current = true;
          setIsActive(true);
          showFeedback('Yes, how can I help?', 'success');
          setTranscript('');
          console.log('Wake word detected! Ready for command...');
          return;
        }

        // Process commands after wake word detected
        if (wakeWordDetected.current) {
          console.log('Processing command:', transcriptText);
          processCommand(transcriptText);
          setTranscript('');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Don't show error for no-speech, just keep listening
          return;
        }
        if (event.error === 'not-allowed') {
          showFeedback('Microphone permission denied', 'error');
          setIsListening(false);
          return;
        }
        showFeedback(`Error: ${event.error}`, 'error');
      };

      recognitionRef.current.onend = () => {
        // Restart listening automatically
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }
      };

      // Auto-start listening on mount
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Voice assistant auto-started. Say "Hey Jarvis" to activate.');
      } catch (e) {
        console.error('Error auto-starting recognition:', e);
      }
    } else {
      showFeedback('Speech recognition not supported in this browser', 'error');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showFeedback('Listening for "Hey Jarvis"...', 'info');
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    } else {
      showFeedback('Speech recognition not supported in this browser', 'error');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsActive(false);
      wakeWordDetected.current = false;
      setTranscript('');
      showFeedback('Voice assistant stopped', 'info');
    }
  };

  const showFeedback = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const processCommand = async (command) => {
    console.log('[Jarvis] Processing command:', command);

    // Deactivate after processing command
    wakeWordDetected.current = false;
    setIsActive(false);

    try {
      // Create new campaign
      if (command.includes('create') && command.includes('campaign')) {
        console.log('[Jarvis] Creating campaign...');
        const nameMatch = command.match(/(?:named?|called?)\s+(.+)/i);
        const campaignName = nameMatch ? nameMatch[1].trim() : `New Campaign ${Date.now()}`;

        console.log('[Jarvis] Campaign name:', campaignName);
        showFeedback(`Creating campaign "${campaignName}"...`, 'info');

        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: campaignName })
        });

        console.log('[Jarvis] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Jarvis] Campaign created:', data);
          showFeedback(`Campaign "${campaignName}" created successfully!`, 'success');
          // Redirect to builder after 1 second
          setTimeout(() => {
            router.push(`/?id=${data.campaign.id}`);
          }, 1000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Jarvis] Failed to create campaign:', errorData);
          showFeedback(`Failed to create campaign: ${errorData.error || 'Unknown error'}`, 'error');
        }
        return;
      }

      // Go to dashboard
      if (command.includes('go to dashboard') || command.includes('show dashboard') || command.includes('open dashboard')) {
        showFeedback('Opening dashboard...', 'success');
        router.push('/dashboard');
        return;
      }

      // Go to responses
      if (command.includes('go to response') || command.includes('show response')) {
        showFeedback('Opening responses...', 'success');
        router.push('/responses');
        return;
      }

      // Show campaigns
      if (command.includes('show') && command.includes('campaign')) {
        showFeedback('Opening dashboard...', 'success');
        router.push('/dashboard');
        return;
      }

      // Delete campaign (requires confirmation)
      if (command.includes('delete') && command.includes('campaign')) {
        showFeedback('Please use the dashboard to delete campaigns for safety', 'warning');
        return;
      }

      // Add step (only works in builder)
      if (command.includes('add') && (command.includes('step') || command.includes('video') || command.includes('question'))) {
        if (router.pathname.includes('/builder/')) {
          let stepType = 'open-ended'; // default

          if (command.includes('video')) stepType = 'open-ended';
          else if (command.includes('multiple choice') || command.includes('multiple-choice')) stepType = 'multiple-choice';
          else if (command.includes('button')) stepType = 'button';
          else if (command.includes('contact form')) stepType = 'contact-form';
          else if (command.includes('nps')) stepType = 'nps';
          else if (command.includes('file upload')) stepType = 'file-upload';
          else if (command.includes('text')) stepType = 'text';

          showFeedback(`Adding ${stepType} step... Please use the builder UI`, 'info');
        } else {
          showFeedback('This command only works in the campaign builder', 'warning');
        }
        return;
      }

      // Save campaign
      if (command.includes('save') && command.includes('campaign')) {
        if (router.pathname.includes('/builder/')) {
          showFeedback('Please use the Save button in the builder', 'info');
        } else {
          showFeedback('This command only works in the campaign builder', 'warning');
        }
        return;
      }

      // Help command
      if (command.includes('help') || command.includes('what can you do')) {
        showFeedback('Commands: create campaign, go to dashboard, show campaigns, add step', 'info');
        return;
      }

      // Unknown command
      showFeedback('Sorry, I didn\'t understand that command', 'warning');

    } catch (error) {
      console.error('Command execution error:', error);
      showFeedback('Error executing command', 'error');
    }
  };

  return (
    <>
      {/* Floating Button with Status */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative ${
            isListening
              ? isActive
                ? 'bg-green-500 hover:bg-green-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
          title={isListening ? (isActive ? 'Listening for command...' : 'Listening for "Hey Jarvis"') : 'Voice Assistant stopped'}
        >
          {/* Subtle breathing animation ring when listening but not active */}
          {isListening && !isActive && (
            <div className="absolute inset-0 rounded-full bg-blue-300 animate-ping opacity-20"></div>
          )}

          <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Status indicator */}
        {isListening && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className={`text-xs font-medium px-2 py-1 rounded ${isActive ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
              {isActive ? '🎤 Listening' : '👂 Say "Hey Jarvis"'}
            </div>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {isListening && transcript && (
        <div className="fixed bottom-28 right-8 bg-white rounded-lg shadow-xl p-4 max-w-xs z-50">
          <div className="text-sm text-gray-600 mb-1">
            {isActive ? 'Command:' : 'Listening...'}
          </div>
          <div className="text-base font-medium text-gray-900">
            {transcript}
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-8 right-8 rounded-lg shadow-xl p-4 max-w-sm z-50 animate-slideIn ${
          feedback.type === 'success' ? 'bg-green-500 text-white' :
          feedback.type === 'error' ? 'bg-red-500 text-white' :
          feedback.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {feedback.type === 'success' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {feedback.type === 'error' && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {(feedback.type === 'warning' || feedback.type === 'info') && (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-sm font-medium">
              {feedback.message}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
