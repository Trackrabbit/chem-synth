import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import { useLab } from './context/LabProvider';
import { useAuth } from './context/AuthContext';
import { useSound } from './hooks/useSound';

// Components
import Header from './components/Header';
import Workbench from './components/Workbench';
import InventoryPanel from './components/InventoryPanel';
import ModalManager from './components/ModalManager';
import TutorDrawer from './components/TutorDrawer'; 
import Footer from './components/Footer';
import HelpModal from './components/HelpModal'; 
import periodicTableData from './data/periodicTable.json';
import alchemyData from './data/alchemyData.json';

export default function App() {
  const { user } = useAuth();
  const { audioEnabled, setAudioEnabled, playSound } = useSound(true);
  
  const searchInputRef = useRef(null);
  const themeTimer = useRef(null);
  
  const {
    appMode,
    slot1, setSlot1, slot2, setSlot2,
    slot1Qty, slot2Qty,
    applyHeat, setApplyHeat, applyPressure, setApplyPressure,
    isMixing, setIsMixing,
    setLastResult, setErrorMsg, clearBench,
    addMessage
  } = useLab();

  // --- LOCAL STATE ---
  const [inventory, setInventory] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [shockwaveColor, setShockwaveColor] = useState(null);
  const [showTutor, setShowTutor] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState('default');
  const [isCatastrophicEvent, setIsCatastrophicEvent] = useState(false);
  
  // Pinning State (Moved to App for global access)
  const [pinnedIntermediates, setPinnedIntermediates] = useState([]);
  
  // Reset pins when mode changes
  useEffect(() => {
    setPinnedIntermediates([]);
  }, [appMode]);
  
  // Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveredElement, setDiscoveredElement] = useState(null);
  const [showRecipeLog, setShowRecipeLog] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [knownDuplicate, setKnownDuplicate] = useState(null);

  // --- KEYBOARD SHORTCUTS & THEME TRIGGER ---
  useEffect(() => {
    let sequence = "";
    const handleKeyDown = (e) => {
      sequence = (sequence + e.key).slice(-3).toLowerCase();
      if (sequence === 'uga') {
        if (themeTimer.current) clearTimeout(themeTimer.current);
        setTheme('uga');
        playSound('success');
        themeTimer.current = setTimeout(() => setTheme('default'), 15000);
      }

      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); handleMix(); break;
        case 'h': setApplyHeat(prev => !prev); break;
        case 'p': setApplyPressure(prev => !prev); break;
        case '1': setSlot1(null); break;
        case '2': setSlot2(null); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (themeTimer.current) clearTimeout(themeTimer.current);
    };
  }, [slot1, slot2, applyHeat, applyPressure]); 

  // --- HELPERS ---
  const getDbPath = (mode) => {
    if (mode === 'fantasy') return 'chemicals';
    if (mode === 'sandbox') return 'sandbox_lab';
    return 'chemistry_lab';
  };

  const getReactionKey = (itemA, itemB, heat, pressure) => {
    const sortedIds = [itemA.id, itemB.id].sort();
    return `${sortedIds[0]}-${sortedIds[1]}-${!!heat}-${!!pressure}`;
  };

  const togglePin = (item) => {
    setPinnedIntermediates(prev => {
      const isPinned = prev.some(p => p.id === item.id);
      return isPinned ? prev.filter(p => p.id !== item.id) : [...prev, item];
    });
  };

  const isValidResult = (result) => !!(result?.name && result?.id && result?.color && !result.isFailedReaction);

  const getLabNotes = (item, mode) => {
    if (mode === 'fantasy') return alchemyData.find(note => note.id === item.id) || null;
    if (mode === 'chemistry') return periodicTableData.find(note => note.id === item.id) || null;
    return null;
  };

  const triggerVolatileReaction = () => {
    const effects = [
      { name: "Lab Spill", msg: "You bumped the beaker! All reagents spilled on the floor.", socraticTip: "Spills often happen when rushing. Check pressure levels." },
      { name: "Unexpected Gas", msg: "A puff of green smoke filled the room and ruined the mixture.", socraticTip: "Green smoke indicates uncontrolled oxidation. Lower the heat." },
      { name: "Minor Explosion", msg: "Your glassware shattered! The experiment is a bust.", socraticTip: "Explosions occur from too much energy. Consider lowering pressure." }
    ];
    const effect = effects[Math.floor(Math.random() * effects.length)];
    
    playSound('fail');
    setErrorMsg(`Volatile Reaction: ${effect.name}.`);
    addMessage('tutor', `⚠️ ${effect.msg} \n\nTutor Note: ${effect.socraticTip}`);
    clearBench();
    setIsMixing(false);
  };

  // --- DATA SYNC ---
  useEffect(() => {
    if (!user) return;
    clearBench(); 
    const inventoryRef = collection(db, 'users', user.uid, getDbPath(appMode));
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (items.length === 0 && appMode !== 'sandbox') seedInitialElements(user.uid, appMode);
      else setInventory(items.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [user, appMode]);

  const seedInitialElements = async (uid, mode) => {
      const starterIds = mode === 'fantasy' 
        ? ['water', 'fire', 'earth', 'air'] 
        : ['hydrogen', 'oxygen', 'carbon', 'sodium', 'chlorine'];
        
      const inventoryRef = collection(db, 'users', uid, getDbPath(mode));
      const sourceData = mode === 'fantasy' ? alchemyData : periodicTableData;
      
      for (const id of starterIds) {
        const element = sourceData.find(item => item.id === id);
        if (element) {
          await setDoc(doc(inventoryRef, id), element);
        }
      }
    };

  const handleMix = () => {
    if (!slot1 || !slot2) return;
    const existing = inventory.find(i => {
      if (!i.parents || i.parents.length !== 2) return false;
      const matchEnv = !!i.environment?.heat === !!applyHeat && !!i.environment?.pressure === !!applyPressure;
      return matchEnv && ((i.parents[0].name === slot1.name && i.parents[1].name === slot2.name) || (i.parents[0].name === slot2.name && i.parents[1].name === slot1.name));
    });
    
    if (existing) {
      setKnownDuplicate(existing);
      setShowDuplicateModal(true);
    } else {
      executeMix();
    }
  };

  const executeMix = async (rerollingItem = null) => {
    if ((applyHeat || applyPressure) && !rerollingItem && Math.random() < 0.15) {
      triggerVolatileReaction();
      return;
    }

    setShowDuplicateModal(false);
    setIsMixing(true); 
    setLastResult(null); 
    setErrorMsg(""); 
    playSound('bubble');
    
    try {
      let result;
      if (!rerollingItem) {
        const cacheKey = getReactionKey(slot1, slot2, applyHeat, applyPressure);
        const snap = await getDoc(doc(db, 'reaction_cache', cacheKey));
        if (snap.exists()) result = snap.data();
      }

      if (!result) {
        const res = await fetch(import.meta.env.VITE_WORKER_URL, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            itemA: slot1, 
            itemB: slot2, 
            qtyA: slot1Qty, 
            qtyB: slot2Qty, 
            environment: { heat: applyHeat, pressure: applyPressure }, 
            mode: appMode, 
            includeLore: appMode === 'fantasy',
            ...(appMode === 'fantasy' && { objective: "In Fantasy mode, prioritize the discovery of new lifeforms, including alien life, when the combination allows." })
          })
        });

        result = await res.json();
        
        if (!result || !result.name) {
             throw new Error("The API did not return a valid result.");
        }

        result.id = result.name.toLowerCase().replace(/\s+/g, '-');
        if (isValidResult(result)) await setDoc(doc(db, 'reaction_cache', getReactionKey(slot1, slot2, applyHeat, applyPressure)), result);
      }
      
      if (rerollingItem && result.id === rerollingItem.id) {
        clearBench();
        playSound('fail');
        setErrorMsg([
          `Congratulations, you've successfully created... exactly what you started with. Brilliant.`,
          `Are you trying to see if reality breaks? Because you just made more ${result.name}.`,
          `Fascinating. You spent all that effort to produce the same ${result.name} you had five minutes ago.`
        ][Math.floor(Math.random() * 3)]);
        return;
      }

      const alreadyExists = inventory.some(item => item.id === result.id);
      
      if (!alreadyExists) {
        const labNotes = getLabNotes(result, appMode);
        let elementToSave = JSON.parse(JSON.stringify({ 
            ...(labNotes || {}), 
            ...result, 
            parents: [{ name: slot1.name, qty: slot1Qty, emoji: slot1.emoji }, { name: slot2.name, qty: slot2Qty, emoji: slot2.emoji }], 
            environment: { heat: applyHeat, pressure: applyPressure } 
        }));

        await setDoc(doc(db, 'users', user.uid, getDbPath(appMode), result.id), elementToSave);

        if (result.isWorldEnding) {
          setIsCatastrophicEvent(true);
          setTimeout(() => setIsCatastrophicEvent(false), 4000);
          playSound('catastrophe'); 
        }

        playSound('discovery');
        
        if (appMode !== 'sandbox') { 
          setDiscoveredElement({ ...elementToSave, isEureka: !!rerollingItem }); 
          setShowDiscovery(true); 
        }
        clearBench();
      } else { 
        clearBench();
        if (rerollingItem) {
          playSound('fail');
          setErrorMsg([
            `You already have ${result.name}. Try expanding your horizons, not your pile of duplicates.`,
            `Do you really need another ${result.name}? Your inventory is becoming a museum of redundancy.`,
            `Groundbreaking. You made ${result.name}. Too bad it's the same thing you had before.`
          ][Math.floor(Math.random() * 3)]);
        } else {
          playSound('success');
        }
      }

      spawnExplosion(result.color);
      setLastResult({ ...result, isNew: !alreadyExists });
    } catch (e) { 
      console.error(e); 
      clearBench();
      playSound('fail'); 
      setErrorMsg(e.message || "Synthesis failed."); 
    } finally { setIsMixing(false); }
  };

  const spawnExplosion = (color) => {
    setShockwaveColor(color);
    setParticles(Array.from({ length: 40 }).map((_, i) => ({ id: Date.now() + i, x: (Math.random()-0.5)*400, y: (Math.random()-0.5)*400, color, scale: Math.random()*2+0.5, rotation: Math.random()*360 })));
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
    setTimeout(() => { setParticles([]); setShockwaveColor(null); }, 1000);
  };

  const handleReset = async () => {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, getDbPath(appMode)));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'users', user.uid, getDbPath(appMode), d.id))));
      clearBench(); 
      playSound('clear');
    } catch (e) { console.error(e); } finally { setShowResetModal(false); }
  };

  // --- UPDATED FILTERS ---
  const baseElements = appMode === 'sandbox' ? periodicTableData : inventory;
  const synthesizedCompounds = inventory;
  const fullInventory = inventory;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans p-4 flex flex-col items-center pb-20 ${theme === 'uga' ? 'theme-uga' : ''}`}>
      <Header audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} setShowTutor={setShowTutor} setShowResetModal={setShowResetModal} onOpenRecipeLog={() => setShowRecipeLog(true)} setShowHelp={setShowHelp} />
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
        <Workbench 
            inventory={baseElements} 
            handleMix={handleMix} 
            particles={particles} 
            shockwaveColor={shockwaveColor} 
            onSelectItem={(i) => !isMixing && (slot1 ? setSlot2(i) : setSlot1(i))} 
            onSlotClick={() => searchInputRef.current?.focus()}
            pinnedIntermediates={pinnedIntermediates}
            togglePin={togglePin}
        />
        <InventoryPanel 
            inventory={appMode === 'sandbox' ? synthesizedCompounds : fullInventory} 
            selectItem={(i) => !isMixing && (slot1 ? setSlot2(i) : setSlot1(i))} 
            searchInputRef={searchInputRef}
            pinnedIntermediates={pinnedIntermediates}
            togglePin={togglePin}
        />
      </div>
      <ModalManager appMode={appMode} inventory={fullInventory} showResetModal={showResetModal} setShowResetModal={setShowResetModal} handleReset={handleReset} showDiscovery={showDiscovery} setShowDiscovery={setShowDiscovery} discoveredElement={discoveredElement} showRecipeLog={showRecipeLog} setShowRecipeLog={setShowRecipeLog} showDuplicateModal={showDuplicateModal} setShowDuplicateModal={setShowDuplicateModal} knownDuplicate={knownDuplicate} executeMix={executeMix}/>
      <TutorDrawer isOpen={showTutor} onClose={() => setShowTutor(false)} workbenchState={{ slot1, slot2, slot1Qty, slot2Qty, applyHeat, applyPressure, appMode }} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <div className={`fixed inset-0 bg-white pointer-events-none z-[100] transition-opacity duration-150 ${isFlashing ? 'opacity-80' : 'opacity-0'}`} />
      
      {isCatastrophicEvent && (
        <div className="fixed inset-0 z-[200] bg-red-950/90 backdrop-blur-sm flex items-center justify-center animate-pulse pointer-events-none">
          <div className="text-center p-8 border-4 border-white/20 bg-black/50">
             <h1 className="text-6xl md:text-8xl font-black text-red-500 tracking-tighter uppercase animate-bounce">
               CATASTROPHE
             </h1>
             <p className="text-white text-xl mt-4 opacity-70">
               The fabric of reality has been torn.
             </p>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}