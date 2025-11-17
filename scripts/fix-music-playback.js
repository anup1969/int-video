const fs = require('fs');
let content = fs.readFileSync('pages/campaign/[id].js', 'utf8');

// 1. Remove music playback from response button clicks
const oldHandler = `  const handleResponseClick = (type) => {
    setShowResponseUI(type);
    // Start background music when user opens response UI
    if (type === "video" || type === "audio" || type === "text") {
      startBackgroundMusic();
    }
  };`;

const newHandler = `  const handleResponseClick = (type) => {
    setShowResponseUI(type);
  };`;

content = content.replace(oldHandler, newHandler);

// 2. Add useEffect to auto-play music when TEXT slide loads
// Find the useEffect section and add a new one for music
const musicAutoPlayEffect = `
  // Auto-play background music for TEXT slides
  useEffect(() => {
    if (!loading && currentStep && currentStep.slideType === 'text') {
      startBackgroundMusic();
    }
    return () => {
      stopBackgroundMusic();
    };
  }, [currentStepIndex, loading]);
`;

// Insert after stopBackgroundMusic function
const stopMusicFunc = `  const stopBackgroundMusic = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
    }
  };`;

content = content.replace(stopMusicFunc, stopMusicFunc + musicAutoPlayEffect);

fs.writeFileSync('pages/campaign/[id].js', content);
console.log('Fixed music playback: removed from response clicks, added auto-play for TEXT slides');
