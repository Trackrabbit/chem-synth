import React from 'react';
import ChemicalGraphic from './ChemicalGraphic.jsx';

// ---------------------------------------------------------
// COMPONENT: InventoryPanel
// ---------------------------------------------------------
const InventoryPanel = ({ inventory, selectItem, slot1, slot2 }) => (
  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl h-[600px] flex flex-col z-10 relative">
    <div className="flex justify-between items-end mb-4 pb-2 border-b border-slate-800">
      <h2 className="text-xl font-semibold">My Elements</h2>
      <span className="text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{inventory.length}</span>
    </div>
    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
      {inventory.map(item => {
         const isSelected = (slot1?.id === item.id) || (slot2?.id === item.id);
         return (
            <button 
              key={item.id}
              onClick={() => selectItem(item)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                ${isSelected ? 'bg-emerald-900/40 border-emerald-500/50 shadow-inner' : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'}`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center p-1 border border-slate-800 shrink-0 shadow-inner">
                <ChemicalGraphic color={item.color} type={item.type} />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-medium text-slate-200 truncate">{item.name}</div>
                <div className="flex mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                    ${item.type === 'gas' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 
                      item.type === 'liquid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                      'bg-stone-500/10 text-stone-400 border border-stone-500/20'}`}>
                    {item.type}
                  </span>
                </div>
              </div>
            </button>
         )
      })}
    </div>
  </div>
);

export default InventoryPanel;