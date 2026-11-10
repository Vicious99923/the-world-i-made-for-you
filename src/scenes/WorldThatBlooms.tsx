import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }

interface Flower {
  x: number; y: number; size: number; color: string;
  bloomProgress: number; swayPhase: number; swaySpeed: number;
  stemHeight: number; petalCount: number;
}

const FLOWER_COLORS = ['#f472b6','#e879f9','#c084fc','#fb7185','#fda4af','#a78bfa','#f9a8d4'];
const TARGET_BLOOMS = 5;

export const WorldThatBlooms: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [bloomCount, setBloomCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const completedRef = useRef(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const { play } = useSound();
  const animRef = useRef(0);
  const flowersRef = useRef<Flower[]>([]);
  const particlesRef = useRef<{x:number;y:number;vx:number;vy:number;life:number;maxLife:number;color:string;size:number}[]>([]);
  const firefliesRef = useRef<{x:number;y:number;vx:number;vy:number;phase:number;size:number}[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    firefliesRef.current = Array.from({ length: isMobile ? 15 : 30 }, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight*0.7,
      vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.3,
      phase: Math.random()*Math.PI*2, size: Math.random()*3+1.5,
    }));
    setTimeout(() => setShowText(true), 800);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent|TouchEvent) => {
      const cx = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX??0 : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY??0 : (e as MouseEvent).clientY;
      mouseRef.current = { x: cx/window.innerWidth, y: cy/window.innerHeight };
    };
    window.addEventListener('mousemove', h); window.addEventListener('touchmove', h, {passive:true});
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('touchmove', h); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = window.devicePixelRatio||1;
      canvas.width=window.innerWidth*dpr; canvas.height=window.innerHeight*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      canvas.style.width=window.innerWidth+'px'; canvas.style.height=window.innerHeight+'px';
    };
    resize(); window.addEventListener('resize', resize);

    const drawFlower = (f: Flower) => {
      if (f.bloomProgress<=0) return;
      const bp=Math.min(f.bloomProgress,1);
      const sway=Math.sin(timeRef.current*f.swaySpeed+f.swayPhase)*5*bp;
      ctx.beginPath(); ctx.moveTo(f.x,f.y);
      const stemTop=f.y-f.stemHeight*bp;
      ctx.quadraticCurveTo(f.x+sway,f.y-f.stemHeight*0.5*bp,f.x+sway,stemTop);
      ctx.strokeStyle=`rgba(74,160,74,${0.6*bp})`; ctx.lineWidth=2; ctx.stroke();
      const ps=f.size*bp; const cx2=f.x+sway,cy2=stemTop;
      for (let i=0;i<f.petalCount;i++) {
        const a=(i/f.petalCount)*Math.PI*2+timeRef.current*0.2;
        ctx.save(); ctx.translate(cx2,cy2); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(ps*0.5,0,ps*0.6,ps*0.3,0,0,Math.PI*2);
        ctx.globalAlpha=bp*0.8; ctx.fillStyle=f.color; ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha=1;
      ctx.beginPath(); ctx.arc(cx2,cy2,ps*0.25,0,Math.PI*2);
      ctx.fillStyle=`rgba(253,230,138,${bp})`; ctx.fill();
      const gg=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,ps*2);
      gg.addColorStop(0,`rgba(244,114,182,${0.08*bp})`); gg.addColorStop(1,'transparent');
      ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx2,cy2,ps*2,0,Math.PI*2); ctx.fill();
    };

    const draw = () => {
      const w=window.innerWidth,h=window.innerHeight; timeRef.current+=0.016; const t=timeRef.current;
      const bg=ctx.createLinearGradient(0,0,0,h);
      bg.addColorStop(0,'#1a0a2e'); bg.addColorStop(0.3,'#2d1b4e'); bg.addColorStop(0.7,'#1a2a1a'); bg.addColorStop(1,'#0d1f0d');
      ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
      const isMobile = w < 768;
      const groundY = h * (isMobile ? 0.68 : 0.75);
      const gg=ctx.createLinearGradient(0,groundY,0,h);
      gg.addColorStop(0,'rgba(30,60,30,0.3)'); gg.addColorStop(1,'rgba(15,40,15,0.6)');
      ctx.fillStyle=gg; ctx.fillRect(0,groundY,w,h-groundY);
      flowersRef.current.forEach(f => { if(f.bloomProgress<1)f.bloomProgress+=0.02; drawFlower(f); });
      const mx=mouseRef.current.x*w,my=mouseRef.current.y*h;
      firefliesRef.current.forEach(ff => {
        ff.x+=ff.vx; ff.y+=ff.vy; ff.phase+=0.03;
        if(ff.x<0||ff.x>w)ff.vx*=-1; if(ff.y<0||ff.y>h*0.7)ff.vy*=-1;
        const dx=ff.x-mx,dy=ff.y-my,d=Math.sqrt(dx*dx+dy*dy);
        if(d<100&&d>0){ff.vx+=dx/d*0.2;ff.vy+=dy/d*0.2;} ff.vx*=0.98;ff.vy*=0.98;
        const alpha=0.3+Math.sin(ff.phase)*0.3;
        ctx.beginPath(); ctx.arc(ff.x,ff.y,ff.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(253,230,138,${alpha+0.3})`; ctx.fill();
        const gr=ctx.createRadialGradient(ff.x,ff.y,0,ff.x,ff.y,ff.size*4);
        gr.addColorStop(0,`rgba(253,230,138,${alpha*0.4})`); gr.addColorStop(1,'transparent');
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(ff.x,ff.y,ff.size*4,0,Math.PI*2); ctx.fill();
      });
      particlesRef.current=particlesRef.current.filter(p=>p.life>0);
      particlesRef.current.forEach(p => {
        p.x+=p.vx;p.y+=p.vy;p.vy-=0.02;p.life--;
        const a=p.life/p.maxLife;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);
        ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fill();
      }); ctx.globalAlpha=1;
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); };
  }, []);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const addFlower = useCallback((cx:number,cy:number) => {
    const isMobile = window.innerWidth < 768;
    const groundY = window.innerHeight * (isMobile ? 0.68 : 0.75);
    const y = Math.max(cy, groundY);
    const flower:Flower = {
      x: cx, y, size: Math.random() * (isMobile ? 10 : 12) + (isMobile ? 7 : 8),
      color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      bloomProgress: 0, swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 2 + 1,
      stemHeight: Math.random() * (isMobile ? 45 : 60) + (isMobile ? 30 : 40),
      petalCount: Math.floor(Math.random() * 3) + 5,
    };
    flowersRef.current.push(flower); play('bloom');
    for(let i=0;i<6;i++){
      particlesRef.current.push({
        x: cx, y: y - flower.stemHeight * 0.3,
        vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2 - 0.5,
        life: 50, maxLife: 50, color: flower.color, size: Math.random() * 3 + 1,
      });
    }
    setBloomCount(prev => {
      const n = prev + 1;
      // NO auto advance - just enable the button
      if(n >= TARGET_BLOOMS) {
        setCanProceed(true);
      }
      return n;
    });
  }, [play]);

  const handleClick = useCallback((e:React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    addFlower(e.clientX - rect.left, e.clientY - rect.top);
  }, [addFlower]);

  const handleTouch = useCallback((e:React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.changedTouches[0];
    if (t) addFlower(t.clientX - rect.left, t.clientY - rect.top);
  }, [addFlower]);

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <canvas ref={canvasRef} onClick={handleClick} onTouchEnd={handleTouch}
        style={{position:'absolute',inset:0,cursor:'pointer'}} />

      {showText && (
        <div style={{
          position: 'absolute', top: 'clamp(6%, 8vh, 10%)', left: 0, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none', animation: 'fadeInUp 1.5s ease forwards',
          zIndex: 5, padding: '0 1rem',
        }}>
          <div style={{ width: '92%', maxWidth: '560px', textAlign: 'center', direction: 'rtl' }}>
            <h2 style={{
              fontFamily: "'SaleemQuran', serif",
              fontSize: 'clamp(1.4rem, 4.6vw, 2.2rem)', fontWeight: 'normal', color: '#fce7f3',
              lineHeight: 1.6, marginBottom: '0.6rem', textAlign: 'center',
            }}>
              {content.garden.title}
            </h2>
            <p style={{
              fontFamily: "'SaleemQuran', serif",
              fontSize: 'clamp(1rem, 3.2vw, 1.25rem)', color: 'rgba(249,168,212,0.85)',
              textAlign: 'center',
            }}>
              {content.garden.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{
        position: 'absolute', bottom: 'clamp(1.8rem, 4vh, 2.8rem)', left: 0, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          width: '130px', height: '4px', background: 'rgba(255,255,255,0.12)',
          borderRadius: '2px', overflow: 'hidden', margin: '0 auto',
        }}>
          <div style={{
            height: '100%', width: `${Math.min((bloomCount / TARGET_BLOOMS) * 100, 100)}%`,
            background: 'linear-gradient(90deg,#f472b6,#e879f9)', transition: 'width 0.4s ease',
          }} />
        </div>
        <p style={{
          fontFamily: "'SaleemQuran', serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)',
          marginTop: '0.5rem',
        }}>
          {bloomCount >= TARGET_BLOOMS ? 'جمال الورد كمل بيكي يا جنجونه 🌸' : 'اضغطي عشان تزهر 🌸'}
        </p>
        {canProceed && (
          <button onClick={triggerComplete} style={{
            marginTop: '0.8rem', background: 'linear-gradient(135deg, rgba(244,114,182,0.35), rgba(232,121,249,0.35))',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff', fontFamily: "'SaleemQuran', serif", fontSize: '0.95rem',
            padding: '0.55rem 1.8rem', borderRadius: '25px', cursor: 'pointer', transition: 'all 0.3s ease',
            pointerEvents: 'auto', boxShadow: '0 8px 25px rgba(244,114,182,0.3)',
          }}>كملي للمفاجأة التانية →</button>
        )}
      </div>
    </div>
  );
};
