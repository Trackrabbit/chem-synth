import React from 'react';
import { X, Book, FlaskConical, Sparkles, Bot, Keyboard } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/80 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Book className="w-6 h-6 text-emerald-400" /> Researcher's Handbook
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-slate-300">
          
          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2"><FlaskConical className="w-5 h-5" /> The Core Loop</h3>
            <p className="text-sm leading-relaxed">
              Synthesize new discoveries by mixing reagents on your bench. Select items from your inventory, manipulate environment conditions like Heat or Pressure, and hit Synthesize to see what forms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Modes of Operation</h3>
            <div className="grid gap-3 text-sm">
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-100">Sandbox:</span> Total freedom. All elements unlocked, no consequences. Perfect for testing.
              </div>
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-100">Chemistry:</span> A college-level CHEM 1211 simulation. Manage molar ratios and conditions. Use the <Bot className="inline w-4 h-4 text-emerald-400" /> Tutor if you need guidance.
              </div>
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-100">Fantasy:</span> Alchemy mode. Discover unique items with mystical lore and ancient properties.
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2"><Keyboard className="w-5 h-5" /> Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono text-slate-400 bg-slate-950 p-4 rounded-lg">
              <span>[Space] Synthesize</span>
              <span>[H] Toggle Heat</span>
              <span>[P] Toggle Pressure</span>
              <span>[1] Clear Slot 1</span>
              <span>[2] Clear Slot 2</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;