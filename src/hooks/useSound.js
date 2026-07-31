import { useState, useCallback } from 'react';

export const useSound = (initialState = true) => {
  const [audioEnabled, setAudioEnabled] = useState(initialState);

  const playSound = useCallback((type) => {
    if (!audioEnabled) return;

    // Helper for random variation to prevent "robotic" repetition
    const rand = (min, max) => Math.random() * (max - min) + min;

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

      default:
        break;
    }
  }, [audioEnabled]);

  return { audioEnabled, setAudioEnabled, playSound };
};