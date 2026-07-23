import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Import your newly extracted components
import Header from './components/Header';
import Workbench from './components/Workbench';
import InventoryPanel from './components/InventoryPanel';
import ResetModal from './components/ResetModal';

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

export default function App() {
  // Global State
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [isMixing, setIsMixing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Visual Effects State
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [shockwaveColor, setShockwaveColor] = useState(null);
  
  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const callAIAPI = async (itemA, itemB) => {
    const workerUrl = import.meta.env.VITE_WORKER_URL; 
    
    if (!workerUrl) {
       throw new Error("Worker URL is missing! Check your GitHub Secrets or local .env file.");
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
      
      <Header 
        audioEnabled={audioEnabled} 
        setAudioEnabled={setAudioEnabled} 
        setShowResetModal={setShowResetModal} 
      />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        <Workbench 
          inventory={inventory}
          slot1={slot1} setSlot1={setSlot1}
          slot2={slot2} setSlot2={setSlot2}
          isMixing={isMixing} handleMix={handleMix}
          lastResult={lastResult} setLastResult={setLastResult}
          errorMsg={errorMsg}
          particles={particles} shockwaveColor={shockwaveColor}
        />

        <InventoryPanel 
          inventory={inventory} 
          selectItem={selectItem} 
          slot1={slot1} 
          slot2={slot2} 
        />

      </div>

      <ResetModal 
        show={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        onConfirm={handleReset} 
        isResetting={isResetting} 
      />
      
      <div className={`fixed inset-0 bg-white pointer-events-none z-[100] transition-opacity duration-150 ${isFlashing ? 'opacity-80' : 'opacity-0'}`} />

      {/* Global Animations for components to share */}
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-2px) rotate(-1deg); } 75% { transform: translateX(2px) rotate(1deg); } }
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes flyOut { 0% { transform: translate(-50%, -50%) scale(0.1) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(var(--s)) rotate(var(--r)); opacity: 0; } }
        @keyframes shockwave { 0% { width: 0px; height: 0px; border-width: 40px; opacity: 1; } 100% { width: 400px; height: 400px; border-width: 0px; opacity: 0; } }
      `}</style>
    </div>
  );
}