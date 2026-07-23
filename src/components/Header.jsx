import React from 'react';
import { FlaskConical, RefreshCw, Volume2, VolumeX } from 'lucide-react';

// ---------------------------------------------------------
// COMPONENT: Header
// ---------------------------------------------------------
const Header = ({ audioEnabled, setAudioEnabled, setShowResetModal }) => (
  <header className="w-full max-w-5xl flex justify-between items-center mb-8 pb-4 border-b border-slate-800 relative z-10">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
         <FlaskConical className="text-emerald-400 w-7 h-7" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Chem<span className="text-emerald-400">Synth</span> 
        </h1>
        <span className="text-xs text-slate-500">CLOUD SYNC ACTIVE</span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={() => setShowResetModal(true)} 
        className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 transition-colors bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-600 backdrop-blur-sm"
      >
        <RefreshCw className="w-4 h-4" /> Reset
      </button>
      <button 
        onClick={() => setAudioEnabled(!audioEnabled)} 
        className={`p-2 rounded-xl border transition-all duration-300 backdrop-blur-sm ${audioEnabled ? 'bg-slate-900/50 border-slate-700 text-slate-300 hover:text-white' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
      >
        {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </div>
  </header>
);

export default Header;