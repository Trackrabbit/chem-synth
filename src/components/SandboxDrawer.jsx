import React, { useState, useMemo } from 'react';
import { X, Library, Atom, Info, Search, ChevronDown, ChevronRight } from 'lucide-react';
import ChemicalGraphic from './ChemicalGraphic';
import DatasheetModal from './DatasheetModal';
import { useLab } from '../context/LabProvider';

// --- Sub-components for better organization ---

const SearchBar = ({ searchTerm, setSearchTerm, setSortBy }) => (
  <div className="flex gap-2">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
      <input 
        placeholder="Search..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-9 text-sm focus:border-emerald-500 outline-none text-slate-200"
      />
      {searchTerm && (
        <button 
          onClick={() => setSearchTerm("")} 
          className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
    <select 
      className="bg-slate-950 border border-slate-700 rounded-lg px-2 text-sm text-slate-300 outline-none"
      onChange={(e) => setSortBy(e.target.value)}
    >
      <option value="atomicNumber"># Order</option>
      <option value="name">A-Z Name</option>
    </select>
  </div>
);

const ElementTile = ({ item, onSelect, onInfo }) => (
  <div className="relative group">
    <div
      onClick={() => onSelect(item)}
      className="w-full h-full flex flex-col items-center p-3 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer overflow-hidden"
      style={{ borderTopColor: item.color, borderTopWidth: '3px' }}
    >
      {item.atomicNumber && (
        <span className="absolute top-1 left-2 text-[9px] font-mono font-bold text-slate-600">{item.atomicNumber}</span>
      )}
      <div className="transform transition-transform group-hover:scale-110 my-2">
        <ChemicalGraphic color={item.color} type={item.type || item.state} size="sm" />
      </div>
      <span className="text-[10px] font-bold text-slate-200 text-center leading-tight">{item.name}</span>
      <span className="text-[9px] text-slate-500 font-mono mt-0.5" style={{ color: item.color }}>{item.formula}</span>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onInfo(item); }}
      className="absolute top-1 right-1 p-1 text-slate-400 hover:text-amber-400 bg-slate-900/90 rounded opacity-0 group-hover:opacity-100 transition-all"
    >
      <Info className="w-3 h-3" />
    </button>
  </div>
);

// --- Main Component ---

const SandboxDrawer = ({ isOpen, onClose, onSelectItem, inventory }) => {
  const { slot1, setSlot1, slot2, setSlot2, setSlot1Qty, setSlot2Qty } = useLab();
  const [infoItem, setInfoItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("atomicNumber");
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const processedGroups = useMemo(() => {
    const filtered = inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.formula && item.formula.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "atomicNumber") return (a.atomicNumber || 999) - (b.atomicNumber || 999);
      return (a.name || "").localeCompare(b.name || "");
    });

    return sorted.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [inventory, searchTerm, sortBy]);

  const handleSelectElement = (item) => {
    if (!slot1) { setSlot1(item); setSlot1Qty(1); } 
    else if (!slot2) { setSlot2(item); setSlot2Qty(1); } 
    else { setSlot1(item); setSlot1Qty(1); setSlot2(null); }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Library className="w-5 h-5 text-amber-400" /> 
              Sandbox <span className="text-amber-400">Elements</span>
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} setSortBy={setSortBy} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar">
          {Object.entries(processedGroups).map(([category, items]) => (
            <div key={category} className="mb-6">
              <button 
                onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className="w-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 border-b border-slate-800 pb-2 mb-3"
              >
                {collapsedCategories[category] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                {category} ({items.length})
              </button>
              
              {!collapsedCategories[category] && (
                <div className="grid grid-cols-3 gap-3 animate-in fade-in zoom-in duration-200">
                  {items.map(item => (
                    <ElementTile key={item.id} item={item} onSelect={handleSelectElement} onInfo={setInfoItem} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {infoItem && <DatasheetModal item={infoItem} onClose={() => setInfoItem(null)} />}
    </>
  );
};

export default SandboxDrawer;