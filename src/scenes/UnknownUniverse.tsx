import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }

export const UnknownUniverse: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [orbGlowing, setOrbGlowing] = useState(false);
  const [orbClicked, setOrbClicked] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { play } = useSound();
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const starsRef = useRef<{x:number;y:number;z:number;size:number;brightness:number;twinkleSpeed:number;phase:number}[]>([]);
  const orbParticlesRef = useRef<{angle:number;dist:number;speed:number;size:number}[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = window.innerWidth < 768;
    starsRef.current = Array.from({ length: isMobile ? 600 : 1500 }, () => ({
      x: Math.random(), y: Math.random(), z: Math.random(),
      size: Math.random() * 1.8 + 0.3, brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005, phase: Math.random() * Math.PI * 2,
    }));
    orbParticlesRef.current = Array.from({ length: 20 }, () => ({
      angle: Math.random() * Math.PI * 2, dist: Math.random() * 35 + 15,
      speed: (Math.random() - 0.5) * 0.02, size: Math.random() * 2 + 1,
    }));
    setTimeout(() => setShowText(true), 800);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
      mouseRef.current = { x: cx / window.innerWidth, y: cy / window.innerHeight };
    };
    window.addEventListener('mousemove', h);
    window.addEventListener('touchmove', h, { passive: true });
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('touchmove', h); };
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
      ctx.fillStyle = '#030014'; ctx.fillRect(0, 0, w, h);
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      // Nebulae
      const nebulaData = [{x:0.3,y:0.4,r:200,c:'#4c1d95'},{x:0.7,y:0.6,r:250,c:'#312e81'},{x:0.5,y:0.3,r:180,c:'#1e1b4b'}];
      nebulaData.forEach((n,i) => {
        const nx = n.x*w + Math.sin(t*0.3+i)*30 + (mx-0.5)*-20;
        const ny = n.y*h + Math.cos(t*0.2+i)*20 + (my-0.5)*-20;
        const g = ctx.createRadialGradient(nx,ny,0,nx,ny,n.r);
        g.addColorStop(0, n.c+'18'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx,ny,n.r,0,Math.PI*2); ctx.fill();
      });

      // Stars with parallax
      starsRef.current.forEach(s => {
        const p = s.z*0.5+0.5;
        const sx = s.x*w + (mx-0.5)*-25*p;
        const sy = s.y*h + (my-0.5)*-25*p;
        const twinkle = 0.4+Math.sin(t*s.twinkleSpeed*60+s.phase)*0.4;
        ctx.beginPath(); ctx.arc(sx, sy, s.size*p, 0, Math.PI*2);
        ctx.fillStyle = `rgba(220,210,255,${s.brightness*twinkle})`;
        ctx.fill();
      });

      // Central orb
      const isMobile = w < 768;
      const orbX = w / 2, orbY = h / 2 + (isMobile ? 15 : 40);
      const baseGlow = 0.3 + Math.sin(t * 2) * 0.15;
      const glow = orbGlowing ? 0.8 : baseGlow;
      const orbSize = orbGlowing ? (isMobile ? 16 : 18) : (isMobile ? 12 : 14);

      for (let i=3;i>0;i--) {
        const g = ctx.createRadialGradient(orbX,orbY,0,orbX,orbY,orbSize*i*3);
        g.addColorStop(0,`rgba(167,139,250,${glow*0.12/i})`); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(orbX,orbY,orbSize*i*3,0,Math.PI*2); ctx.fill();
      }
      const cg = ctx.createRadialGradient(orbX,orbY,0,orbX,orbY,orbSize);
      cg.addColorStop(0,`rgba(255,255,255,${glow})`);
      cg.addColorStop(0.4,`rgba(196,181,253,${glow*0.8})`);
      cg.addColorStop(1,`rgba(124,58,237,${glow*0.3})`);
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(orbX,orbY,orbSize,0,Math.PI*2); ctx.fill();

      if (orbGlowing) {
        orbParticlesRef.current.forEach(p => {
          p.angle += p.speed;
          const px = orbX+Math.cos(p.angle)*p.dist;
          const py = orbY+Math.sin(p.angle)*p.dist;
          ctx.beginPath(); ctx.arc(px,py,p.size,0,Math.PI*2);
          ctx.fillStyle=`rgba(196,181,253,${0.3+Math.sin(t*3+p.angle)*0.2})`; ctx.fill();
        });
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [orbGlowing]);

  const handleOrbClick = useCallback(() => {
    if (orbClicked) return;
    setOrbGlowing(true);
    play('sparkle');
    setTimeout(() => {
      setOrbClicked(true);
      play('transition');
      setTimeout(() => onComplete(), 1500);
    }, 800);
  }, [orbClicked, onComplete, play]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isMobile = window.innerWidth < 768;
    const orbX = rect.width / 2, orbY = rect.height / 2 + (isMobile ? 15 : 40);
    const dist = Math.sqrt((e.clientX - rect.left - orbX) ** 2 + (e.clientY - rect.top - orbY) ** 2);
    if (dist < (isMobile ? 70 : 60)) handleOrbClick();
  }, [handleOrbClick]);

  const handleCanvasTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const touch = e.changedTouches[0];
    if (!rect || !touch) return;
    const isMobile = window.innerWidth < 768;
    const orbX = rect.width / 2, orbY = rect.height / 2 + (isMobile ? 15 : 40);
    const dist = Math.sqrt((touch.clientX - rect.left - orbX) ** 2 + (touch.clientY - rect.top - orbY) ** 2);
    if (dist < 90) handleOrbClick();
  }, [handleOrbClick]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (orbClicked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isMobile = window.innerWidth < 768;
    const orbX = rect.width / 2, orbY = rect.height / 2 + (isMobile ? 15 : 40);
    const dist = Math.sqrt((e.clientX - rect.left - orbX) ** 2 + (e.clientY - rect.top - orbY) ** 2);
    setOrbGlowing(dist < 80);
  }, [orbClicked]);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <canvas ref={canvasRef} onClick={handleCanvasClick} onTouchEnd={handleCanvasTouch}
        onMouseMove={handleCanvasMove}
        style={{ position:'absolute', inset:0, cursor:'pointer' }} />

      {showText && !orbClicked && (
        <div style={{ position:'absolute', top:'clamp(18%, 24vh, 28%)', left:'50%', transform:'translateX(-50%)',
          textAlign:'center', pointerEvents:'none', animation:'fadeInUp 2s ease forwards',
          width:'90%', maxWidth:'500px' }}>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",
            fontSize:'clamp(1.2rem,4vw,2.2rem)', fontWeight:400, color:'#e2e8f0',
            letterSpacing:'0.06em', lineHeight:1.4, marginBottom:'1rem' }}>
            {content.opening.title}
          </h1>
          <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:'clamp(0.85rem,2vw,1.1rem)', color:'rgba(196,181,253,0.7)',
            fontStyle:'italic', animation:'pulse 3s ease-in-out infinite' }}>
            {content.opening.subtitle}
          </p>
        </div>
      )}

      {!orbClicked && (
        <button onClick={() => onComplete()} style={{
          position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)',
          background:'none', border:'none', color:'rgba(255,255,255,0.3)',
          fontFamily:"'Inter',sans-serif", fontSize:'0.7rem', letterSpacing:'0.12em',
          cursor:'pointer', padding:'0.5rem 1rem', transition:'color 0.3s ease',
        }}
        onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,255,255,0.6)'}}
        onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.3)'}}
        >تخطي ←</button>
      )}
    </div>
  );
};
