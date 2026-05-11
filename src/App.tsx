import React, { useState, useEffect, useRef } from 'react';
import { Share2, RotateCcw, Home as HomeIcon, CheckCircle, SkipForward } from 'lucide-react';

const CATEGORIES = [
  {
    "id": "kenyan_celebs",
    "name": "Kenyan Celebs",
    "emoji": "🌟",
    "description": "Famous Kenyans across sport, music & TV",
    "words": [
      "Eliud Kipchoge", "Lupita Nyong'o", "Akothee", "Sauti Sol",
      "David Rudisha", "Eric Omondi", "Bien", "Willy Paul",
      "Nameless", "Juliani", "Abel Mutua", "Bahati",
      "Mercy Masika", "Octopizzo", "Victoria Kimani"
    ]
  },
  {
    "id": "kenyan_food",
    "name": "Kenyan Food & Drink",
    "emoji": "🍲",
    "description": "Dishes, drinks & street food from Kenya",
    "words": [
      "Ugali", "Nyama Choma", "Chapati", "Sukuma Wiki",
      "Githeri", "Mandazi", "Mutura", "Pilau",
      "Mahindi Choma", "Kachumbari", "Smokies Pasua", "Matumbo",
      "Mukimo", "Kenyan Tea", "Mursik"
    ]
  },
  {
    "id": "kenyan_places",
    "name": "Kenyan Places",
    "emoji": "📍",
    "description": "Cities, towns, parks & landmarks",
    "words": [
      "Nairobi", "Mombasa", "Kisumu", "Nakuru",
      "Maasai Mara", "Diani Beach", "Hell's Gate", "Lake Turkana",
      "Mount Kenya", "Eldoret", "Lamu Island", "Amboseli",
      "Thika", "Malindi", "Kibera"
    ]
  },
  {
    "id": "kenyan_slang",
    "name": "Kenyan Slang",
    "emoji": "🗣️",
    "description": "Sheng, Swahili & street lingo",
    "words": [
      "Sawa Sawa", "Poa Kichizi", "Niaje", "Hapo Sawa",
      "Maze", "Si Unajua", "Cheza Chini", "Baze",
      "Fiti", "Rada", "Wueh", "Kaa Rada",
      "Mshamba", "Omosh", "Wapi Dough"
    ]
  },
  {
    "id": "kenyan_sports",
    "name": "Kenyan Sports Heroes",
    "emoji": "🏃",
    "description": "Athletes, sports & achievements",
    "words": [
      "Eliud Kipchoge", "David Rudisha", "Vivian Cheruiyot",
      "Amos Kipruto", "Harambee Stars", "Gor Mahia",
      "AFC Leopards", "Achieng Abura", "Tabitha Wambui",
      "Kenya Sevens", "Fatuma Roba", "Mike Okumu",
      "Nancy Lagat", "Kenyan Safari Rally", "World Athletics"
    ]
  },
  {
    "id": "kenyan_culture",
    "name": "Kenyan Culture & Life",
    "emoji": "🎭",
    "description": "Traditions, events & everyday life",
    "words": [
      "Harambee", "Kikuyu", "Maasai", "Luhya",
      "Jamhuri Day", "Mashujaa Day", "Matatu", "Chama",
      "Kanjo", "Jua Kali", "Kiondo Basket", "Boda Boda",
      "Kibanda", "Baraza", "Shamba"
    ]
  }
];

