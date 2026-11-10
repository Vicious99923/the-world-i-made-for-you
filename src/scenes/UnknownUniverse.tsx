import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';
import { theme } from '../config/theme';

interface Props {
  onComplete: () => void;
  isActive: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  phase: number;
}

export const UnknownUniverse: React.FC<Props> = ({ onComplete, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [orbGlowing, setOrbGlowing] = useState(false);
  const [orbClicked, setOrbClicked] = useState(false);
  const [pulseWave, setPulseWave] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { play } = useSound();
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const timeRef = useRef(0);
  const orbRef = useRef({ glowIntensity: 0, particles: [] as { angle: number; dist: number; speed: number; size: number }[] });

  // Generate stars
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 800 : 2000;
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      size: Math.random() * 2 + 0.3,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    nebulaeRef.current = [
      { x: 0.3, y: 0.4, radius: 200, color: '#4c1d95', opacity: 0.03, phase: 0 },
      { x: 0.7, y: 0.6, radius: 250, color: '#312e81', opacity: 0.025, phase: 1 },
      { x: 0.5, y: 0.3, radius: 180, color: '#1e1b4b', opacity: 0.02, phase: 2 },
    ];

    // Orb particles
    orbRef.current.particles = Array.from({ length: 30 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 40 + 20,
      speed: (Math.random() - 0.5) * 0.02,
      size: Math.random() * 2 + 1,
    }));

    const timer = setTimeout(() => setShowText(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      mouseRef.current = {
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Clear
      ctx.fillStyle = '#030014';
      ctx.fillRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw nebulae
      nebulaeRef.current.forEach(n => {
        n.phase += 0.003;
        const nx = n.x * w + Math.sin(n.phase) * 30 + (mx - 0.5) * -20;
        const ny = n.y * h + Math.cos(n.phase * 0.7) * 20 + (my - 0.5) * -20;
        const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.radius);
        gradient.addColorStop(0, n.color + '20');
        gradient.addColorStop(0.5, n.color + '10');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(nx - n.radius, ny - n.radius, n.radius * 2, n.radius * 2);
      });

      // Draw stars with parallax
      starsRef.current.forEach(s => {
        const parallax = s.z * 0.5 + 0.5;
        const sx = s.x * w + (mx - 0.5) * -30 * parallax;
        const sy = s.y * h + (my - 0.5) * -30 * parallax;
        const twinkle = 0.4 + Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase) * 0.4;
        const brightnessMult = orbClicked ? 2 : 1;
        const alpha = Math.min(1, s.brightness * twinkle * brightnessMult);

        ctx.beginPath();
        ctx.arc(sx, sy, s.size * parallax, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 210, 255, ${alpha})`;
        ctx.fill();
      });

      // Draw central orb
      const orbX = w / 2;
      const orbY = h / 2 + 40;
      const baseGlow = 0.3 + Math.sin(t * 2) * 0.15;
      const glowIntensity = orbGlowing ? 0.8 : baseGlow;
      const orbSize = orbGlowing ? 18 : 14;

      // Orb outer glow
      for (let i = 3; i > 0; i--) {
        const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize * (i * 3));
        gradient.addColorStop(0, `rgba(167, 139, 250, ${glowIntensity * 0.15 / i})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbSize * (i * 3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Orb core
      const coreGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize);
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity})`);
      coreGradient.addColorStop(0.4, `rgba(196, 181, 253, ${glowIntensity * 0.8})`);
      coreGradient.addColorStop(1, `rgba(124, 58, 237, ${glowIntensity * 0.3})`);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting particles when glowing
      if (orbGlowing) {
        orbRef.current.particles.forEach(p => {
          p.angle += p.speed;
          const px = orbX + Math.cos(p.angle) * p.dist;
          const py = orbY + Math.sin(p.angle) * p.dist;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(196, 181, 253, ${0.3 + Math.sin(t * 3 + p.angle) * 0.2})`;
          ctx.fill();
        });
      }

      // Pulse wave effect
      if (pulseWave) {
        const pulseProgress = Math.min((t - (timeRef.current - 0.016)) * 0.8, 1);
        // This is handled by CSS animation overlay
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [orbGlowing, orbClicked, pulseWave]);

  const handleOrbClick = useCallback(() => {
    if (orbClicked) return;
    setOrbGlowing(true);
    play('sparkle');

    setTimeout(() => {
      setOrbClicked(true);
      setPulseWave(true);
      play('transition');

      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 1000);
  }, [orbClicked, onComplete, play]);

  const handleCanvasClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.changedTouches[0]?.clientY ?? 0 : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const orbX = rect.width / 2;
    const orbY = rect.height / 2 + 40;
    const dist = Math.sqrt((x - orbX) ** 2 + (y - orbY) ** 2);

    if (dist < 60) {
      handleOrbClick();
    }
  }, [handleOrbClick]);

  // Hover detection for orb glow
  const handleCanvasMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (orbClicked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const orbX = rect.width / 2;
    const orbY = rect.height / 2 + 40;
    const dist = Math.sqrt((x - orbX) ** 2 + (y - orbY) ** 2);
    setOrbGlowing(dist < 80);
  }, [orbClicked]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onTouchEnd={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
      />

      {/* Pulse wave overlay */}
      {pulseWave && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'rgba(167, 139, 250, 0.3)',
          animation: 'pulseWaveExpand 2s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Text overlay */}
      {showText && !orbClicked && (
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          animation: 'fadeInUp 2s ease forwards',
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.3rem, 4vw, 2.5rem)',
            fontWeight: 400,
            color: '#e2e8f0',
            letterSpacing: '0.08em',
            lineHeight: 1.4,
            marginBottom: '1rem',
          }}>
            {content.opening.title}
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            color: 'rgba(196, 181, 253, 0.7)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            animation: 'pulse 3s ease-in-out infinite',
          }}>
            {content.opening.subtitle}
          </p>
        </div>
      )}

      {/* Skip button */}
      {!orbClicked && (
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.3)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
        >
          SKIP INTRO →
        </button>
      )}

      <style>{`
        @keyframes pulseWaveExpand {
          0% { width: 10px; height: 10px; opacity: 1; }
          100% { width: 300vmax; height: 300vmax; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
