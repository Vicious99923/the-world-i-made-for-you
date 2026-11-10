import React from 'react';

interface Props {
  current: number;
  total: number;
}

export const ProgressIndicator: React.FC<Props> = ({ current, total }) => {
  return (
    <div className="progress-indicator" style={{
      position: 'fixed',
      right: '1.8rem',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? '3px' : '2px',
            height: i === current ? '24px' : '12px',
            borderRadius: '2px',
            background: i === current 
              ? 'rgba(255, 255, 255, 0.8)' 
              : i < current 
                ? 'rgba(255, 255, 255, 0.4)' 
                : 'rgba(255, 255, 255, 0.15)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ))}
    </div>
  );
};
