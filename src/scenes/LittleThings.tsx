import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }
interface Orb {
  id: string; x: number; y: number; baseX: number; baseY: number;
  size: number; color: string; phase: number; speed: number; discovered: boolean;
}

const ORB_COLORS = ['#fbbf24','#f9a8d4','#a78bfa','#67e8f9','#fdba74'];

export const LittleThings: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeOrb, setActiveOrb] = useState<string | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { play } = useSound();
  const animRef = useRef(0);
  const orbsRef = useRef<Orb[]>([]);
  const timeRef = useRef(0);
  const initRef = useRef(false);

  // Show skip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setCanProceed(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const w = window.innerWidth, h = window.innerHeight;
    const positions = [
      { x: 0.2, y: 0.25 }, { x: 0.75, y: 0.2 }, { x: 0.15, y: 0.55 },
      { x: 0.8, y: 0.5 }, { x: 0.5, y: 0.4 },
    ];
    orbsRef.current = content.moments.slice(0, 5).map((m, i) => ({
      id: m.id, x: positions[i].x * w, y: positions[i].y * h,
      baseX: positions[i].x * w, baseY: positions[i].y * h,
      size: 25, color: ORB_COLORS[i % 5],
      phase: i * 1.3, speed: 0.4 + i * 0.08, discovered: false,
    }));
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
      mouseRef.current = { x: cx, y: cy };
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
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px';
    };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016; const t = timeRef.current;
      
      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a0a2e'); bg.addColorStop(0.5, '#2d1b4e'); bg.addColorStop(1, '#44234a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // Ambient particles
      for (let i = 0; i < 40; i++) {
        const px = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
        const py = (Math.cos(t * 0.2 + i * 2.3) * 0.5 + 0.5) * h;
        ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.sin(t + i) * 0.02})`; ctx.fill();
      }

      // Draw orbs
      orbsRef.current.forEach(orb => {
        orb.x = orb.baseX + Math.sin(t * orb.speed + orb.phase) * 15;
        orb.y = orb.baseY + Math.cos(t * orb.speed * 0.7 + orb.phase) * 10;
        
        const dx = mouseRef.current.x - orb.x, dy = mouseRef.current.y - orb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) { orb.x += dx * 0.015; orb.y += dy * 0.015; }
        const hovered = dist < orb.size + 30;
        const ds = hovered ? orb.size * 1.3 : orb.size;

        // Glow
        const gg = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, ds * 4);
        gg.addColorStop(0, orb.color + '30'); gg.addColorStop(1, 'transparent');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(orb.x, orb.y, ds * 4, 0, Math.PI * 2); ctx.fill();

        // Glass sphere
        ctx.beginPath(); ctx.arc(orb.x, orb.y, ds, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${hovered ? 0.35 : 0.12})`; ctx.lineWidth = 1; ctx.stroke();

        // Inner shine
        const sg = ctx.createRadialGradient(orb.x - ds * 0.3, orb.y - ds * 0.3, 0, orb.x, orb.y, ds);
        sg.addColorStop(0, 'rgba(255,255,255,0.2)'); sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(orb.x, orb.y, ds, 0, Math.PI * 2); ctx.fill();

        // Core light
        ctx.beginPath(); ctx.arc(orb.x, orb.y, ds * 0.35, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, ds * 0.35);
        cg.addColorStop(0, orb.color); cg.addColorStop(1, 'transparent');
        ctx.fillStyle = cg; ctx.fill();

        // Discovered indicator
        if (orb.discovered) {
          ctx.beginPath(); ctx.arc(orb.x, orb.y + ds + 12, 3, 0, Math.PI * 2);
          ctx.fillStyle = orb.color; ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeOrb) return; // Don't handle if overlay is showing
    const cx = e.clientX, cy = e.clientY;
    for (const orb of orbsRef.current) {
      const dx = cx - orb.x, dy = cy - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < orb.size + 25) {
        if (!orb.discovered) {
          orb.discovered = true;
          setDiscoveredCount(prev => {
            const n = prev + 1;
            if (n >= content.moments.length) setCanProceed(true);
            return n;
          });
        }
        setActiveOrb(orb.id);
        play('reveal');
        break;
      }
    }
  }, [activeOrb, play]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeOrb) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    for (const orb of orbsRef.current) {
      const dx = touch.clientX - orb.x, dy = touch.clientY - orb.y;
      if (Math.sqrt(dx * dx + dy * dy) < orb.size + 25) {
        if (!orb.discovered) {
          orb.discovered = true;
          setDiscoveredCount(prev => {
            const n = prev + 1;
            if (n >= content.moments.length) setCanProceed(true);
            return n;
          });
        }
        setActiveOrb(orb.id);
        play('reveal');
        break;
      }
    }
  }, [activeOrb, play]);

  const activeMoment = content.moments.find(m => m.id === activeOrb);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} onClick={handleClick} onTouchEnd={handleTouch}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
      
      {/* Content reveal overlay */}
      {activeMoment && (
        <div onClick={() => setActiveOrb(null)} style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', zIndex: 10, cursor: 'pointer',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            maxWidth: '500px', width: '85%', padding: '2.5rem',
            background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)',
            animation: 'fadeInUp 0.6s ease forwards', textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 500, color: '#fef3c7',
              marginBottom: '1rem' }}>{activeMoment.title}</h3>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
              {activeMoment.text}</p>
            {activeMoment.subtitle && <p style={{ fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>{activeMoment.subtitle}</p>}
            <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: '1.5rem' }}>اضغطي عشان تقفلي</p>
          </div>
        </div>
      )}

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 5 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em', pointerEvents: 'none' }}>
          {discoveredCount} / {content.moments.length} اكتشفتي 💫
        </p>
        {canProceed && (
          <button onClick={onComplete} style={{
            marginTop: '0.8rem', background: 'rgba(255,255,255,0.1)',
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
