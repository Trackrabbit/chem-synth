import React from 'react';

const DuplicateModal = ({ isOpen, knownResult, onConfirm, onCancel }) => {
  if (!isOpen || !knownResult) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 uppercase tracking-wider">
          Recipe Known
        </h2>
        
        <p className="text-slate-300 text-lg mb-6">
          You have already combined these elements to create <br/>
          <span className="text-3xl inline-block mt-3 mb-1">{knownResult.emoji}</span><br/>
          <span className="font-bold text-indigo-400 text-xl">{knownResult.name}</span>.
        </p>
        
        <p className="text-slate-400 text-sm mb-8 italic">
            You might synthesize something entirely new... or you might just make the exact same thing again. Risk running the experiment?
            </p>
            
            <div className="flex justify-center gap-4">
            <button 
                onClick={onCancel}
                className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            >
                Re-Roll Experiment
            </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateModal;