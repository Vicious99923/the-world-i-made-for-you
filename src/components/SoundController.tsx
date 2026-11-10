import React from 'react';
import { useSound } from '../systems/SoundManager';

export const SoundController: React.FC = () => {
  const { sfxEnabled, musicPlaying, toggleSfx, toggleMusic } = useSound();

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {/* Music toggle */}
      <button onClick={toggleMusic} aria-label={musicPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: musicPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
          fontSize: '1rem', transition: 'all 0.3s ease',
        }}>🎵</button>
      {/* SFX toggle */}
      <button onClick={toggleSfx} aria-label={sfxEnabled ? 'إيقاف المؤثرات' : 'تشغيل المؤثرات'}
        style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: sfxEnabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem', transition: 'all 0.3s ease',
        }}>🔊</button>
    </div>
  );
};
