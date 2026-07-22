import React, { useState, useEffect } from 'react';

// Custom components
import ChemicalGraphic from './components/ChemicalGraphic';
import Header from './components/Header';
import InventoryPanel from './components/InventoryPanel';
import ResetModal from './components/ResetModal';

// Import remaining icons used directly in App.jsx
import { Sparkles, Loader2, Dices, Eraser } from 'lucide-react';

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';


// FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyC9-p5CHbJXPgm6NoE73GfGriS2AtQXl0c",
  authDomain: "chemsynth-69a02.firebaseapp.com",
  projectId: "chemsynth-69a02",
  storageBucket: "chemsynth-69a02.firebasestorage.app",
  messagingSenderId: "335289034476",
  appId: "1:335289034476:web:af0c06f388b0f93f00e7c9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------------------------------------------------
// MAIN APP COMPONENT
// ---------------------------------------------------------
export default function App() {
  // State
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [isMixing, setIsMixing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [shockwaveColor, setShockwaveColor] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sound Engine
  const playSound = (type) => {
    if (!audioEnabled) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'bubble') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'success') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); 
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'fail') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  };

  // Firebase Auth & Sync
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const inventoryRef = collection(db, 'users', user.uid, 'chemicals');
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      
      if (items.length === 0) seedInitialElements(user.uid);
      else setInventory(items.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [user]);

  const seedInitialElements = async (uid) => {
    const starters = [
      { id: 'water', name: 'Water', color: '#3b82f6', type: 'liquid' },
      { id: 'fire', name: 'Fire', color: '#ef4444', type: 'gas' },
      { id: 'earth', name: 'Earth', color: '#854d0e', type: 'solid' },
      { id: 'air', name: 'Air', color: '#e2e8f0', type: 'gas' }
    ];
    const inventoryRef = collection(db, 'users', uid, 'chemicals');
    for (const item of starters) await setDoc(doc(inventoryRef, item.id), item);
  };

  // Game Logic
  const callAIAPI = async (itemA, itemB) => {
    // We now call your Cloudflare Worker instead of Google directly!
    // For local dev without a worker yet, you can temporarily swap this back to the direct Gemini call if needed.
    const workerUrl = import.meta.env.VITE_WORKER_URL; 
    
    if (!workerUrl) {
       throw new Error("Worker URL is missing! Check your .env file.");
    }

    const payload = { itemA, itemB };

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Synthesis Failed: ${response.status}`);

    const resultData = await response.json();
    resultData.id = resultData.name.toLowerCase().replace(/\s+/g, '-');
    return resultData;
  };

  const handleMix = async () => {
    if (!slot1 || !slot2 || !user) return;
    setIsMixing(true); setLastResult(null); setErrorMsg(""); playSound('bubble');
    
    try {
      // NOTE: If you haven't deployed the worker yet, this will fail until you add VITE_WORKER_URL to .env
      const result = await callAIAPI(slot1, slot2);
      const alreadyExists = inventory.some(item => item.id === result.id);
      
      if (!alreadyExists) {
        await setDoc(doc(db, 'users', user.uid, 'chemicals', result.id), result);
      }

      playSound('success');
      spawnExplosion(result.color);
      setLastResult({ ...result, isNew: !alreadyExists });
      setSlot1(null); setSlot2(null);
    } catch (error) {
      console.error(error);
      playSound('fail');
      setErrorMsg(error.message);
    } finally {
      setIsMixing(false);
    }
  };

  const spawnExplosion = (colorHex) => {
    setShockwaveColor(colorHex);
    setParticles(Array.from({ length: 40 }).map((_, i) => ({
      id: Date.now() + i, x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400,
      color: colorHex, scale: Math.random() * 2 + 0.5, rotation: Math.random() * 360
    })));
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
    setTimeout(() => { setParticles([]); setShockwaveColor(null); }, 1000);
  };

  const selectItem = (item) => {
    if (isMixing) return;
    if (!slot1) setSlot1(item);
    else if (!slot2) setSlot2(item); 
    else { setSlot1(item); setSlot2(null); }
  };

  const handleReset = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'chemicals'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'chemicals', d.id))));
      setSlot1(null); setSlot2(null); setLastResult(null); playSound('fail');
    } catch (e) { console.error(e); } 
    finally { setIsResetting(false); setShowResetModal(false); }
  };

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin w-10 h-10" /></div>;

  const dynamicBgStyle = {
    background: slot1 && slot2 
      ? `radial-gradient(circle at 30% 50%, ${slot1.color}15 0%, transparent 50%), radial-gradient(circle at 70% 50%, ${slot2.color}15 0%, transparent 50%), #0f172a`
      : slot1 ? `radial-gradient(circle at 50% 50%, ${slot1.color}15 0%, transparent 60%), #0f172a` : '#0f172a'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 flex flex-col items-center overflow-hidden transition-colors duration-1000" style={dynamicBgStyle}>
      
      <Header audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} setShowResetModal={setShowResetModal} />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* WORKBENCH COMPONENT AREA */}
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

        <InventoryPanel inventory={inventory} selectItem={selectItem} slot1={slot1} slot2={slot2} />

      </div>

      <ResetModal show={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={handleReset} isResetting={isResetting} />
      <div className={`fixed inset-0 bg-white pointer-events-none z-[100] transition-opacity duration-150 ${isFlashing ? 'opacity-80' : 'opacity-0'}`} />

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-2px) rotate(-1deg); } 75% { transform: translateX(2px) rotate(1deg); } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes flyOut { 0% { transform: translate(-50%, -50%) scale(0.1) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(var(--s)) rotate(var(--r)); opacity: 0; } }
        @keyframes shockwave { 0% { width: 0px; height: 0px; border-width: 40px; opacity: 1; } 100% { width: 400px; height: 400px; border-width: 0px; opacity: 0; } }
      `}</style>
    </div>
  );
}