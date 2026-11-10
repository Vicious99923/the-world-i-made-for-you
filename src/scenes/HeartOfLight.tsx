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
  hx: number; hy: number;
  spread: number;
  size: number;
  color: string;
  speed: number;
  phase: number;
  brightness: number;
}

export const HeartOfLight: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const completedRef = useRef(false);
  const mouseRef = useRef({x:0.5,y:0.5});
  const { play } = useSound();
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const clickCountRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const initRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const COLORS = ['#be185d','#db2777','#ec4899','#f472b6','#fda4af','#ffffff'];

  const addTimer = (id: number) => {
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if(initRef.current)return; initRef.current=true;
    const isMobile=window.innerWidth<768;
    const count=isMobile?1000:2500;
    const w=window.innerWidth,h=window.innerHeight;
    const scale=Math.min(w,h)*(isMobile ? 0.022 : 0.016);
    const cx=w/2,cy=h/2-(isMobile ? 10 : 20);
    const parts:Particle[]=[];
    for(let i=0;i<count;i++){
      const angle=(i/count)*Math.PI*2;
      const [hx,hy]=heartShape(angle);
      const spread=Math.random()*0.85+0.15;
      parts.push({
        x:Math.random()*w,y:Math.random()*h,
        tx:cx+hx*scale*spread,ty:cy+hy*scale*spread,
        hx, hy, spread,
        size:Math.random()*(isMobile ? 1.6 : 1.8)+0.4,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],
        speed:Math.random()*0.03+0.01,
        phase:Math.random()*Math.PI*2,
        brightness:Math.random(),
      });
    }
    particlesRef.current=parts;
    addTimer(window.setTimeout(()=>setShowText(true),1200));
    addTimer(window.setTimeout(()=>setCanProceed(true),8000));
  }, []);

  useEffect(() => {
    const h=(e:MouseEvent|TouchEvent)=>{
      const cx='touches' in e?(e as TouchEvent).touches[0]?.clientX??0:(e as MouseEvent).clientX;
      const cy='touches' in e?(e as TouchEvent).touches[0]?.clientY??0:(e as MouseEvent).clientY;
      mouseRef.current={x:cx/window.innerWidth,y:cy/window.innerHeight};
    };
    window.addEventListener('mousemove',h);window.addEventListener('touchmove',h,{passive:true});
    return()=>{window.removeEventListener('mousemove',h);window.removeEventListener('touchmove',h);};
  }, []);

  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    const resize=()=>{
      const dpr=window.devicePixelRatio||1;
      canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      canvas.style.width=window.innerWidth+'px';canvas.style.height=window.innerHeight+'px';

      const w=window.innerWidth, h=window.innerHeight;
      const isMob = w < 768;
      const scale = Math.min(w, h) * (isMob ? 0.022 : 0.016);
      const cx = w/2, cy = h/2 - (isMob ? 10 : 20);
      particlesRef.current.forEach(p => {
        p.tx = cx + p.hx * scale * p.spread;
        p.ty = cy + p.hy * scale * p.spread;
      });
    };
    resize(); window.addEventListener('resize',resize);
    const draw=()=>{
      const w=window.innerWidth,h=window.innerHeight; timeRef.current+=0.016; const t=timeRef.current;
      ctx.fillStyle='rgba(10,0,8,0.25)';ctx.fillRect(0,0,w,h);
      const mx=mouseRef.current.x*w,my=mouseRef.current.y*h;
      particlesRef.current.forEach(p=>{
        p.x+=(p.tx-p.x)*p.speed; p.y+=(p.ty-p.y)*p.speed;
        const dx=p.x-mx,dy=p.y-my,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<70&&dist>0){p.x+=(dx/dist)*2.5;p.y+=(dy/dist)*2.5;}
        const breathe=Math.sin(t*1.5+p.phase)*0.5+0.5;
        const alpha=0.3+p.brightness*0.5+breathe*0.2;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size*(0.8+breathe*0.4),0,Math.PI*2);
        ctx.globalAlpha=Math.min(alpha,1);ctx.fillStyle=p.color;ctx.fill();
        if(p.brightness>0.8){ctx.beginPath();ctx.arc(p.x,p.y,p.size*3,0,Math.PI*2);ctx.globalAlpha=0.04;ctx.fill();}
      });
      ctx.globalAlpha=1;
      const bg=ctx.createRadialGradient(w/2,h/2-20,0,w/2,h/2-20,180);
      bg.addColorStop(0,`rgba(219,39,119,${0.025+Math.sin(t)*0.01})`);bg.addColorStop(1,'transparent');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      animRef.current=requestAnimationFrame(draw);
    };
    ctx.fillStyle='#0a0008';ctx.fillRect(0,0,canvas.width,canvas.height);
    draw();
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('resize',resize);};
  }, []);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const handleClick = useCallback(()=>{
    clickCountRef.current++; play('heartbeat');
    if(clickCountRef.current>=3 && !completedRef.current){
      setCanProceed(true);
      addTimer(window.setTimeout(()=>{
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, 2200));
    }
  },[play,onComplete]);

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <canvas ref={canvasRef} onClick={handleClick}
        onTouchEnd={(e)=>{e.preventDefault(); handleClick();}}
        style={{position:'absolute',inset:0,cursor:'pointer'}} />

      {showText && (
        <div style={{
          position: 'absolute', top: 'clamp(6%, 8vh, 10%)', left: 0, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none', animation: 'fadeInUp 2s ease forwards',
          zIndex: 5, padding: '0 1rem',
        }}>
          <div style={{ width: '92%', maxWidth: '520px', textAlign: 'center', direction: 'rtl' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.15rem, 3.8vw, 1.85rem)', fontWeight: 400, color: '#fce7f3',
              lineHeight: 1.5, marginBottom: '0.6rem', textAlign: 'center',
            }}>
              {content.heart.title}
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(0.85rem, 2.4vw, 1.05rem)', color: 'rgba(253,164,175,0.75)',
              fontStyle: 'italic', animation: 'pulse 3s ease-in-out infinite',
              textAlign: 'center',
            }}>
              {content.heart.subtitle}
            </p>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 'clamp(1.8rem, 4vh, 2.8rem)', left: 0, width: '100%',
        display: 'flex', justifyContent: 'center', textAlign: 'center', zIndex: 10,
        pointerEvents: 'none',
      }}>
        {canProceed && (
          <button onClick={triggerComplete} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif", fontSize: '0.78rem',
            padding: '0.5rem 1.6rem', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease',
            pointerEvents: 'auto',
          }}>كملي للرسالة →</button>
        )}
      </div>
    </div>
  );
};
