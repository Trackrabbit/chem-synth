import React, { useState, useEffect } from 'react';
import { Heart, FlaskConical } from 'lucide-react';
import { useLab } from '../context/LabProvider';

const Footer = () => {
  const { appMode } = useLab();
  const [particles, setParticles] = useState([]);
  const [ugaModeActive, setUgaModeActive] = useState(false);

  // Theme configuration
  let themeColorText = "text-emerald-400";
  let themeColorBg = "bg-emerald-500/10";
  let themeColorBorder = "border-emerald-500/30";
  let themeColorShadow = "shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  let heartColor = "text-emerald-500";
  let iconColor = "text-emerald-500/70";
  let particleColors = ['#10b981', '#34d399', '#a7f3d0'];

  if (appMode === 'sandbox') {
    themeColorText = "text-amber-400";
    themeColorBg = "bg-amber-500/10";
    themeColorBorder = "border-amber-500/30";
    themeColorShadow = "shadow-[0_0_10px_rgba(251,191,36,0.15)]";
    heartColor = "text-amber-500";
    iconColor = "text-amber-500/70";
    particleColors = ['#f59e0b', '#fbbf24', '#fde68a'];
  } else if (appMode === 'fantasy') {
    themeColorText = "text-indigo-400";
    themeColorBg = "bg-indigo-500/10";
    themeColorBorder = "border-indigo-500/30";
    themeColorShadow = "shadow-[0_0_10px_rgba(99,102,241,0.15)]";
    heartColor = "text-indigo-500";
    iconColor = "text-indigo-500/70";
    particleColors = ['#6366f1', '#818cf8', '#c7d2fe'];
  }

  const handleBadgeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const burstOriginX = rect.left + rect.width / 2;
    const burstOriginY = rect.top + rect.height / 2;

    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      x: burstOriginX,
      y: burstOriginY,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      icon: Math.random() > 0.6 ? '❤️' : Math.random() > 0.5 ? '✨' : '💖',
      angle: Math.random() * 360,
      velocity: Math.random() * 200 + 100
    }));

    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  };

  useEffect(() => {
    let keySequence = '';
    const secretCode = 'uga';
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      keySequence += e.key.toLowerCase();
      if (keySequence.length > secretCode.length) keySequence = keySequence.slice(-secretCode.length);
      if (keySequence === secretCode) { triggerUgaExplosion(); keySequence = ''; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerUgaExplosion = () => {
    setUgaModeActive(true);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const ugaParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: `uga-${Date.now()}-${i}`,
      x: screenWidth / 2,
      y: screenHeight / 2,
      color: Math.random() > 0.5 ? '#dc2626' : '#171717',
      icon: Math.random() > 0.7 ? '🏈' : '🐾',
      angle: Math.random() * 360,
      isUga: true
    }));
    setParticles(prev => [...prev, ...ugaParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !p.isUga));
      setUgaModeActive(false);
    }, 2500);
  };

  return (
    <>
      <style>
        {`
          @keyframes ugaExplode {
            0% { transform: translate(-50%, -50%) scale(0.1) rotate(0deg); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(2) rotate(var(--rot)); opacity: 0; }
          }
          @keyframes dramaticBurst {
            0% { transform: translate(-50%, -50%) scale(0.2) rotate(0deg); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(2) rotate(var(--rot)); opacity: 0; }
          }
          @keyframes dawgBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1) translateY(-10px); }
          }
        `}
      </style>

      {particles.map(p => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50 text-3xl sm:text-4xl"
          style={{
            left: p.x,
            top: p.y,
            color: p.color,
            animation: p.isUga 
              ? `ugaExplode 2s cubic-bezier(0.25, 1, 0.5, 1) forwards` 
              : `dramaticBurst 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
            '--rot': `${p.angle}deg`,
            '--tx': p.isUga ? `${Math.cos(p.angle) * (Math.random() * 300 + 100)}px` 
                            : `${Math.cos(p.angle * Math.PI / 180) * (p.velocity || 150)}px`,
            '--ty': p.isUga ? `${Math.sin(p.angle) * (Math.random() * 300 + 100)}px` 
                            : `${Math.sin(p.angle * Math.PI / 180) * (p.velocity || 150)}px`,
          }}
        >
          {p.icon}
        </div>
      ))}

      {ugaModeActive && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <h1 className="text-6xl md:text-8xl font-black text-red-600 uppercase tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '3px #171717', animation: 'dawgBounce 0.5s ease-in-out infinite' }}>GO DAWGS!</h1>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 w-full z-30 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs shadow-[0_-5px_20px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex items-center gap-3 text-slate-500 font-medium tracking-wide">
           <div className="flex items-center gap-1.5 text-slate-400">
             <FlaskConical className={`w-3.5 h-3.5 ${iconColor} transition-colors duration-300`} />
             <span>ChemSynth Engine <span className="opacity-50 text-[10px]">v3.0</span></span>
           </div>
           <span className="hidden sm:inline opacity-30">|</span>
           <span className="hidden sm:inline">&copy; 2026 Adam Page. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-semibold tracking-widest uppercase mt-2 sm:mt-0">
          <span className="text-[10px] sm:text-xs">Built and coded for</span>
          <button 
            onClick={handleBadgeClick}
            className={`flex items-center gap-1.5 ${themeColorBg} px-2.5 py-1 rounded-md border ${themeColorBorder} ${themeColorShadow} hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer`}
            title="Click for a surprise!"
          >
            <span className={`${themeColorText} font-bold transition-colors duration-300`}>Elliot Page</span>
            <Heart className={`w-3.5 h-3.5 ${heartColor} animate-pulse transition-colors duration-300`} />
          </button>
        </div>
      </footer>
    </>
  );
};

export default Footer;