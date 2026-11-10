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

interface Shockwave {
  x: number; y: number;
  r: number; maxR: number;
  alpha: number;
}

interface OrbitSpark {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  color: string;
}

const HEART_COLORS = ['#f43f5e', '#ec4899', '#f472b6', '#fda4af', '#fb7185', '#e11d48', '#ffffff', '#fde047'];

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
  const shockwavesRef = useRef<Shockwave[]>([]);
  const orbitSparksRef = useRef<OrbitSpark[]>([]);
  const pulseScaleRef = useRef(1.0);
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
    const count = isMobile ? 1400 : 2600;
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
        size: Math.random() * (isMobile ? 1.8 : 2.2) + 0.6,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        speed: Math.random() * 0.04 + 0.018,
        phase: Math.random() * Math.PI * 2,
        baseBrightness: Math.random() * 0.35 + 0.65,
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
        speed: Math.random() * 0.045 + 0.02,
        phase: Math.random() * Math.PI * 2,
        baseBrightness: 1,
      });
    }

    // Orbiting sparks
    const sparkCount = isMobile ? 25 : 45;
    for (let i = 0; i < sparkCount; i++) {
      orbitSparksRef.current.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * (isMobile ? 90 : 140) + 30,
        speed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 1,
        color: i % 2 === 0 ? '#fde047' : '#ffffff',
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
      const isMob = w < 768;
      const cx = w / 2, cy = h / 2 - (isMob ? 10 : 20);

      // Smooth decay of heartbeat scale bounce
      pulseScaleRef.current += (1.0 - pulseScaleRef.current) * 0.08;
      // Idle natural breathing beat (pulsing subtly like real life)
      const idleBeat = tc > 0 ? Math.sin(t * 3.5) * 0.03 : Math.sin(t * 1.5) * 0.015;
      const currentScale = pulseScaleRef.current + idleBeat;

      ctx.fillStyle = 'rgba(8, 2, 10, 0.28)';
      ctx.fillRect(0, 0, w, h);

      // Draw and expand shockwave rings from touches
      shockwavesRef.current = shockwavesRef.current.filter(sw => sw.alpha > 0.01);
      shockwavesRef.current.forEach(sw => {
        sw.r += (sw.maxR - sw.r) * 0.07 + 2;
        sw.alpha *= 0.94;

        const g = ctx.createRadialGradient(sw.x, sw.y, Math.max(0, sw.r - 20), sw.x, sw.y, sw.r);
        g.addColorStop(0, `rgba(244, 63, 94, 0)`);
        g.addColorStop(0.8, `rgba(251, 113, 133, ${sw.alpha * 0.4})`);
        g.addColorStop(1, `rgba(255, 255, 255, ${sw.alpha * 0.8})`);

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(254, 205, 211, ${sw.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Update and draw particles with organic living motion
      particlesRef.current.forEach(p => {
        // Organic gentle sway around target
        const swayX = Math.sin(t * 1.8 + p.phase) * (isMob ? 2.5 : 4.0);
        const swayY = Math.cos(t * 2.2 + p.phase) * (isMob ? 2.5 : 4.0);

        // Target with pulse scale applied relative to center
        const targetX = cx + (p.tx - cx) * currentScale + swayX;
        const targetY = cy + (p.ty - cy) * currentScale + swayY;

        p.x += (targetX - p.x) * p.speed;
        p.y += (targetY - p.y) * p.speed;

        // Illumination progression:
        let particleIllumination = 0.14;
        if (tc === 0) {
          particleIllumination = 0.18 + Math.sin(t * 2 + p.phase) * 0.07;
        } else if (tc === 1) {
          particleIllumination = p.distFromCenter < 0.55 ? 0.92 : 0.3;
        } else if (tc === 2) {
          particleIllumination = p.distFromCenter < 0.88 ? 0.96 : 0.45;
        } else {
          particleIllumination = 1.0;
        }

        const breathe = Math.sin(t * 2.5 + p.phase) * 0.5 + 0.5;
        const alpha = Math.min(particleIllumination * (0.5 + p.baseBrightness * 0.5 + breathe * 0.25), 1.0);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.85 + breathe * 0.35), 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Extra radiant sparkle on active state
        if (tc >= 2 && p.baseBrightness > 0.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.globalAlpha = 0.06 * particleIllumination;
          ctx.fill();
        }
      });

      // Draw swirling sparkles orbiting the heart when touched
      if (tc > 0) {
        orbitSparksRef.current.forEach(spark => {
          spark.angle += spark.speed;
          const sx = cx + Math.cos(spark.angle) * spark.dist * currentScale;
          const sy = cy + Math.sin(spark.angle) * (spark.dist * 0.8) * currentScale;

          const sparkAlpha = Math.min(tc * 0.3, 0.9) * (0.5 + Math.sin(t * 4 + spark.angle) * 0.4);

          ctx.beginPath();
          ctx.arc(sx, sy, spark.size, 0, Math.PI * 2);
          ctx.globalAlpha = Math.max(0, sparkAlpha);
          ctx.fillStyle = spark.color;
          ctx.fill();
        });
      }

      ctx.globalAlpha = 1;

      // Ambient radial heart glow
      const glowAlpha = tc === 0 ? 0.02 : tc === 1 ? 0.08 : tc === 2 ? 0.12 : 0.18;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.38 * currentScale);
      bg.addColorStop(0, `rgba(244, 63, 94, ${glowAlpha + Math.sin(t * 2.5) * 0.02})`);
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

  const handleHeartTap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    play('heartbeat');
    play('sparkle');

    // Trigger heartbeat pulse bounce
    pulseScaleRef.current = 1.18;

    // Trigger shockwave of light from center
    const w = window.innerWidth, h = window.innerHeight;
    const isMob = w < 768;
    const cx = w / 2, cy = h / 2 - (isMob ? 10 : 20);

    shockwavesRef.current.push({
      x: cx,
      y: cy,
      r: 8,
      maxR: Math.min(w, h) * 0.42,
      alpha: 0.9,
    });

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
          handleHeartTap(e);
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