function shuffle(array: string[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ScreenState = 'INTRO' | 'HOME' | 'CATEGORY_SELECT' | 'COUNTDOWN' | 'GAMEPLAY' | 'RESULTS';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('INTRO');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [wordQueue, setWordQueue] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [skippedWords, setSkippedWords] = useState<string[]>([]);
  const [tiltFeedback, setTiltFeedback] = useState<'correct' | 'skip' | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const lastTiltTime = useRef<number>(0);
  const currentWordIndexRef = useRef(0);
  const wordQueueRef = useRef<string[]>([]);

  // Update refs to avoid stale closures
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
    wordQueueRef.current = wordQueue;
  }, [currentWordIndex, wordQueue]);

  const handleCorrect = () => {
    setScore(s => s + 1);
    setCorrectWords(w => [...w, wordQueueRef.current[currentWordIndexRef.current]]);
    setTiltFeedback('correct');
    setTimeout(() => setTiltFeedback(null), 400);
    setCurrentWordIndex(i => i + 1);
  };

  const handleSkip = () => {
    setSkippedWords(w => [...w, wordQueueRef.current[currentWordIndexRef.current]]);
    setTiltFeedback('skip');
    setTimeout(() => setTiltFeedback(null), 400);
    setCurrentWordIndex(i => i + 1);
  };

  const requestPermission = async (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    setSelectedCategory(categoryId);
    setWordQueue(shuffle(category.words));
    setScore(0);
    setCurrentWordIndex(0);
    setCorrectWords([]);
    setSkippedWords([]);
    setTimeLeft(60);
    setCountdownValue(3);

    if (typeof (window as any).DeviceOrientationEvent !== 'undefined' && typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await (window as any).DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        } else {
          setPermissionGranted(false);
        }
      } catch (err) {
        console.error(err);
        setPermissionGranted(false);
      }
    } else {
      setPermissionGranted(true);
    }
    
    setScreen('COUNTDOWN');
  };

  // Device Tilt Detection
  useEffect(() => {
    if (screen !== 'GAMEPLAY') return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null) return;
      
      const now = Date.now();
      if (now - lastTiltTime.current < 800) return; // debounce 800ms

      const beta = event.beta;
      if (beta < -15) {
        lastTiltTime.current = now;
        handleCorrect();
      } else if (beta > 15) {
        lastTiltTime.current = now;
        handleSkip();
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [screen]);

  // Intro Sequence Timer
  useEffect(() => {
    if (screen === 'INTRO') {
      const timer = setTimeout(() => {
        setScreen('HOME');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Countdown timer logic
  useEffect(() => {
    if (screen === 'COUNTDOWN') {
      if (countdownValue > 0) {
        const timer = setTimeout(() => setCountdownValue(countdownValue - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setScreen('GAMEPLAY');
      }
    }
  }, [screen, countdownValue]);

  // Gameplay session timer
  useEffect(() => {
    if (screen === 'GAMEPLAY') {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setScreen('RESULTS');
      }
    }
  }, [screen, timeLeft]);

  const shareScore = async () => {
    const text = `I scored ${score}/${correctWords.length + skippedWords.length} in KUGUESS – Kenyan Edition! 🇰🇪🔥\nPlay at ${window.location.host}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KUGUESS',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Score copied to clipboard!');
    }
  };

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center absolute inset-0 z-50 bg-bg overflow-hidden flex-1">
      {/* Background patterned circles */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
         <div className="w-[120vw] h-[120vw] sm:w-[80vw] sm:h-[80vw] rounded-full border-primary absolute scale-0 animate-expand-ring" style={{animationDelay: '0.1s'}} />
         <div className="w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full border-gold absolute scale-0 animate-expand-ring" style={{animationDelay: '0.4s'}} />
         <div className="w-[40vw] h-[40vw] sm:w-[30vw] sm:h-[30vw] rounded-full border-accent absolute scale-0 animate-expand-ring" style={{animationDelay: '0.7s'}} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center animate-intro-logo">
        {/* African mask / tribal element (CSS based) */}
        <div className="mb-6 flex gap-2">
          <div className="w-4 h-12 bg-primary transform -skew-y-12"></div>
          <div className="w-4 h-16 bg-gold transform -skew-y-12 mt-2"></div>
          <div className="w-4 h-12 bg-accent transform skew-y-12 mt-4"></div>
          <div className="w-4 h-16 bg-gold transform skew-y-12 mt-2"></div>
          <div className="w-4 h-12 bg-primary transform skew-y-12"></div>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-9xl mb-1 tracking-widest intro-text uppercase" style={{ WebkitTextStroke: '2px #1E0C06' }}>
          Kuguess
        </h1>
        <div className="h-3 w-0 bg-primary mt-3 animate-expand-line"></div>
      </div>
      
      {/* Bottom pattern border */}
      <div className="absolute bottom-0 left-0 right-0 h-4 border-pattern"></div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center relative z-10">
      <div className="absolute top-0 left-0 right-0 h-4 border-pattern"></div>
      <div className="absolute bottom-0 left-0 right-0 h-4 border-pattern"></div>

      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-8">
        <h1 className="font-display text-6xl sm:text-7xl lg:text-9xl text-white mb-2 tracking-wide animate-pop uppercase drop-shadow-[0_4px_4px_rgba(234,42,43,0.8)]" style={{ WebkitTextStroke: '3px #1E0C06' }}>
          Kuguess
        </h1>
        <div className="bg-primary px-4 py-1 -skew-x-12 mb-10 shadow-lg">
          <p className="text-xl font-bold text-white skew-x-12 uppercase tracking-widest">The Kenyan Party Game</p>
        </div>
        
        <p className="text-white/80 max-w-sm mb-12 text-lg font-medium bg-card-bg/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
          Hold your phone to your forehead and guess!
        </p>

        <button 
          onClick={() => setScreen('CATEGORY_SELECT')}
          className="bg-primary hover:bg-[#E55928]/90 active:scale-95 text-white font-bold py-6 px-20 min-h-[56px] rounded-full text-3xl font-display transition-all shadow-[0_8px_0_#9D2A0F] active:shadow-[0_0px_0_#9D2A0F] active:translate-y-2 uppercase tracking-widest border-2 border-[#FFE8D6]"
        >
          Play
        </button>
      </div>
    </div>
  );

  const renderCategorySelect = () => (
    <div className="flex flex-col h-full w-full p-4 md:p-6 overflow-y-auto relative z-10">
      <div className="flex items-center mb-6 mt-4">
        <button 
          onClick={() => setScreen('HOME')}
          className="p-3 mr-4 bg-card-bg rounded-full border border-gray-700 hover:bg-gray-800 transition active:scale-95"
        >
          <HomeIcon size={24} />
        </button>
        <h2 className="font-display text-3xl font-bold">Pick a Category</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => requestPermission(cat.id)}
            className="flex items-center text-left bg-card-bg hover:bg-[#3d1d0c] min-h-[80px] rounded-2xl p-5 border-l-8 border-l-primary border-y border-y-white/5 border-r border-r-white/5 transition active:scale-[0.98] shadow-lg"
          >
            <div className="text-4xl mr-4 drop-shadow">{cat.emoji}</div>
            <div>
              <h3 className="font-bold text-lg">{cat.name}</h3>
              <p className="text-sm text-gray-400">{cat.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCountdown = () => (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center bg-bg relative z-20">
      <div className="absolute inset-0 border-[16px] border-pattern opacity-50 m-4 rounded-[40px] pointer-events-none"></div>
      <p className="text-2xl text-gold font-bold mb-8 animate-bounce uppercase tracking-widest relative z-10 px-4 py-2 bg-card-bg/80 rounded-xl" style={{ WebkitTextStroke: '1px #1E0C06' }}>
        Raise the phone to your forehead!
      </p>
      <div className="font-display text-[150px] font-bold text-primary drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-pop relative z-10" key={countdownValue} style={{ WebkitTextStroke: '4px #EBD5B3' }}>
        {countdownValue > 0 ? countdownValue : 'GO!'}
      </div>
    </div>
  );

  const renderGameplay = () => {
    let word = currentWordIndex < wordQueue.length ? wordQueue[currentWordIndex] : "FINISHED!";

    return (
      <div className="flex flex-col h-full w-full relative overflow-hidden bg-bg">
        {/* Rotation Prompt Banner */}
        <div className="hidden portrait:flex absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-gold text-black px-4 py-2 rounded-full shadow-lg items-center justify-center font-bold text-sm w-[90%] whitespace-nowrap">
           <RotateCcw size={18} className="mr-2" /> Please rotate phone to landscape
        </div>

        {/* Tilt Feedback Flashes */}
        {tiltFeedback === 'correct' && (
          <div className="absolute inset-0 z-50 bg-correct/90 flex items-center justify-center animate-fade-out">
            <CheckCircle size={140} className="text-white drop-shadow-2xl" />
          </div>
        )}
        {tiltFeedback === 'skip' && (
          <div className="absolute inset-0 z-50 bg-skip/90 flex items-center justify-center animate-fade-out">
            <SkipForward size={140} className="text-white drop-shadow-2xl" />
          </div>
        )}

        {/* Top Bar with Timer */}
        <div className="w-full flex items-center px-6 pt-6 pb-3 justify-between z-10 bg-gradient-to-b from-bg/90 to-transparent">
          <div className="text-xl font-bold text-white/70">Score: <span className="text-white ml-2 text-3xl font-display">{score}</span></div>
          <div className={`font-display text-4xl font-bold drop-shadow ${timeLeft <= 10 ? 'text-accent animate-pulse' : 'text-gold'}`}>
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
        
        {/* Timer Progress Bar */}
        <div className="w-full h-4 bg-card-bg z-10 border-b border-white/10">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-accent' : 'bg-gold'}`}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>

        {/* Main Word Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="font-display text-6xl md:text-8xl xl:text-9xl font-bold break-words w-full px-4 text-white uppercase drop-shadow-2xl leading-tight" style={{ WebkitTextStroke: '2px #000' }}>
            {word}
          </div>
        </div>

        {/* Fallback Buttons - Visible if permission not granted OR always visible on portrait as a fallback for non-gyro devices */}
        <div className="w-full flex flex-row gap-4 p-6 z-10 pb-8 portrait:flex landscape:hidden">
            <button 
              onClick={handleSkip}
              className="flex-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold py-8 px-4 rounded-3xl min-h-[56px] flex flex-col items-center justify-center border-b-8 border-amber-900 shadow-xl"
            >
               <SkipForward size={36} className="mb-2" />
               <span className="uppercase tracking-widest text-lg">Skip (Up)</span>
            </button>
            <button 
              onClick={handleCorrect}
              className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-8 px-4 rounded-3xl min-h-[56px] flex flex-col items-center justify-center border-b-8 border-green-900 shadow-xl"
            >
               <CheckCircle size={36} className="mb-2" />
               <span className="uppercase tracking-widest text-lg">Correct (Down)</span>
            </button>
        </div>
        
        {/* Hidden on portrait, but shown if permission granted is false on landscape */}
        {!permissionGranted && (
          <div className="hidden landscape:flex absolute bottom-6 left-0 right-0 flex-row justify-center gap-8 z-10">
              <button onClick={handleSkip} className="bg-amber-600 active:bg-amber-800 text-white py-5 px-16 min-h-[56px] rounded-full font-bold uppercase text-xl border-b-4 border-amber-900 shadow-lg">Skip</button>
              <button onClick={handleCorrect} className="bg-green-600 active:bg-green-800 text-white py-5 px-16 min-h-[56px] rounded-full font-bold uppercase text-xl border-b-4 border-green-900 shadow-lg">Correct</button>
          </div>
        )}

      </div>
    );
  };

  const renderResults = () => {
    return (
      <div className="flex flex-col h-full w-full p-4 md:p-6 overflow-hidden relative z-10">
        <h2 className="font-display text-4xl text-center text-accent mt-4 mb-2 drop-shadow">Time's Up!</h2>
        <p className="text-xl text-center mb-6">
          You got <span className="font-bold text-correct text-4xl mx-2 drop-shadow-md">{score}</span> right!
        </p>

        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">
          {/* Correct List */}
          <div className="flex-1 flex flex-col min-h-0 bg-card-bg/60 rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg backdrop-blur-sm">
            <div className="bg-correct/10 border-b border-correct/20 p-4 flex items-center justify-center text-correct font-bold text-lg">
              <CheckCircle size={22} className="mr-2" /> Got It
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {correctWords.length === 0 && <p className="text-gray-500 text-center italic mt-4">None right</p>}
              {correctWords.map((w, i) => (
                <div key={i} className="text-white border-b border-gray-800/50 pb-2 text-center text-lg">{w}</div>
              ))}
            </div>
          </div>

          {/* Skipped List */}
          <div className="flex-1 flex flex-col min-h-0 bg-card-bg/60 rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg backdrop-blur-sm">
             <div className="bg-skip/10 border-b border-skip/20 p-4 flex items-center justify-center text-skip font-bold text-lg">
               <SkipForward size={22} className="mr-2" /> Skipped
             </div>
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
               {skippedWords.length === 0 && <p className="text-gray-500 text-center italic mt-4">None skipped</p>}
               {skippedWords.map((w, i) => (
                 <div key={i} className="text-gray-400 border-b border-gray-800/50 pb-2 text-center text-lg line-through opacity-70">{w}</div>
               ))}
             </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 pb-4">
          <button 
            onClick={shareScore}
            className="w-full bg-primary hover:bg-opacity-90 active:scale-[0.98] transition text-white font-bold py-5 px-6 min-h-[56px] rounded-2xl flex items-center justify-center uppercase tracking-wider shadow-[0_6px_0_#9D2A0F] active:shadow-[0_0px_0_#9D2A0F] active:translate-y-1 border-2 border-[#FFE8D6] text-lg font-display"
          >
            <Share2 className="mr-3" /> Share Score
          </button>
          
          <div className="flex gap-4">
            <button 
               onClick={() => setScreen('HOME')}
               className="flex-1 bg-card-bg active:scale-[0.98] transition border-2 border-white/20 text-white font-bold py-4 px-6 min-h-[56px] rounded-2xl flex items-center justify-center uppercase tracking-wider shadow-md font-display"
            >
              <HomeIcon className="mr-2" size={20} /> Home
            </button>

             <button 
               onClick={() => setScreen('CATEGORY_SELECT')}
               className="flex-1 bg-gold hover:bg-yellow-500 active:scale-[0.98] transition text-[#1E0C06] font-bold py-4 px-6 min-h-[56px] rounded-2xl flex items-center justify-center uppercase tracking-wider shadow-[0_6px_0_#b57f00] active:shadow-[0_0px_0_#b57f00] active:translate-y-1 font-display"
             >
               <RotateCcw className="mr-2" size={20} /> Play Again
             </button>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="h-full w-full bg-maasai-pattern text-white overflow-hidden relative font-sans select-none touch-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; display: none; }
        }
        .animate-fade-out {
          animation: fade-out 0.4s ease-out forwards;
        }
      `}} />
      
      {/* Background glow effects to make it feel premium */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="h-full w-full relative z-10 flex flex-col max-w-4xl mx-auto drop-shadow-2xl shadow-black">
        {screen === 'INTRO' && renderIntro()}
        {screen === 'HOME' && renderHome()}
        {screen === 'CATEGORY_SELECT' && renderCategorySelect()}
        {screen === 'COUNTDOWN' && renderCountdown()}
        {screen === 'GAMEPLAY' && renderGameplay()}
        {screen === 'RESULTS' && renderResults()}
      </div>
    </div>
  );
}

