import React, { useState, useMemo } from 'react';
import { Search, FlaskConical, BookOpen, Info, LayoutGrid, List, X, Pin } from 'lucide-react';
import ChemicalGraphic from './ChemicalGraphic';
import { useLab } from '../context/LabProvider';

const EmptyState = ({ appMode }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4">
      <FlaskConical className="w-8 h-8 text-slate-700" />
    </div>
    <h4 className="text-slate-300 font-semibold mb-1">
      {appMode === 'chemistry' ? "Lab is empty" : "No elements found"}
    </h4>
    <p className="text-slate-500 text-sm max-w-[200px]">
      {appMode === 'chemistry' 
        ? "Mix base reagents on the bench to start your research." 
        : "Synthesize compounds to expand your discovery list."}
    </p>
  </div>
);

const InventoryPanel = ({ inventory, selectItem, searchInputRef, pinnedIntermediates = [], togglePin }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCompact, setIsCompact] = useState(false);
  const { slot1, slot2, appMode, setDatasheetItem } = useLab();

  const activePinClass = appMode === 'fantasy' ? 'text-purple-400 bg-purple-500/10' : appMode === 'sandbox' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10';
  const hoverPinClass = appMode === 'fantasy' ? 'hover:bg-purple-600' : appMode === 'sandbox' ? 'hover:bg-amber-600' : 'hover:bg-emerald-600';

  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.formula && item.formula.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [inventory, searchTerm]);

  const renderFormula = (formula) => {
    if (!formula) return null;
    const parts = formula.split(/(\d+)/);
    return (
      <span className="font-mono tracking-wider">
        {parts.map((part, i) => 
          /\d+/.test(part) ? <sub key={i} className="text-[10px]">{part}</sub> : part
        )}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[700px]">
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 whitespace-nowrap">
          {appMode === 'chemistry' ? (
            <><FlaskConical className="w-5 h-5 text-emerald-400 shrink-0" /> Lab Inventory</>
          ) : (
            <><BookOpen className="w-5 h-5 text-amber-400 shrink-0" /> Elements</>
          )}
        </h2>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsCompact(!isCompact)}
            className="p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            {isCompact ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          
          <span className="text-slate-500 text-xs md:text-sm font-bold bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 whitespace-nowrap">
            {inventory.length} Discovered
          </span>
        </div>
      </div>

      <div className="relative mb-6 shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          ref={searchInputRef} 
          type="text" 
          placeholder={appMode === 'chemistry' ? "Search by name or formula..." : "Search elements..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
        />
        
        {searchTerm && (
          <button 
            onClick={() => { setSearchTerm(""); searchInputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`overflow-y-auto pr-2 custom-scrollbar pb-4 ${isCompact ? 'flex flex-col gap-2' : 'grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 sm:gap-4'}`}>
        
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => {
            const isSelected = slot1?.id === item.id || slot2?.id === item.id;
            const isPinned = pinnedIntermediates.some(p => p.id === item.id);
            
            if (isCompact) {
              return (
                <div
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all duration-300 w-full group text-left cursor-pointer
                    ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-600 hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className="w-8 h-8 shrink-0 flex items-center justify-center transform transition-transform group-hover:scale-110">
                       <ChemicalGraphic color={item.color} type={item.type || item.state} size="sm" />
                     </div>
                     <div className="flex flex-col truncate">
                       <span className="text-sm font-bold text-slate-200 truncate">{item.name}</span>
                       {appMode === 'chemistry' && item.formula ? (
                         <span className="text-xs text-emerald-400/80 flex items-center gap-2 truncate">
                           {renderFormula(item.formula)}
                         </span>
                       ) : (
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tier {item.tier}</span>
                       )}
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePin(item); }} 
                      className={`p-1.5 rounded-lg transition-colors ${isPinned ? activePinClass : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Pin className={`w-4 h-4 ${isPinned ? 'rotate-45' : ''}`} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDatasheetItem(item); }} 
                      className="w-8 h-8 rounded-full bg-slate-800/50 hover:bg-emerald-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                onClick={() => selectItem(item)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 relative group w-full h-full min-h-[220px] overflow-hidden cursor-pointer
                  ${isSelected ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-800 bg-slate-950 hover:border-slate-600 hover:bg-slate-800/50'}`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePin(item); }}
                    className={`p-1.5 rounded-full bg-slate-800/80 flex items-center justify-center transition-colors ${hoverPinClass} ${isPinned ? activePinClass : 'text-slate-600 hover:text-white'}`}
                  >
                    <Pin className={`w-3 h-3 ${isPinned ? 'rotate-45' : ''}`} />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDatasheetItem(item); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-800/80 hover:bg-emerald-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
                >
                  <Info className="w-3 h-3" />
                </button>

                <div className="mt-6 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 shrink-0">
                  <ChemicalGraphic color={item.color} type={item.type || item.state} size="sm" />
                </div>
                
                <div className="flex-1 flex items-center justify-center w-full my-2">
                  <span className="text-xs font-bold text-slate-200 text-center leading-snug line-clamp-3 w-full" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>
                    {item.name}
                  </span>
                </div>

                {appMode !== 'fantasy' && item.formula ? (
                  <div className="w-full shrink-0 border-t border-slate-800 pt-2 flex flex-col items-center gap-1.5 mt-auto">
                     <div className="text-emerald-400 font-bold bg-slate-900 px-1 py-1 rounded-md w-full shadow-inner border border-slate-800 flex justify-center text-xs">
                       {renderFormula(item.formula)}
                     </div>
                     <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider w-full flex flex-col items-center leading-tight mt-1">
                       <span>{item.molarMass !== 'N/A' ? `${item.molarMass} g/mol` : 'N/A'}</span>
                       <span className="text-slate-500">{item.state}</span>
                     </div>
                  </div>
                ) : (
                  <div className="mt-auto w-full border-t border-slate-800 pt-2 text-center text-xs text-slate-500 uppercase tracking-wider font-semibold shrink-0">
                    Tier {item.tier}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState appMode={appMode} />
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;