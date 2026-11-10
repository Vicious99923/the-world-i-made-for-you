import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }

function heartShape(t:number):[number,number]{
  const x=16*Math.pow(Math.sin(t),3);
  const y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
  return [x,y];
}

interface Particle {
  x: number; y: number;
  tx: number; ty: number;
  relX: number; relY: number;
  distFromCenter: number;
  size: number;
  color: string;
  speed: number;
  phase: number;
  baseBrightness: number;
}

const HEART_COLORS = ['#f43f5e', '#ec4899', '#f472b6', '#fda4af', '#fb7185', '#e11d48', '#ffffff'];

export const HeartOfLight: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const completedRef = useRef(false);
  const { play } = useSound();
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const initRef = useRef(false);
  const tapCountRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if(initRef.current) return;
    initRef.current = true;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 1400 : 2800;
    const w = window.innerWidth, h = window.innerHeight;
    const scale = Math.min(w, h) * (isMobile ? 0.023 : 0.017);
    const cx = w / 2, cy = h / 2 - (isMobile ? 10 : 20);
    const parts: Particle[] = [];

    // Center of heart mass is around (0, 3.8)
    const centerY = 3.8;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const [hx, hy] = heartShape(angle);
      // Uniform 2D area distribution
      const spread = Math.sqrt(Math.random());
      const relX = hx * spread;
      const relY = centerY + (hy - centerY) * spread;
      const distFromCenter = spread;

      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: cx + relX * scale,
        ty: cy + relY * scale,
        relX,
        relY,
        distFromCenter,
        size: Math.random() * (isMobile ? 1.8 : 2.0) + 0.6,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        speed: Math.random() * 0.035 + 0.014,
        phase: Math.random() * Math.PI * 2,
        baseBrightness: Math.random() * 0.3 + 0.7,
      });
    }

    // Dense glowing center - completely fills the middle
    const coreCount = isMobile ? 350 : 600;
    for (let i = 0; i < coreCount; i++) {
      const ca = Math.random() * Math.PI * 2;
      const cr = Math.random() * 7;
      const relX = Math.cos(ca) * cr;
      const relY = centerY + Math.sin(ca) * cr;
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: cx + relX * scale,
        ty: cy + relY * scale,
        relX,
        relY,
        distFromCenter: cr / 16,
        size: Math.random() * 2.2 + 0.8,
        color: i % 3 === 0 ? '#ffffff' : '#fda4af',
        speed: Math.random() * 0.04 + 0.02,
        phase: Math.random() * Math.PI * 2,
        baseBrightness: 1,
      });
    }

    particlesRef.current = parts;
    setTimeout(() => setShowText(true), 800);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';

      const w = window.innerWidth, h = window.innerHeight;
      const isMob = w < 768;
      const scale = Math.min(w, h) * (isMob ? 0.023 : 0.017);
      const cx = w / 2, cy = h / 2 - (isMob ? 10 : 20);
      particlesRef.current.forEach(p => {
        p.tx = cx + p.relX * scale;
        p.ty = cy + p.relY * scale;
      });
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const tc = tapCountRef.current;

      ctx.fillStyle = 'rgba(8, 2, 10, 0.28)';
      ctx.fillRect(0, 0, w, h);

      particlesRef.current.forEach(p => {
        // Move towards target heart position smoothly - NO repulsion hole!
        p.x += (p.tx - p.x) * p.speed;
        p.y += (p.ty - p.y) * p.speed;

        // Illumination levels:
        let particleIllumination = 0.14;
        if (tc === 0) {
          particleIllumination = 0.16 + Math.sin(t * 1.5 + p.phase) * 0.06;
        } else if (tc === 1) {
          particleIllumination = p.distFromCenter < 0.5 ? 0.9 : 0.25;
        } else if (tc === 2) {
          particleIllumination = p.distFromCenter < 0.85 ? 0.95 : 0.4;
        } else {
          particleIllumination = 1.0;
        }

        const breathe = Math.sin(t * 2 + p.phase) * 0.5 + 0.5;
        const alpha = Math.min(particleIllumination * (0.45 + p.baseBrightness * 0.5 + breathe * 0.2), 1.0);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.85 + breathe * 0.3), 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Extra sparkle on high taps
        if (tc >= 2 && p.baseBrightness > 0.85) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.globalAlpha = 0.05;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      // Center glow
      const glowAlpha = tc === 0 ? 0.02 : tc === 1 ? 0.06 : tc === 2 ? 0.1 : 0.15;
      const bg = ctx.createRadialGradient(w / 2, h / 2 - 10, 0, w / 2, h / 2 - 10, Math.min(w, h) * 0.35);
      bg.addColorStop(0, `rgba(244, 63, 94, ${glowAlpha + Math.sin(t * 2) * 0.02})`);
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    ctx.fillStyle = '#08020a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleHeartTap = useCallback(() => {
    play('heartbeat');
    play('sparkle');
    setTapCount(prev => {
      const next = prev + 1;
      tapCountRef.current = next;
      if (next >= 3) {
        setCanProceed(true);
      }
      return next;
    });
  }, [play]);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const getSubtitle = () => {
    if (tapCount === 0) return 'المسي القلب يا جنجونه عشان ينور… ♡';
    if (tapCount === 1) return 'المسي تاني وخليه ينور أكتر… 🌸';
    if (tapCount === 2) return 'لمسة كمان عشان ينور كله يا مغوليه… ✨';
    return 'كل حتة نورت بيكي يا هولي ♡';
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleHeartTap}
        onTouchEnd={e => {
          e.preventDefault();
          handleHeartTap();
        }}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
      />

      {showText && (
        <div style={{
          position: 'absolute', top: 'clamp(5%, 7vh, 10%)', left: 0, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none', animation: 'fadeInUp 1.8s ease forwards',
          zIndex: 5, padding: '0 1rem',
        }}>
          <div style={{ width: '92%', maxWidth: '540px', textAlign: 'center', direction: 'rtl' }}>
            <h2 style={{
              fontFamily: "'SaleemQuran', serif",
              fontSize: 'clamp(1.4rem, 4.8vw, 2.2rem)', fontWeight: 'normal', color: '#fce7f3',
              lineHeight: 1.6, marginBottom: '0.6rem', textAlign: 'center',
            }}>
              {content.heart.title}
            </h2>
            <p style={{
              fontFamily: "'SaleemQuran', serif",
              fontSize: 'clamp(1.05rem, 3.4vw, 1.35rem)', color: 'rgba(253,164,175,0.92)',
              animation: 'pulse 2.5s ease-in-out infinite',
              textAlign: 'center',
            }}>
              {getSubtitle()}
            </p>
          </div>
        </div>
      )}

      {/* Manual proceed button only */}
      <div style={{
        position: 'absolute', bottom: 'clamp(1.8rem, 4vh, 2.8rem)', left: 0, width: '100%',
        display: 'flex', justifyContent: 'center', textAlign: 'center', zIndex: 10,
        pointerEvents: 'none',
      }}>
        {canProceed && (
          <button
            onClick={triggerComplete}
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.35), rgba(236,72,153,0.35))',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff', fontFamily: "'SaleemQuran', serif", fontSize: '1rem',
              padding: '0.6rem 2rem', borderRadius: '30px', cursor: 'pointer',
              transition: 'all 0.3s ease', pointerEvents: 'auto',
              boxShadow: '0 8px 25px rgba(244,63,94,0.35)',
              animation: 'fadeInUp 0.8s ease forwards',
            }}>
            كملي للرسالة يا جنجونه →
          </button>
        )}
      </div>
    </div>
  );
};
