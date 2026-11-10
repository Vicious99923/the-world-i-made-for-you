import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }
interface Orb {
  id: string; x: number; y: number; baseX: number; baseY: number;
  size: number; color: string; glowColor: string; phase: number;
  speed: number; discovered: boolean;
}

const ORB_COLORS = ['#fbbf24','#f9a8d4','#a78bfa','#67e8f9','#fdba74'];
const ORB_GLOWS = ['rgba(251,191,36,0.3)','rgba(249,168,212,0.3)','rgba(167,139,250,0.3)','rgba(103,232,249,0.3)','rgba(253,186,116,0.3)'];

export const LittleThings: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeOrb, setActiveOrb] = useState<string | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { play } = useSound();
  const animRef = useRef(0);
  const orbsRef = useRef<Orb[]>([]);
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const w = window.innerWidth, h = window.innerHeight;
    const positions = [
      { x: 0.25, y: 0.3 }, { x: 0.7, y: 0.25 }, { x: 0.15, y: 0.6 },
      { x: 0.8, y: 0.55 }, { x: 0.5, y: 0.45 },
    ];
    orbsRef.current = content.moments.map((m, i) => ({
      id: m.id, x: positions[i % 5].x * w, y: positions[i % 5].y * h,
      baseX: positions[i % 5].x * w, baseY: positions[i % 5].y * h,
      size: 22 + i * 3, color: ORB_COLORS[i % 5], glowColor: ORB_GLOWS[i % 5],
      phase: i * 1.2, speed: 0.3 + i * 0.1, discovered: false,
    }));
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      mouseRef.current = { x: cx, y: cy };
      trailRef.current.push({ x: cx, y: cy, alpha: 1 });
      if (trailRef.current.length > 20) trailRef.current.shift();
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
      const dpr = window.devicePixelRatio;
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px';
    };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016; const t = timeRef.current;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a0a2e'); bg.addColorStop(0.5, '#2d1b4e'); bg.addColorStop(1, '#44234a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 50; i++) {
        const px = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
        const py = (Math.cos(t * 0.2 + i * 2.3) * 0.5 + 0.5) * h;
        ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.sin(t + i) * 0.03})`; ctx.fill();
      }

      trailRef.current.forEach(p => { p.alpha -= 0.03; if (p.alpha > 0) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,181,253,${p.alpha * 0.3})`; ctx.fill();
      }});
      trailRef.current = trailRef.current.filter(p => p.alpha > 0);

      orbsRef.current.forEach(orb => {
        orb.x = orb.baseX + Math.sin(t * orb.speed + orb.phase) * 15;
        orb.y = orb.baseY + Math.cos(t * orb.speed * 0.7 + orb.phase) * 10;
        const dx = mouseRef.current.x - orb.x, dy = mouseRef.current.y - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { orb.x += dx * 0.02; orb.y += dy * 0.02; }
        const hovered = dist < orb.size + 30;
        const ds = hovered ? orb.size * 1.2 : orb.size;
        for (let g = 3; g > 0; g--) {
          const gg = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, ds * g * 2);
          gg.addColorStop(0, orb.glowColor); gg.addColorStop(1, 'transparent');
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(orb.x, orb.y, ds * g * 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(orb.x, orb.y, ds, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${hovered ? 0.3 : 0.12})`; ctx.lineWidth = 1; ctx.stroke();
        const sg = ctx.createRadialGradient(orb.x - ds * 0.3, orb.y - ds * 0.3, 0, orb.x, orb.y, ds);
        sg.addColorStop(0, 'rgba(255,255,255,0.15)'); sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(orb.x, orb.y, ds, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(orb.x, orb.y, ds * 0.3, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, ds * 0.3);
        cg.addColorStop(0, orb.color); cg.addColorStop(1, 'transparent');
        ctx.fillStyle = cg; ctx.fill();
        if (orb.discovered) {
          ctx.beginPath(); ctx.arc(orb.x, orb.y + ds + 10, 3, 0, Math.PI * 2);
          ctx.fillStyle = orb.color; ctx.fill();
        }
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const cx = 'touches' in e ? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const cy = 'touches' in e ? e.changedTouches[0]?.clientY ?? 0 : e.clientY;
    for (const orb of orbsRef.current) {
      const dx = cx - orb.x, dy = cy - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < orb.size + 20) {
        if (!orb.discovered) { orb.discovered = true;
          setDiscoveredCount(prev => { const n = prev + 1; if (n >= content.moments.length) setTimeout(() => onComplete(), 3000); return n; });
        }
        setActiveOrb(orb.id === activeOrb ? null : orb.id);
        play('reveal'); break;
      }
    }
  }, [activeOrb, onComplete, play]);

  const activeMoment = content.moments.find(m => m.id === activeOrb);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} onClick={handleClick} onTouchEnd={handleClick}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
      {activeMoment && (
        <div onClick={() => setActiveOrb(null)} style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          textAlign: 'center', maxWidth: '500px', width: '85%', padding: '2.5rem',
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeInUp 0.8s ease forwards', zIndex: 10, cursor: 'pointer',
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 500, color: '#fef3c7',
            marginBottom: '1rem', letterSpacing: '0.03em' }}>{activeMoment.title}</h3>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            {activeMoment.text}</p>
          {activeMoment.subtitle && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.4)', marginTop: '1rem', letterSpacing: '0.05em' }}>{activeMoment.subtitle}</p>}
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '1.5rem' }}>tap to close</p>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.15em' }}>{discoveredCount} / {content.moments.length} DISCOVERED</p>
      </div>
    </div>
  );
};
