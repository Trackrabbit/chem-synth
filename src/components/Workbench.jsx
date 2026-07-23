import React from 'react';
import { Sparkles, Loader2, Dices, Eraser } from 'lucide-react';
import ChemicalGraphic from './ChemicalGraphic'; // Ensure this path is correct based on your folder structure

const Workbench = ({
  inventory,
  slot1, setSlot1,
  slot2, setSlot2,
  isMixing, handleMix,
  lastResult, setLastResult,
  errorMsg,
  particles, shockwaveColor
}) => {
  return (
    <div className="md:col-span-2 space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400"/> Synthesis Bench
          </h2>
          <div className="flex gap-2">
             <button onClick={() => { if(inventory.length >= 2) { const s = [...inventory].sort(()=>0.5-Math.random()); setSlot1(s[0]); setSlot2(s[1]); setLastResult(null); } }} disabled={isMixing || inventory.length < 2} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" title="Random Elements"><Dices className="w-4 h-4" /></button>
             <button onClick={() => { setSlot1(null); setSlot2(null); setLastResult(null); }} disabled={isMixing || (!slot1 && !slot2)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" title="Clear Bench"><Eraser className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 relative">
          {[slot1, slot2].map((slot, idx) => (
            <div key={idx} onClick={() => !isMixing && (idx === 0 ? setSlot1(null) : setSlot2(null))} className={`w-32 h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 bg-slate-950/50 relative z-20 ${isMixing ? `animate-[shake_0.5s_ease-in-out_infinite] ${idx===0 ? 'translate-x-12' : '-translate-x-12'} scale-90 opacity-80 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.4)]` : ''} ${slot && !isMixing ? 'border-emerald-500/50 hover:bg-red-500/10 hover:border-red-500/50' : 'border-slate-700 hover:border-slate-500'}`}>
              {slot ? <><ChemicalGraphic color={slot.color} type={slot.type} /><span className="mt-2 font-medium text-center leading-tight px-2">{slot.name}</span></> : <span className="text-slate-500 text-sm">Element {idx+1}</span>}
            </div>
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 text-3xl font-bold text-slate-700">
             {!isMixing && !shockwaveColor && '+'}
             {isMixing && <><Loader2 className="animate-spin text-amber-500 w-8 h-8 relative z-20" /><div className="absolute inset-0 flex items-center justify-center z-10"><div className="absolute w-24 h-24 rounded-full border-4 border-transparent border-t-amber-500 border-b-emerald-500 animate-[spin_0.8s_linear_infinite] opacity-80 blur-[2px]" /><div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-l-cyan-400 border-r-purple-500 animate-[spin_0.5s_linear_infinite_reverse] opacity-90 blur-[1px]" /></div></>}
             {shockwaveColor && <div className="absolute rounded-full animate-[shockwave_0.75s_ease-out_forwards] z-30" style={{ border: `2px solid ${shockwaveColor}` }} />}
             {particles.map(p => <div key={p.id} className="absolute rounded-full blur-[0.5px] animate-[flyOut_1s_ease-out_forwards] z-40" style={{ width: '12px', height: '12px', backgroundColor: p.color, boxShadow: `0 0 15px ${p.color}`, '--tx': `${p.x}px`, '--ty': `${p.y}px`, '--s': p.scale, '--r': `${p.rotation}deg` }} />)}
          </div>
        </div>

        {errorMsg && <div className="text-red-400 text-center mb-4 text-sm font-medium animate-pulse">{errorMsg}</div>}

        <button onClick={handleMix} disabled={!slot1 || !slot2 || isMixing} className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden ${(!slot1 || !slot2) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : isMixing ? 'bg-amber-600 text-white shadow-amber-500/25 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:-translate-y-1 hover:shadow-emerald-500/25'}`}>
          {isMixing ? <><div className="absolute inset-0 bg-white/20 animate-[scan_1s_linear_infinite]" />SYNTHESIZING...</> : 'SYNTHESIZE'}
        </button>
      </div>

      {lastResult && (
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-6 animate-in zoom-in-95 duration-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_50%)] animate-[spin_4s_linear_infinite]" />
          <ChemicalGraphic color={lastResult.color} type={lastResult.type} size="lg" />
          <div className="relative z-10">
            <p className={`font-semibold mb-1 uppercase tracking-wider text-xs flex items-center gap-1 ${lastResult.isNew ? 'text-emerald-400' : 'text-slate-400'}`}>
               <Sparkles className="w-3 h-3"/> {lastResult.isNew ? 'New Discovery!' : 'Already Synthesized'}
            </p>
            <h3 className="text-3xl font-bold text-white mb-2">{lastResult.name}</h3>
            <p className="text-slate-400 text-sm">
              {lastResult.isNew ? 'Saved permanently to your cloud inventory.' : 'You already have this element in your library.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workbench;