import React, { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  title: string;
  subtitle: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ title, subtitle }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle star background on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number; y: number; r: number; a: number; speed: number }[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        speed: Math.random() * 0.005 + 0.002,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.speed;
        const alpha = 0.3 + Math.sin(s.a) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 180, 255, ${alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 1s ease',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.5rem, 5vw, 3rem)',
          fontWeight: 500,
          letterSpacing: '0.15em',
          color: '#e2e8f0',
          marginBottom: '1rem',
          animation: 'fadeIn 2s ease',
        }}>
          {title}
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)',
          fontStyle: 'italic',
          color: 'rgba(196, 181, 253, 0.7)',
          letterSpacing: '0.1em',
          animation: 'fadeIn 2.5s ease',
        }}>
          {subtitle}
        </p>
        <div style={{
          marginTop: '3rem',
          width: '200px',
          height: '2px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1px',
          overflow: 'hidden',
          margin: '3rem auto 0',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            borderRadius: '1px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
};
