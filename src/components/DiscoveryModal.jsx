import React from 'react';

const DiscoveryModal = ({ isVisible, newElement, onClose }) => {
  if (!isVisible || !newElement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500">
        {/* The main glowing card */}
        <div className="relative flex flex-col items-center justify-center p-10 bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.4)] animate-pulse">
        
        {/* Tier Badge */}
        <div className="absolute top-4 right-4 z-20 bg-indigo-900 border border-indigo-400 text-indigo-300 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          Tier {newElement.tier || 1}
        </div>

        {/* Background ambient glow */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500 opacity-20 blur-2xl"></div>
        
        <h2 className="z-10 text-2xl font-bold tracking-widest text-indigo-300 mb-6 uppercase">
          Synthesis Successful
        </h2>
        
        {/* Element Icon/Graphic Container */}
        <div className="z-10 flex items-center justify-center w-32 h-32 mb-6 bg-slate-800 border-4 border-yellow-400 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)]">
          {/* We can swap this for your actual ChemicalGraphic component later */}
          <span className="text-6xl">{newElement.emoji || '✨'}</span>
        </div>
        
        {/* Element Name */}
        <h3 className="z-10 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 mb-4 text-center">
          {newElement.name}
        </h3>
        
        {/* Flavor Text / Lore */}
        <p className="z-10 text-slate-300 mb-8 italic text-center max-w-sm text-lg">
          {newElement.description || "A powerful new essence has been brought into the world."}
        </p>
        
        {/* Collect Button */}
        <button 
          onClick={onClose}
          className="z-10 px-10 py-3 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] active:scale-95"
        >
          Collect
        </button>
      </div>
    </div>
  );
};

export default DiscoveryModal;