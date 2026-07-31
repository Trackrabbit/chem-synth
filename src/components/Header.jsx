import React from 'react';
import { FlaskConical, RefreshCw, Volume2, VolumeX, BookOpen, Sparkles, Beaker, Library, HelpCircle } from 'lucide-react';
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

  return (
    <header className="w-full max-w-5xl flex justify-between items-center mb-8 pb-4 border-b border-slate-800 relative z-10">
      
      {/* Left Side */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border transition-colors ${getThemeColors().split(' text-')[0]}`}>
             <FlaskConical className={`w-7 h-7 ${getTextColor()}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Chem<span className={getTextColor()}>Synth</span> 
            </h1>
            <span className="text-xs text-slate-500 tracking-wider font-semibold uppercase">
              {appMode === 'fantasy' ? 'ALCHEMY MODE' : appMode === 'sandbox' ? 'ELLIOTS SANDBOX' : 'ELLIOTS CHEM LAB'}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-slate-900/80 border border-slate-700 rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={() => setAppMode('fantasy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'fantasy' ? 'bg-purple-600/20 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Sparkles className="w-4 h-4" /> Fantasy
          </button>
          <button
            onClick={() => setAppMode('chemistry')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'chemistry' ? 'bg-emerald-600/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Beaker className="w-4 h-4" /> Discovery
          </button>
          <button
            onClick={() => setAppMode('sandbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${appMode === 'sandbox' ? 'bg-amber-600/20 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Library className="w-4 h-4" /> Sandbox
          </button>
        </div>
      </div>
      
      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Handbook Trigger */}
        <button 
          onClick={() => setShowHelp(true)} 
          className="text-slate-400 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20"
          title="Field Researcher’s Handbook"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <button onClick={onOpenRecipeLog} className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600 backdrop-blur-sm">
          <BookOpen className="w-4 h-4" /> Recipes
        </button>
        <button onClick={() => setShowResetModal(true)} className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600 backdrop-blur-sm">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
        <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-xl border transition-all duration-300 backdrop-blur-sm ${audioEnabled ? 'bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;