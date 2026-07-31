import React, { useState } from 'react';

const DiscoveryModal = ({ isVisible, newElement, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !newElement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-500">
        
        {/* The main glowing card */}
        <div className="relative flex flex-col items-center justify-center p-8 md:p-10 max-h-[90vh] w-full max-w-2xl bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.4)] animate-pulse">
        
        {/* Tier Badge */}
        <div className="absolute top-4 right-4 z-20 bg-indigo-900 border border-indigo-400 text-indigo-300 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          Tier {newElement.tier || 1}
        </div>

        {/* Background ambient glow */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500 opacity-20 blur-2xl"></div>
        
        <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 drop-shadow-lg uppercase tracking-widest text-center mt-4 md:mt-0">
          {newElement.isEureka ? "Eureka! Variant Found!" : "New Discovery!"}
        </h2>
        
        {/* Element Icon/Graphic Container */}
        <div className="z-10 flex items-center justify-center w-24 h-24 md:w-32 md:h-32 mb-6 shrink-0 bg-slate-800 border-4 border-yellow-400 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)]">
          <span className="text-5xl md:text-6xl">{newElement.emoji || '✨'}</span>
        </div>
        
        {/* Element Name */}
        <h3 className="z-10 text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 mb-4 text-center shrink-0">
          {newElement.name}
        </h3>

        {/* Chemistry Stats Grid (Dynamically renders only if data exists) */}
        <div className="z-10 flex flex-wrap justify-center gap-2 mb-6 w-full px-2 max-w-lg">
          {newElement.formula && newElement.formula !== "N/A" && (
             <span className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md text-sm font-mono shadow-sm">
               {newElement.formula}
             </span>
          )}
          {newElement.molarMass && newElement.molarMass !== "N/A" && (
             <span className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md text-sm shadow-sm">
               {newElement.molarMass}
             </span>
          )}
          {newElement.state && (
             <span className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md text-sm shadow-sm capitalize">
               {newElement.state}
             </span>
          )}
          {newElement.geometry && newElement.geometry !== "N/A" && (
             <span className="bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md text-sm shadow-sm">
               {newElement.geometry}
             </span>
          )}
          {newElement.hazardLevel && (
             <span className={`border px-3 py-1.5 rounded-md text-sm shadow-sm font-semibold tracking-wide uppercase ${
               newElement.hazardLevel === 'Danger' ? 'bg-red-950/60 border-red-500/50 text-red-400' :
               newElement.hazardLevel === 'Caution' ? 'bg-yellow-950/60 border-yellow-500/50 text-yellow-400' :
               'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
             }`}>
               {newElement.hazardLevel}
             </span>
          )}
        </div>
        
        {/* Expandable Flavor Text / Lab Notes */}
        <div className="z-10 w-full mb-8 flex flex-col items-center">
          <div className={`w-full transition-all duration-300 custom-scrollbar px-4 md:px-6 py-4 bg-slate-950/40 border-y border-slate-700/50 shadow-inner ${isExpanded ? 'max-h-[40vh] overflow-y-auto' : ''}`}>
            <p className={`text-slate-300 italic text-left text-sm md:text-base whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
              {newElement.description || "A powerful new essence has been brought into the world."}
            </p>
          </div>
          
          {newElement.description && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-indigo-950/50 px-4 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40"
            >
              {isExpanded ? 'Collapse Analysis' : 'Read Full Analysis'}
            </button>
          )}
        </div>
        
        {/* Collect Button */}
        <button 
          onClick={() => {
            setIsExpanded(false); 
            onClose();
          }}
          className="z-10 px-10 py-3 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] active:scale-95 shrink-0"
        >
          Collect
        </button>
      </div>
    </div>
  );
};

export default DiscoveryModal;