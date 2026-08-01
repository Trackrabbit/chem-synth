import React from 'react';
import { FlaskConical, RefreshCw, Volume2, VolumeX, BookOpen, Sparkles, Beaker, Library, HelpCircle, Share2 } from 'lucide-react';
import { useLab } from '../context/LabProvider';

const Header = ({ audioEnabled, setAudioEnabled, setShowResetModal, onOpenRecipeLog, setShowHelp }) => {
  const { appMode, setAppMode } = useLab();

  const getThemeColors = () => {
    if (appMode === 'fantasy') return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    if (appMode === 'sandbox') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  };

  const getTextColor = () => {
    if (appMode === 'fantasy') return 'text-purple-400';
    if (appMode === 'sandbox') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ChemSynth Engine',
          text: 'Check out this chemical synthesis lab I built!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-800 relative z-10 gap-6">
      
      {/* Left Side: Logo and Toggles */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border transition-colors ${getThemeColors().split(' text-')[0]}`}>
             <FlaskConical className={`w-7 h-7 ${getTextColor()}`} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Chem<span className={getTextColor()}>Synth</span> 
            </h1>
            <span className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase">
              {appMode === 'fantasy' ? 'Alchemy Mode' : appMode === 'sandbox' ? 'Elliot’s Sandbox' : 'Elliot’s Chem Lab'}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-slate-900/80 border border-slate-700 rounded-lg p-1 backdrop-blur-sm w-full sm:w-auto justify-center">
          <button
            onClick={() => setAppMode('fantasy')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'fantasy' ? 'bg-purple-600/20 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Fantasy</span>
          </button>
          <button
            onClick={() => setAppMode('chemistry')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'chemistry' ? 'bg-emerald-600/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Beaker className="w-4 h-4" /> <span className="hidden sm:inline">Discovery</span>
          </button>
          <button
            onClick={() => setAppMode('sandbox')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'sandbox' ? 'bg-amber-600/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Library className="w-4 h-4" /> <span className="hidden sm:inline">Sandbox</span>
          </button>
        </div>
      </div>
      
      {/* Right Side: Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
        <button 
          onClick={handleShare}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700"
          title="Share this lab"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowHelp(true)} 
          className="text-slate-400 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <button onClick={onOpenRecipeLog} className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600">
          <BookOpen className="w-4 h-4" /> Recipes
        </button>
        <button onClick={() => setShowResetModal(true)} className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-xl border transition-all duration-300 ${audioEnabled ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;