import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }

function heartShape(t: number): [number, number] {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return [x, y];
}

export const HeartOfLight: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { play } = useSound();
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<{x:number;y:number;tx:number;ty:number;size:number;color:string;speed:number;phase:number;brightness:number}[]>([]);
  const initRef = useRef(false);
  const clickCountRef = useRef(0);

  const COLORS = ['#be185d','#db2777','#ec4899','#f472b6','#fda4af','#ffffff'];

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 1200 : 3000;
    const w = window.innerWidth, h = window.innerHeight;
    const scale = Math.min(w, h) * 0.016;
    const cx = w/2, cy = h/2 - 20;
    const parts: typeof particlesRef.current = [];
    for (let i = 0; i < count; i++) {
      const angle = (i/count)*Math.PI*2;
      const [hx,hy] = heartShape(angle);
      const spread = Math.random()*0.85+0.15;
      const tx = cx + hx*scale*spread;
      const ty = cy + hy*scale*spread;
      parts.push({
        x: Math.random()*w, y: Math.random()*h, tx, ty,
        size: Math.random()*1.8+0.4,
        color: COLORS[Math.floor(Math.random()*COLORS.length)],
        speed: Math.random()*0.03+0.01,
        phase: Math.random()*Math.PI*2,
        brightness: Math.random(),
      });
    }
    particlesRef.current = parts;
    setTimeout(() => setShowText(true), 1200);
    setTimeout(() => setCanProceed(true), 6000);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent|TouchEvent) => {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX??0 : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY??0 : (e as MouseEvent).clientY;
      mouseRef.current = { x: cx/window.innerWidth, y: cy/window.innerHeight };
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
      const dpr = window.devicePixelRatio||1;
      canvas.width = window.innerWidth*dpr; canvas.height = window.innerHeight*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      canvas.style.width = window.innerWidth+'px'; canvas.style.height = window.innerHeight+'px';
    };
    resize(); window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016; const t = timeRef.current;
      ctx.fillStyle = 'rgba(10,0,8,0.2)';
      ctx.fillRect(0,0,w,h);
      if (Math.floor(t*5)%2===0) { ctx.fillStyle='rgba(10,0,8,0.3)'; ctx.fillRect(0,0,w,h); }

      const mx = mouseRef.current.x*w, my = mouseRef.current.y*h;
      particlesRef.current.forEach(p => {
        p.x += (p.tx-p.x)*p.speed;
        p.y += (p.ty-p.y)*p.speed;
        const dx=p.x-mx, dy=p.y-my, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<70&&dist>0) { p.x += (dx/dist)*2.5; p.y += (dy/dist)*2.5; }
        const breathe = Math.sin(t*1.5+p.phase)*0.5+0.5;
        const alpha = 0.3+p.brightness*0.5+breathe*0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*(0.8+breathe*0.4), 0, Math.PI*2);
        ctx.globalAlpha = Math.min(alpha,1);
        ctx.fillStyle = p.color;
        ctx.fill();
        if (p.brightness>0.8) {
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size*3,0,Math.PI*2);
          ctx.globalAlpha=0.04; ctx.fill();
        }
      });
      ctx.globalAlpha=1;
      // Bloom glow
      const bg = ctx.createRadialGradient(w/2,h/2-20,0,w/2,h/2-20,180);
      bg.addColorStop(0,`rgba(219,39,119,${0.025+Math.sin(t)*0.01})`); bg.addColorStop(1,'transparent');
      ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);

      animRef.current = requestAnimationFrame(draw);
    };
    ctx.fillStyle='#0a0008'; ctx.fillRect(0,0,canvas.width,canvas.height);
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); };
  }, []);

  const handleClick = useCallback(() => {
    clickCountRef.current++;
    play('heartbeat');
    if (clickCountRef.current >= 3) setCanProceed(true);
  }, [play]);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <canvas ref={canvasRef} onClick={handleClick} onTouchEnd={handleClick}
        style={{ position:'absolute', inset:0, cursor:'pointer' }} />
      {showText && (
        <div style={{ position:'absolute', top:'8%', left:'50%', transform:'translateX(-50%)',
          textAlign:'center', pointerEvents:'none', animation:'fadeInUp 2s ease forwards',
          width:'90%', maxWidth:'500px' }}>
          <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",
            fontSize:'clamp(1.1rem,3.5vw,1.8rem)', fontWeight:400, color:'#fce7f3',
            letterSpacing:'0.03em', lineHeight:1.5, marginBottom:'0.7rem' }}>
            {content.heart.title}
          </h2>
          <p style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:'clamp(0.8rem,2vw,1rem)', color:'rgba(253,164,175,0.7)', fontStyle:'italic',
            animation:'pulse 3s ease-in-out infinite' }}>
            {content.heart.subtitle}
          </p>
        </div>
      )}
      <div style={{ position:'absolute', bottom:'2.5rem', left:'50%', transform:'translateX(-50%)',
        textAlign:'center', zIndex:10 }}>
        {canProceed && (
          <button onClick={onComplete} style={{
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
            color:'rgba(255,255,255,0.7)', fontFamily:"'Inter',sans-serif", fontSize:'0.75rem',
            letterSpacing:'0.1em', padding:'0.5rem 1.5rem', borderRadius:'20px', cursor:'pointer',
            transition:'all 0.3s ease', backdropFilter:'blur(5px)',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.2)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)'}}
          >كملي للرسالة →</button>
        )}
      </div>
    </div>
  );
};
