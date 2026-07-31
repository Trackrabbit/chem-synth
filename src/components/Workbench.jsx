import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Dices, Eraser, Flame, Gauge, Library, Bot, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { useLab } from '../context/LabProvider';
import ElementSlot from './ElementSlot'; 
import ChemicalGraphic from './ChemicalGraphic'; 
import SandboxDrawer from './SandboxDrawer';
import TutorDrawer from './TutorDrawer';

const Workbench = ({
  inventory,
  discoveredItems, 
  handleMix,
  particles, 
  shockwaveColor,
  onSelectItem,
  onSlotClick,
  pinnedIntermediates,
  togglePin
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const {
    slot1, setSlot1, slot2, setSlot2,
    slot1Qty, setSlot1Qty, slot2Qty, setSlot2Qty,
    isMixing, lastResult, setLastResult, errorMsg,
    applyHeat, setApplyHeat, applyPressure, setApplyPressure,
    appMode, clearBench
  } = useLab();

  // Mode helpers
  const modeColor = appMode === 'sandbox' ? 'amber' : appMode === 'fantasy' ? 'purple' : 'emerald';
  const hoverClass = appMode === 'fantasy' ? 'hover:bg-purple-900/50 hover:border-purple-500' : 
                     appMode === 'sandbox' ? 'hover:bg-amber-900/50 hover:border-amber-500' : 
                     'hover:bg-slate-700 hover:border-slate-500';

  useEffect(() => {
    if (isMixing) {
      setIsNotesExpanded(false);
    }
  }, [isMixing]);

  const currentWorkbenchState = {
    slotA: slot1 ? `${slot1.name} (${slot1Qty} moles)` : 'Empty',
    slotB: slot2 ? `${slot2.name} (${slot2Qty} moles)` : 'Empty',
    isHeatApplied: applyHeat,
    isPressureApplied: applyPressure,
    lastResult: lastResult ? lastResult.name : 'None'
  };

  const isPinned = lastResult && pinnedIntermediates.some(p => p.id === lastResult.id);

  const loadPinnedItem = (item) => {
    if (!slot1) {
      setSlot1(item);
      setSlot1Qty(1);
    } else if (!slot2) {
      setSlot2(item);
      setSlot2Qty(1);
    } else {
      setSlot1(item);
      setSlot1Qty(1);
    }
  };

  return (
    <div className="md:col-span-2 space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400"/> Synthesis Bench
          </h2>
          
          <div className="flex gap-2 items-center">
             {appMode === 'sandbox' && (
               <div className="relative">
                 <button
                   onClick={() => setIsDrawerOpen(true)}
                   disabled={isMixing}
                   className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                   title="Browse Element Library"
                 >
                   <Library className="w-4 h-4" />
                 </button>
               </div>
             )}

             <button 
                onClick={() => { 
                  if(inventory.length >= 2) { 
                    const s = [...inventory].sort(()=>0.5-Math.random()); 
                    setSlot1(s[0]); setSlot2(s[1]); 
                    setSlot1Qty(1); setSlot2Qty(1);
                    setLastResult(null); 
                  } 
                }} 
                disabled={isMixing || inventory.length < 2} 
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" 
                title="Random Elements"
              >
                <Dices className="w-4 h-4" />
              </button>
             <button 
                onClick={() => clearBench()} 
                disabled={isMixing || (!slot1 && !slot2 && !applyHeat && !applyPressure)} 
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" 
                title="Clear Bench"
              >
                <Eraser className="w-4 h-4" />
              </button>
          </div>
        </div>
        
        {/* Slots & Animations */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 relative">
          {[1, 2].map((slotNum) => {
            const slot = slotNum === 1 ? slot1 : slot2;
            const setSlot = slotNum === 1 ? setSlot1 : setSlot2;
            const qty = slotNum === 1 ? slot1Qty : slot2Qty;
            const setQty = slotNum === 1 ? setSlot1Qty : setSlot2Qty;
            const animDir = slotNum === 1 ? 'translate-x-12' : '-translate-x-12';

            return (
              <div 
                key={`wrapper-${slotNum}`} 
                onClick={(e) => {
                  !isMixing && !slot && onSlotClick && onSlotClick();
                }}
                className={`${!slot ? 'cursor-pointer' : ''}`}
              >
                <ElementSlot 
                  slotNum={slotNum}
                  item={slot}
                  setItem={setSlot}
                  qty={qty}
                  setQty={setQty}
                  isMixing={isMixing}
                  appMode={appMode}
                  animDir={animDir}
                />
              </div>
            );
          })}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 text-3xl font-bold text-slate-700">
             {!isMixing && !shockwaveColor && '+'}
             {isMixing && (
               <>
                 <Loader2 className="animate-spin text-amber-500 w-8 h-8 relative z-20" />
                 <div className="absolute inset-0 flex items-center justify-center z-10">
                   <div className="absolute w-24 h-24 rounded-full border-4 border-transparent border-t-amber-500 border-b-emerald-500 animate-[spin_0.8s_linear_infinite] opacity-80 blur-[2px]" />
                   <div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-l-cyan-400 border-r-purple-500 animate-[spin_0.5s_linear_infinite_reverse] opacity-90 blur-[1px]" />
                 </div>
               </>
             )}
             {shockwaveColor && <div className="absolute rounded-full animate-[shockwave_0.75s_ease-out_forwards] z-30" style={{ border: `2px solid ${shockwaveColor}` }} />}
             {particles.map(p => <div key={p.id} className="absolute rounded-full blur-[0.5px] animate-[flyOut_1s_ease-out_forwards] z-40" style={{ width: '12px', height: '12px', backgroundColor: p.color, boxShadow: `0 0 15px ${p.color}`, '--tx': `${p.x}px`, '--ty': `${p.y}px`, '--s': p.scale, '--r': `${p.rotation}deg` }} />)}
          </div>
        </div>

        {/* Pinned Intermediates Tray */}
        {pinnedIntermediates.length > 0 && (
          <div className="w-full flex flex-col items-center mb-8 relative z-20 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 shadow-inner">
             <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-1.5 w-full justify-start">
               <Bookmark className="w-3 h-3" /> Pinned Intermediates
             </div>
             <div className="flex gap-3 overflow-x-auto w-full pb-2 custom-scrollbar snap-x">
               {pinnedIntermediates.map(item => (
                 <div
                   key={`pin-${item.id}`}
                   onClick={() => !isMixing && loadPinnedItem(item)}
                   className={`flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-2 py-2 transition-colors shrink-0 snap-start shadow-sm group cursor-pointer ${hoverClass}`}
                   title={`Load ${item.name} into slot`}
                 >
                   <span className="text-xl group-hover:scale-110 transition-transform">{item.emoji || '🧪'}</span>
                   <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                   
                   <button 
                     onClick={(e) => { 
                       e.stopPropagation(); 
                       togglePin(item); 
                     }}
                     className="ml-1 p-0.5 rounded-full hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                     title="Unpin intermediate"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Environmental Controls */}
        {appMode !== 'fantasy' && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 relative z-20">
            <button 
              onClick={() => !isMixing && setApplyHeat(!applyHeat)}
              disabled={isMixing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2 ${applyHeat ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-950 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}
            >
              <Flame className="w-5 h-5" /> Heat / Spark
            </button>
            <button 
              onClick={() => !isMixing && setApplyPressure(!applyPressure)}
              disabled={isMixing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2 ${applyPressure ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-950 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}
            >
              <Gauge className="w-5 h-5" /> High Pressure
            </button>
            <button 
              onClick={() => !isMixing && setIsTutorOpen(!isTutorOpen)}
              disabled={isMixing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                appMode === 'sandbox'
                  ? 'bg-amber-900/20 hover:bg-amber-900/40 text-amber-400 border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.1)] hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                  : 'bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              }`}
            >
              <Bot className="w-5 h-5" /> Consult AI Tutor
            </button>
          </div>
        )}

        {errorMsg && <div className="text-red-400 text-center mb-4 text-sm font-medium animate-pulse">{errorMsg}</div>}

        <button onClick={handleMix} disabled={!slot1 || !slot2 || isMixing} className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden z-20 ${(!slot1 || !slot2) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : isMixing ? 'bg-amber-600 text-white shadow-amber-500/25 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:-translate-y-1 hover:shadow-emerald-500/25'}`}>
          {isMixing ? <><div className="absolute inset-0 bg-white/20 animate-[scan_1s_linear_infinite]" />SYNTHESIZING...</> : 'SYNTHESIZE'}
        </button>
      </div>

      {lastResult && (
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-6 animate-in zoom-in-95 duration-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_50%)] animate-[spin_4s_linear_infinite]" />
          
          <div className="shrink-0 z-10 w-full sm:w-auto flex justify-center">
            <ChemicalGraphic color={lastResult.color} type={lastResult.type || lastResult.state} size="lg" />
          </div>
          
          <div className="relative z-10 flex-1 w-full min-w-0">
            <p className={`font-semibold mb-1 uppercase tracking-wider text-xs flex items-center gap-1 ${lastResult.isNew ? 'text-emerald-400' : 'text-slate-400'}`}>
               <Sparkles className="w-3 h-3"/> {lastResult.isNew ? 'New Discovery!' : 'Already Synthesized'}
            </p>
            <h3 className="text-3xl font-bold text-white mb-2">{lastResult.name}</h3>
            
            <div className="relative mt-2">
              <p className={`text-slate-300 text-sm leading-relaxed max-w-2xl whitespace-pre-wrap transition-all duration-300 ${isNotesExpanded ? '' : 'line-clamp-3'}`}>
                {lastResult.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {lastResult.description && (
                  <button 
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40"
                  >
                    {isNotesExpanded ? 'Collapse Analysis' : 'Read Full Analysis'}
                  </button>
                )}
                
                <button 
                  onClick={() => togglePin(lastResult)}
                  className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border 
                    ${isPinned 
                      ? appMode === 'fantasy' 
                        ? 'bg-purple-950/50 text-purple-400 border-purple-500/30 hover:border-purple-500/50' 
                        : appMode === 'sandbox' 
                        ? 'bg-amber-950/50 text-amber-400 border-amber-500/30 hover:border-amber-500/50' 
                        : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-500'
                    }`}
                >
                  {isPinned ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {isPinned ? 'Pinned' : 'Pin Intermediate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SandboxDrawer
        inventory={inventory} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onSelectItem={onSelectItem} 
      />
      
      <TutorDrawer 
        isOpen={isTutorOpen} 
        onClose={() => setIsTutorOpen(false)} 
        workbenchState={currentWorkbenchState}
      />
    </div>
  );
};

export default Workbench;