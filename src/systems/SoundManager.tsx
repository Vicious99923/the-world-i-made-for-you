import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SoundContextType {
  enabled: boolean;
  toggle: () => void;
  play: (type: SoundType) => void;
}

type SoundType = 'sparkle' | 'bloom' | 'whoosh' | 'reveal' | 'heartbeat' | 'envelope' | 'transition';

const SoundContext = createContext<SoundContextType>({
  enabled: false,
  toggle: () => {},
  play: () => {},
});

export const useSound = () => useContext(SoundContext);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'sparkle':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        case 'bloom':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case 'whoosh':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.start(now);
          osc.stop(now + 0.8);
          break;
        case 'reveal':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case 'heartbeat':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(60, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          gain.gain.setValueAtTime(0.08, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'envelope':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(250, now);
          osc.frequency.exponentialRampToValueAtTime(500, now + 0.3);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'transition':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.6);
          osc.frequency.exponentialRampToValueAtTime(300, now + 1.2);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc.start(now);
          osc.stop(now + 1.2);
          break;
      }
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }, [enabled, getAudioContext]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      if (!prev) {
        // Initialize audio context on first enable
        getAudioContext();
      }
      return !prev;
    });
  }, [getAudioContext]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <SoundContext.Provider value={{ enabled, toggle, play }}>
      {children}
    </SoundContext.Provider>
  );
};
