import { useState, useCallback, useRef, useEffect } from 'react';

export const useSound = (initialState = true) => {
  const [audioEnabled, setAudioEnabled] = useState(initialState);
  const ambientGainRef = useRef(null);
  const ambientIntervalRef = useRef(null);

  // Helper for random variation
  const rand = (min, max) => Math.random() * (max - min) + min;

  const playSound = useCallback((type) => {
    if (!audioEnabled) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'bubble':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rand(250, 350), now);
        osc.frequency.exponentialRampToValueAtTime(rand(500, 700), now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + rand(0.25, 0.35));
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'success':
        osc.type = 'triangle';
        const base = rand(400, 480);
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.setValueAtTime(base * 1.25, now + 0.1);
        osc.frequency.setValueAtTime(base * 1.5, now + 0.2); 
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + rand(0.7, 0.9));
        osc.start(now);
        osc.stop(now + 1.0);
        break;

      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rand(120, 180), now);
        osc.frequency.exponentialRampToValueAtTime(rand(30, 70), now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rand(700, 900), now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
        break;

      case 'discovery':
        osc.type = 'square';
        const startFreq = rand(500, 550);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.setValueAtTime(startFreq * 1.25, now + 0.1);
        osc.frequency.setValueAtTime(startFreq * 1.5, now + 0.2);
        osc.frequency.setValueAtTime(startFreq * 2, now + 0.3);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.7);
        break;

      case 'clear':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(rand(180, 220), now);
        osc.frequency.exponentialRampToValueAtTime(rand(10, 30), now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'catastrophe':
        // A deep, rumbling, descending "reality collapse" sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rand(40, 80), now);
        osc.frequency.linearRampToValueAtTime(rand(20, 30), now + 2.5);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 2.5);
        osc.start(now);
        osc.stop(now + 2.6);
        break;

      // --- NEW: Mode-specific custom interaction cues ---
      case 'chem-heat': // Gas burner hiss
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rand(100, 150), now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.9);
        break;

      case 'fantasy-heat': // Hearth crackle / magical spark
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(rand(300, 400), now);
        osc.frequency.exponentialRampToValueAtTime(rand(800, 1200), now + 0.3);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      default:
        break;
    }
  }, [audioEnabled]);

  // --- NEW: Procedural Ambient Soundscapes (Chemistry Hum vs Fantasy Wind) ---
  const startAmbient = useCallback((mode) => {
    if (!audioEnabled) return;
    stopAmbient(); // Clear any existing loop

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (mode === 'chemistry') {
      // Low fluorescent light / compressor hum
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime); // Low 60Hz electrical hum
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
    } else {
      // Low mystical wind / tavern hum
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    }

    osc.start();
    ambientGainRef.current = { ctx, gainNode, osc };
  }, [audioEnabled]);

  const stopAmbient = useCallback(() => {
    if (ambientGainRef.current) {
      try {
        ambientGainRef.current.osc.stop();
        ambientGainRef.current.ctx.close();
      } catch (e) {
        // Ignore if already closed
      }
      ambientGainRef.current = null;
    }
  }, []);

  return { audioEnabled, setAudioEnabled, playSound, startAmbient, stopAmbient };
};