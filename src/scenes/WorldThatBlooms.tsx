import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }

interface Flower {
  x: number; y: number; size: number; color: string;
  bloomProgress: number; swayPhase: number; swaySpeed: number;
  stemHeight: number; petalCount: number;
}

interface Firefly {
  x: number; y: number; vx: number; vy: number;
  phase: number; size: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

const FLOWER_COLORS = ['#f472b6','#e879f9','#c084fc','#fb7185','#fda4af','#a78bfa','#f9a8d4'];
const TARGET_BLOOMS = 5;

export const WorldThatBlooms: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [bloomCount, setBloomCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { play } = useSound();
  const animRef = useRef(0);
  const flowersRef = useRef<Flower[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    firefliesRef.current = Array.from({ length: isMobile ? 15 : 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.7,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      size: Math.random() * 3 + 1.5,
    }));
    setTimeout(() => setShowText(true), 800);
    // Show skip button after 5 seconds
    setTimeout(() => setCanProceed(true), 5000);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
      mouseRef.current = { x: cx / window.innerWidth, y: cy / window.innerHeight };
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('touchmove', handleMove); };
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
    };
    resize();
    window.addEventListener('resize', resize);

    const drawFlower = (f: Flower) => {
      if (f.bloomProgress <= 0) return;
      const bp = Math.min(f.bloomProgress, 1);
      const sway = Math.sin(timeRef.current * f.swaySpeed + f.swayPhase) * 5 * bp;
      
      // Stem
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      const stemTop = f.y - f.stemHeight * bp;
      ctx.quadraticCurveTo(f.x + sway, f.y - f.stemHeight * 0.5 * bp, f.x + sway, stemTop);
      ctx.strokeStyle = `rgba(74, 160, 74, ${0.6 * bp})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Petals
      const ps = f.size * bp;
      const cx2 = f.x + sway, cy2 = stemTop;
      for (let i = 0; i < f.petalCount; i++) {
        const a = (i / f.petalCount) * Math.PI * 2 + timeRef.current * 0.2;
        ctx.save();
        ctx.translate(cx2, cy2);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(ps * 0.5, 0, ps * 0.6, ps * 0.3, 0, 0, Math.PI * 2);
        ctx.globalAlpha = bp * 0.8;
        ctx.fillStyle = f.color;
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      
      // Center dot
      ctx.beginPath(); ctx.arc(cx2, cy2, ps * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253,230,138,${bp})`; ctx.fill();
      
      // Glow
      const gg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, ps * 2);
      gg.addColorStop(0, `rgba(244,114,182,${0.08 * bp})`); gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(cx2, cy2, ps * 2, 0, Math.PI * 2); ctx.fill();
    };

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016;
      const t = timeRef.current;
      
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a0a2e'); bg.addColorStop(0.3, '#2d1b4e');
      bg.addColorStop(0.7, '#1a2a1a'); bg.addColorStop(1, '#0d1f0d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // Ground
      const groundY = h * 0.75;
      const gg = ctx.createLinearGradient(0, groundY, 0, h);
      gg.addColorStop(0, 'rgba(30,60,30,0.3)'); gg.addColorStop(1, 'rgba(15,40,15,0.6)');
      ctx.fillStyle = gg; ctx.fillRect(0, groundY, w, h - groundY);

      // Fog
      for (let i = 0; i < 3; i++) {
        const fy = groundY - 50 + i * 30;
        ctx.fillStyle = `rgba(196,181,253,${0.02 + Math.sin(t * 0.5 + i) * 0.01})`;
        ctx.fillRect(0, fy - 20, w, 40);
      }

      // Draw flowers
      flowersRef.current.forEach(f => { if (f.bloomProgress < 1) f.bloomProgress += 0.02; drawFlower(f); });

      // Draw fireflies
      const mx = mouseRef.current.x * w, my = mouseRef.current.y * h;
      firefliesRef.current.forEach(ff => {
        ff.x += ff.vx; ff.y += ff.vy; ff.phase += 0.03;
        if (ff.x < 0 || ff.x > w) ff.vx *= -1;
        if (ff.y < 0 || ff.y > h * 0.7) ff.vy *= -1;
        const dx = ff.x - mx, dy = ff.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100 && d > 0) { ff.vx += dx / d * 0.2; ff.vy += dy / d * 0.2; }
        ff.vx *= 0.98; ff.vy *= 0.98;
        const alpha = 0.3 + Math.sin(ff.phase) * 0.3;
        ctx.beginPath(); ctx.arc(ff.x, ff.y, ff.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253,230,138,${alpha + 0.3})`; ctx.fill();
        // Glow
        const gr = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.size * 4);
        gr.addColorStop(0, `rgba(253,230,138,${alpha * 0.4})`); gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ff.x, ff.y, ff.size * 4, 0, Math.PI * 2); ctx.fill();
      });

      // Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy -= 0.02; p.life--;
        const a = p.life / p.maxLife;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Mouse trail
      const tg = ctx.createRadialGradient(mx, my, 0, mx, my, 40);
      tg.addColorStop(0, 'rgba(196,181,253,0.06)'); tg.addColorStop(1, 'transparent');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(mx, my, 40, 0, Math.PI * 2); ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const addFlower = useCallback((cx: number, cy: number) => {
    const groundY = window.innerHeight * 0.75;
    const y = Math.max(cy, groundY);
    const flower: Flower = {
      x: cx, y, size: Math.random() * 12 + 8,
      color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      bloomProgress: 0, swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 2 + 1, stemHeight: Math.random() * 60 + 40,
      petalCount: Math.floor(Math.random() * 3) + 5,
    };
    flowersRef.current.push(flower);
    play('bloom');
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: cx, y: y - flower.stemHeight * 0.3,
        vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2 - 0.5,
        life: 50, maxLife: 50, color: flower.color, size: Math.random() * 3 + 1,
      });
    }
    setBloomCount(prev => {
      const n = prev + 1;
      if (n >= TARGET_BLOOMS) { setCanProceed(true); }
      return n;
    });
  }, [play]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    addFlower(e.clientX, e.clientY);
  }, [addFlower]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) addFlower(touch.clientX, touch.clientY);
  }, [addFlower]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} onClick={handleClick} onTouchEnd={handleTouch}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
      {showText && (
        <div style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', pointerEvents: 'none', animation: 'fadeInUp 1.5s ease forwards',
          width: '90%', maxWidth: '600px',
        }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.2rem, 3.5vw, 2rem)', fontWeight: 400, color: '#fce7f3',
            letterSpacing: '0.03em', lineHeight: 1.5, marginBottom: '0.7rem' }}>
            {content.garden.title}
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(0.8rem, 2vw, 1rem)', color: 'rgba(249,168,212,0.7)', fontStyle: 'italic' }}>
            {content.garden.subtitle}
          </p>
        </div>
      )}
      {/* Progress + Skip */}
      <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10 }}>
        <div style={{ width: '120px', height: '2px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '1px', overflow: 'hidden', margin: '0 auto' }}>
          <div style={{ height: '100%', width: `${Math.min((bloomCount / TARGET_BLOOMS) * 100, 100)}%`,
            background: 'linear-gradient(90deg, #f472b6, #e879f9)', transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
          marginTop: '0.5rem', letterSpacing: '0.1em', pointerEvents: 'none' }}>اضغطي عشان تزهر 🌸</p>
        {canProceed && (
          <button onClick={onComplete} style={{
            marginTop: '1rem', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)',
            fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em',
            padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer',
            transition: 'all 0.3s ease', backdropFilter: 'blur(5px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >كملي →</button>
        )}
      </div>
    </div>
  );
};
