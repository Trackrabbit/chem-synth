import React, { useState, useEffect, useRef } from 'react';
import ChemicalGraphic from './ChemicalGraphic';
import periodicTableData from '../data/periodicTable.json';

const ElementSlot = ({ 
  slotNum, 
  item, setItem, 
  qty, setQty, 
  isMixing, 
  appMode,
  animDir
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = periodicTableData.filter(el => 
      el.name.toLowerCase().includes(value.toLowerCase()) || 
      (el.formula && el.formula.toLowerCase().includes(value.toLowerCase()))
    ).slice(0, 5); // Limit to top 5 results

    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (suggestion) => {
    setItem(suggestion);
    setIsEditing(false);
    setSearchTerm("");
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setSearchTerm("");
    }

    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div 
        onClick={() => {
          if (!isMixing && !item && appMode === 'sandbox') {
             setIsEditing(true);
          }
        }} 
        className={`w-32 h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500 bg-slate-950/50 relative z-20 
          ${isMixing ? `animate-[shake_0.5s_ease-in-out_infinite] ${animDir} scale-90 opacity-80 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.4)]` : ''} 
          ${item && !isMixing ? 'border-emerald-500/50 hover:bg-red-500/10 hover:border-red-500/50 cursor-pointer' : 'border-slate-700 hover:border-slate-500'}
          ${!item && !isEditing ? 'cursor-pointer' : ''}`
        }
      >
        {/* State 1: The slot is filled */}
        {item && !isEditing && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setItem(null); setQty(1); }} 
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-lg transition-colors z-30"
            >
              ✕
            </button>
            <ChemicalGraphic color={item.color} type={item.type || item.state} />
            <span className="mt-2 font-medium text-center leading-tight px-2">{item.name}</span>
            {appMode !== 'fantasy' && item.formula && (
            <span className="text-xs font-mono text-slate-500 mt-1">{item.formula}</span>
            )}
            
            {!isMixing && (
              <div className="absolute -bottom-4 bg-slate-900 border border-slate-700 rounded-lg flex items-center shadow-lg overflow-hidden z-30">
                <button 
                  onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                  className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold"
                >
                  -
                </button>
                <span className="text-xs font-bold w-6 text-center text-emerald-400">{qty}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setQty(qty + 1); }}
                  className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors font-bold"
                >
                  +
                </button>
              </div>
            )}
          </>
        )}

        {/* State 2: Sandbox Mode Search Input */}
        {!item && isEditing && (
          <div className="w-full h-full flex items-center justify-center p-2">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setIsEditing(false), 200)} // Delay so clicks fire first
              placeholder="Type..."
              className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg text-center text-sm py-2 text-white focus:outline-none focus:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            />
          </div>
        )}

        {/* State 3: Empty Placeholder */}
        {!item && !isEditing && (
          <span className="text-slate-500 text-sm font-medium px-2 text-center">
            {appMode === 'fantasy' ? `Element ${slotNum}` : 'Click to Search'}
          </span>
        )}
      </div>

      {/* Auto-Complete Dropdown Menu */}
      {isEditing && suggestions.length > 0 && (
        <ul className="absolute top-[170px] w-48 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col">
          {suggestions.map((sug, i) => (
            <li 
              key={sug.id}
              onMouseDown={() => handleSelectSuggestion(sug)} // onMouseDown fires before onBlur
              className={`px-4 py-2 cursor-pointer flex justify-between items-center transition-colors ${i === 0 ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-slate-800'}`}
            >
              <span className="font-medium text-sm text-slate-200">{sug.name}</span>
              <span className="font-mono text-xs text-slate-500">{sug.formula}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ElementSlot;