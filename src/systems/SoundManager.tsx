import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SoundContextType {
  sfxEnabled: boolean;
  musicPlaying: boolean;
  toggleSfx: () => void;
  toggleMusic: () => void;
  startMusic: () => void;
  play: (type: SoundType) => void;
}

type SoundType = 'sparkle' | 'bloom' | 'whoosh' | 'reveal' | 'heartbeat' | 'envelope' | 'transition';

const SoundContext = createContext<SoundContextType>({
  sfxEnabled: false, musicPlaying: false,
  toggleSfx: () => {}, toggleMusic: () => {}, startMusic: () => {}, play: () => {},
});

export const useSound = () => useContext(SoundContext);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // Create music element once
  useEffect(() => {
    const audio = new Audio('/music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    musicRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const startMusic = useCallback(() => {
    if (musicStartedRef.current) return;
    musicStartedRef.current = true;
    const audio = musicRef.current;
    if (audio) {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {
        // Browser blocked autoplay, try on next user interaction
        const tryPlay = () => {
          audio.play().then(() => { setMusicPlaying(true); document.removeEventListener('click', tryPlay); });
        };
        document.addEventListener('click', tryPlay, { once: true });
      });
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (musicPlaying) {
      audio.pause();
      setMusicPlaying(false);
    } else {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {});
    }
  }, [musicPlaying]);

  const toggleSfx = useCallback(() => {
    setSfxEnabled(prev => {
      if (!prev) getAudioContext();
      return !prev;
    });
  }, [getAudioContext]);

  const play = useCallback((type: SoundType) => {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const now = ctx.currentTime;
      switch (type) {
        case 'sparkle':
          osc.type='sine'; osc.frequency.setValueAtTime(800,now);
          osc.frequency.exponentialRampToValueAtTime(1600,now+0.15);
          gain.gain.setValueAtTime(0.08,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.3);
          osc.start(now); osc.stop(now+0.3); break;
        case 'bloom':
          osc.type='sine'; osc.frequency.setValueAtTime(300,now);
          osc.frequency.exponentialRampToValueAtTime(600,now+0.4);
          gain.gain.setValueAtTime(0.06,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.5);
          osc.start(now); osc.stop(now+0.5); break;
        case 'whoosh':
          osc.type='sawtooth'; osc.frequency.setValueAtTime(200,now);
          osc.frequency.exponentialRampToValueAtTime(50,now+0.8);
          gain.gain.setValueAtTime(0.04,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.8);
          osc.start(now); osc.stop(now+0.8); break;
        case 'reveal':
          osc.type='sine'; osc.frequency.setValueAtTime(400,now);
          osc.frequency.exponentialRampToValueAtTime(800,now+0.2);
          gain.gain.setValueAtTime(0.07,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.5);
          osc.start(now); osc.stop(now+0.5); break;
        case 'heartbeat':
          osc.type='sine'; osc.frequency.setValueAtTime(60,now);
          gain.gain.setValueAtTime(0.1,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.15);
          osc.start(now); osc.stop(now+0.4); break;
        case 'envelope':
          osc.type='triangle'; osc.frequency.setValueAtTime(250,now);
          osc.frequency.exponentialRampToValueAtTime(500,now+0.3);
          gain.gain.setValueAtTime(0.06,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.4);
          osc.start(now); osc.stop(now+0.4); break;
        case 'transition':
          osc.type='sine'; osc.frequency.setValueAtTime(200,now);
          osc.frequency.exponentialRampToValueAtTime(400,now+0.6);
          gain.gain.setValueAtTime(0.05,now); gain.gain.exponentialRampToValueAtTime(0.001,now+1.2);
          osc.start(now); osc.stop(now+1.2); break;
      }
    } catch(e) {}
  }, [sfxEnabled, getAudioContext]);

  useEffect(() => { return () => { audioCtxRef.current?.close(); }; }, []);

  return (
    <SoundContext.Provider value={{ sfxEnabled, musicPlaying, toggleSfx, toggleMusic, startMusic, play }}>
      {children}
    </SoundContext.Provider>
  );
};
