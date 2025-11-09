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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase();

        setTranscript(transcriptText);

        // Check for wake word
        if (!wakeWordDetected.current && (transcriptText.includes('hey jarvis') || transcriptText.includes('hey javis') || transcriptText.includes('hi jarvis'))) {
          wakeWordDetected.current = true;
          setIsActive(true);
          showFeedback('Yes, how can I help?', 'success');
          setTranscript('');
          return;
        }

        // Process commands after wake word detected
        if (wakeWordDetected.current && event.results[current].isFinal) {
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
        showFeedback(`Error: ${event.error}`, 'error');
      };

      recognitionRef.current.onend = () => {
        // Restart listening if still active
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

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
    console.log('Processing command:', command);

    // Deactivate after processing command
    wakeWordDetected.current = false;
    setIsActive(false);

    try {
      // Create new campaign
      if (command.includes('create') && command.includes('campaign')) {
        const nameMatch = command.match(/(?:named?|called?)\s+(.+)/i);
        const campaignName = nameMatch ? nameMatch[1].trim() : `New Campaign ${Date.now()}`;

        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: campaignName })
        });

        if (response.ok) {
          const data = await response.json();
          showFeedback(`Campaign "${campaignName}" created successfully!`, 'success');
          // Redirect to builder after 1 second
          setTimeout(() => {
            router.push(`/builder/${data.campaign.id}`);
          }, 1000);
        } else {
          showFeedback('Failed to create campaign', 'error');
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
      {/* Floating Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-300 ${
          isListening
            ? isActive
              ? 'bg-green-500 hover:bg-green-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
            : 'bg-violet-600 hover:bg-violet-700'
        }`}
        title={isListening ? 'Stop Voice Assistant' : 'Start Voice Assistant'}
      >
        {isListening ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.913 2.706.75.75 0 11-1.442.366 4.512 4.512 0 00-1.447-2.142.75.75 0 01-.354-.882l.157-.472a6.01 6.01 0 00-1.783-.68A1.75 1.75 0 0013 5a2.5 2.5 0 00-5 0 1.75 1.75 0 00-.356.218 6.01 6.01 0 00-1.783.68l.157.472a.75.75 0 01-.354.882 4.512 4.512 0 00-1.447 2.142.75.75 0 11-1.442-.366zM10 14a4 4 0 004-4v-1.5a.5.5 0 00-.5-.5h-7a.5.5 0 00-.5.5V10a4 4 0 004 4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

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
