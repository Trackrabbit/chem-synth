import React from 'react';
import { Atom } from 'lucide-react';

const DiscoveryTree = ({ element, inventory, onSelect }) => {
  if (!element.parents || element.parents.length === 0) {
    return <div className="text-slate-500 text-sm italic p-4">No ancestry data available.</div>;
  }

  // Find the full element object from inventory based on name
  const getFullElement = (name) => inventory.find(i => i.name === name);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-xl border border-slate-800">
      <h4 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-6">Lineage</h4>
      
      <div className="flex items-center gap-4">
        {/* Parent 1 */}
        <div 
          onClick={() => onSelect(getFullElement(element.parents[0]?.name))}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-xl group-hover:border-emerald-500 transition-colors">
            {element.parents[0]?.emoji || '✨'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-400 transition-colors">{element.parents[0]?.name}</span>
        </div>

        <span className="text-slate-600 font-bold text-lg">+</span>

        {/* Parent 2 */}
        <div 
          onClick={() => onSelect(getFullElement(element.parents[1]?.name))}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-xl group-hover:border-emerald-500 transition-colors">
            {element.parents[1]?.emoji || '✨'}
          </div>
          <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-400 transition-colors">{element.parents[1]?.name}</span>
        </div>

        <span className="text-slate-600 font-bold text-lg">=</span>

        {/* Child */}
        <div className="flex flex-col items-center gap-2 opacity-80">
          <div className="w-14 h-14 flex items-center justify-center bg-emerald-900/20 border-2 border-emerald-500/50 rounded-lg text-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {element.emoji || '🧪'}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">{element.name}</span>
        </div>
      </div>
      
      <div className="mt-6 text-[10px] text-slate-500 flex items-center gap-2">
        <Atom size={12} /> Synthesized via {element.environment?.heat ? 'Heat' : 'Standard'}
      </div>
    </div>
  );
};

export default DiscoveryTree;