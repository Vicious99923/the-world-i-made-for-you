import React from 'react';
import { useSound } from '../systems/SoundManager';

export const SoundController: React.FC = () => {
  const { enabled, toggle } = useSound();

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Mute sound' : 'Enable sound'}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1.1rem',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
      }}
    >
      {enabled ? '♪' : '♪̸'}
    </button>
  );
};
