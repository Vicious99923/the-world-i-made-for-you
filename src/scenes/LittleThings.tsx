import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onComplete: () => void; isActive: boolean; }
interface Orb { id:string;x:number;y:number;size:number;color:string;phase:number;speed:number;discovered:boolean; }

const ORB_COLORS = ['#fbbf24','#f9a8d4','#a78bfa','#67e8f9','#fdba74'];

export const LittleThings: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeOrb, setActiveOrb] = useState<string|null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const completedRef = useRef(false);
  const mouseRef = useRef({x:0,y:0});
  const { play } = useSound();
  const animRef = useRef(0);
  const orbsRef = useRef<Orb[]>([]);
  const timeRef = useRef(0);
  const initRef = useRef(false);
  const openedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if(initRef.current) return;
    initRef.current = true;
    orbsRef.current = content.moments.slice(0,5).map((m,i) => ({
      id: m.id, x: 0, y: 0,
      size: 25, color: ORB_COLORS[i % 5], phase: i * 1.3, speed: 0.4 + i * 0.08, discovered: false,
    }));
  }, []);

  useEffect(() => {
    const h=(e:MouseEvent|TouchEvent)=>{
      const cx='touches' in e?(e as TouchEvent).touches[0]?.clientX??0:(e as MouseEvent).clientX;
      const cy='touches' in e?(e as TouchEvent).touches[0]?.clientY??0:(e as MouseEvent).clientY;
      mouseRef.current={x:cx,y:cy};
    };
    window.addEventListener('mousemove',h); window.addEventListener('touchmove',h,{passive:true});
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
    };
    resize(); window.addEventListener('resize',resize);
    const draw=()=>{
      const w=window.innerWidth,h=window.innerHeight; timeRef.current+=0.016; const t=timeRef.current;
      const isMobile = w < 768;
      const bg=ctx.createLinearGradient(0,0,0,h);
      bg.addColorStop(0,'#1a0a2e');bg.addColorStop(0.5,'#2d1b4e');bg.addColorStop(1,'#44234a');
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      for(let i=0;i<40;i++){
        const px=(Math.sin(t*0.3+i*1.7)*0.5+0.5)*w;
        const py=(Math.cos(t*0.2+i*2.3)*0.5+0.5)*h;
        ctx.beginPath();ctx.arc(px,py,1,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${0.04+Math.sin(t+i)*0.02})`;ctx.fill();
      }

      const mobPos = [{nx:0.26,ny:0.24},{nx:0.74,ny:0.24},{nx:0.5,ny:0.42},{nx:0.26,ny:0.62},{nx:0.74,ny:0.62}];
      const deskPos = [{nx:0.2,ny:0.25},{nx:0.75,ny:0.2},{nx:0.15,ny:0.55},{nx:0.8,ny:0.5},{nx:0.5,ny:0.4}];

      orbsRef.current.forEach((orb, i)=>{
        const target = isMobile ? mobPos[i % 5] : deskPos[i % 5];
        const baseX = target.nx * w;
        const baseY = target.ny * h;
        orb.size = isMobile ? 22 : 26;
        orb.x = baseX + Math.sin(t*orb.speed+orb.phase)*(isMobile ? 8 : 15);
        orb.y = baseY + Math.cos(t*orb.speed*0.7+orb.phase)*(isMobile ? 6 : 10);

        const dx=mouseRef.current.x-orb.x,dy=mouseRef.current.y-orb.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<150&&dist>0){orb.x+=dx*0.015;orb.y+=dy*0.015;}
        const hov=dist<orb.size+30; const ds=hov?orb.size*1.3:orb.size;
        const gg=ctx.createRadialGradient(orb.x,orb.y,0,orb.x,orb.y,ds*4);
        gg.addColorStop(0,orb.color+'30');gg.addColorStop(1,'transparent');
        ctx.fillStyle=gg;ctx.beginPath();ctx.arc(orb.x,orb.y,ds*4,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(orb.x,orb.y,ds,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fill();
        ctx.strokeStyle=`rgba(255,255,255,${hov?0.35:0.12})`;ctx.lineWidth=1;ctx.stroke();
        const sg=ctx.createRadialGradient(orb.x-ds*0.3,orb.y-ds*0.3,0,orb.x,orb.y,ds);
        sg.addColorStop(0,'rgba(255,255,255,0.2)');sg.addColorStop(1,'transparent');
        ctx.fillStyle=sg;ctx.beginPath();ctx.arc(orb.x,orb.y,ds,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(orb.x,orb.y,ds*0.35,0,Math.PI*2);
        const cg=ctx.createRadialGradient(orb.x,orb.y,0,orb.x,orb.y,ds*0.35);
        cg.addColorStop(0,orb.color);cg.addColorStop(1,'transparent');
        ctx.fillStyle=cg;ctx.fill();
        if(orb.discovered){ctx.beginPath();ctx.arc(orb.x,orb.y+ds+12,3,0,Math.PI*2);ctx.fillStyle=orb.color;ctx.fill();}
      });
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('resize',resize);};
  }, []);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const handleOrbClick = useCallback((cx:number,cy:number)=>{
    if(activeOrb) return;
    const isMobile = window.innerWidth < 768;
    for(const orb of orbsRef.current){
      const dx=cx-orb.x,dy=cy-orb.y;
      if(Math.sqrt(dx*dx+dy*dy)<orb.size+(isMobile ? 35 : 25)){
        if(!orb.discovered){
          orb.discovered=true;
          setDiscoveredCount(prev=>{
            const n=prev+1;
            if(n>=content.moments.length) {
              setCanProceed(true);
            }
            return n;
          });
        }
        openedAtRef.current = Date.now();
        setActiveOrb(orb.id);
        play('reveal');
        break;
      }
    }
  },[activeOrb,play]);

  // Progressive guidance message requested by user
  const getPromptMessage = () => {
    if (discoveredCount === 0) return 'دوسي علي واحده من دول ✨';
    if (discoveredCount === 1) return 'دوسي علي واحده تانيه 🌸';
    if (discoveredCount === 2) return 'كمان واحده ♡';
    if (discoveredCount === 3) return 'كمان واحده يا هولي ✨';
    if (discoveredCount === 4) return 'اخر واحده خلاص 💫';
    return 'شاطرة يا مغوليه شوفتيهم كلهم ♡';
  };

  const activeMoment = content.moments.find(m => m.id === activeOrb);

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <canvas ref={canvasRef}
        onClick={e=>{
          if(activeOrb) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if(!rect) return;
          handleOrbClick(e.clientX - rect.left, e.clientY - rect.top);
        }}
        onTouchEnd={e=>{
          if(activeOrb) return;
          e.preventDefault();
          const rect = canvasRef.current?.getBoundingClientRect();
          if(!rect) return;
          const t=e.changedTouches[0];
          if(t) handleOrbClick(t.clientX - rect.left, t.clientY - rect.top);
        }}
        style={{position:'absolute',inset:0,cursor:'pointer'}} />

      {/* Centered Interactive Prompt Message */}
      {!activeMoment && (
        <div style={{
          position:'absolute', top:'clamp(8%, 10vh, 12%)', left:0, width:'100%',
          display:'flex', justifyContent:'center', pointerEvents:'none', zIndex:5,
          padding:'0 1rem',
        }}>
          <div style={{
            background:'rgba(255,255,255,0.08)', backdropFilter:'blur(15px)', WebkitBackdropFilter:'blur(15px)',
            border:'1px solid rgba(255,255,255,0.15)', borderRadius:'30px',
            padding:'0.6rem 1.8rem', textAlign:'center',
            boxShadow:'0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <p style={{
              fontFamily:"'SaleemQuran', serif",
              fontSize:'clamp(1.15rem, 4vw, 1.55rem)',
              color:'#fef3c7', direction:'rtl',
              letterSpacing:'0.02em',
            }}>
              {getPromptMessage()}
            </p>
          </div>
        </div>
      )}

      {/* Centered Modal Popup */}
      {activeMoment && (
        <div
          onClick={() => {
            if (Date.now() - openedAtRef.current < 400) return;
            setActiveOrb(null);
          }}
          style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
            zIndex:50, cursor:'pointer', animation:'fadeIn 0.25s ease',
            padding:'1rem',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            style={{
              maxWidth:'460px', width:'92%', maxHeight:'82vh', overflowY:'auto',
              padding:'clamp(1.5rem, 5vw, 2.5rem)',
              background:'linear-gradient(145deg, rgba(35, 20, 50, 0.95), rgba(20, 10, 30, 0.96))',
              backdropFilter:'blur(25px)', WebkitBackdropFilter:'blur(25px)',
              borderRadius:'24px', border:'1px solid rgba(255,255,255,0.2)',
              animation:'fadeInUp 0.35s ease forwards', textAlign:'center',
              boxShadow:'0 25px 60px rgba(0,0,0,0.65), 0 0 30px rgba(167,139,250,0.18)',
              direction:'rtl', position:'relative',
            }}>
            <button
              onClick={() => setActiveOrb(null)}
              style={{
                position:'absolute', top:'1rem', left:'1rem',
                background:'rgba(255,255,255,0.12)', border:'none', borderRadius:'50%',
                width:'32px', height:'32px', color:'#fff', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.9rem',
              }}>✕</button>

            <h3 style={{
              fontFamily:"'SaleemQuran', serif",
              fontSize:'clamp(1.35rem, 5vw, 1.85rem)', fontWeight:'normal', color:'#fef3c7',
              marginBottom:'1rem', marginTop:'0.5rem', textAlign:'center',
            }}>
              {activeMoment.title}
            </h3>
            <p style={{
              fontFamily:"'SaleemQuran', serif",
              fontSize:'clamp(1.15rem, 4vw, 1.45rem)', color:'rgba(255,255,255,0.95)',
              lineHeight:1.8, textAlign:'center',
            }}>
              {activeMoment.text}
            </p>
            <button
              onClick={() => setActiveOrb(null)}
              style={{
                marginTop:'1.6rem',
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                color:'rgba(255,255,255,0.9)', padding:'0.45rem 1.6rem',
                borderRadius:'20px', fontSize:'0.9rem', cursor:'pointer',
                fontFamily:"'SaleemQuran', serif",
              }}>
              إغلاق ♡
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{
        position:'absolute', bottom:'clamp(1.8rem, 4vh, 2.8rem)', left:0, width:'100%',
        display:'flex', flexDirection:'column', alignItems:'center',
        textAlign:'center', zIndex:5, pointerEvents:'none',
      }}>
        <p style={{
          fontFamily:"'SaleemQuran', serif", fontSize:'0.95rem', color:'rgba(255,255,255,0.5)',
          pointerEvents:'none',
        }}>{discoveredCount}/{content.moments.length} شفتي 💫</p>
        {canProceed && (
          <button onClick={triggerComplete} style={{
            marginTop:'0.8rem', background:'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(244,114,182,0.3))',
            border:'1px solid rgba(255,255,255,0.3)',
            color:'#ffffff', fontFamily:"'SaleemQuran', serif", fontSize:'0.95rem',
            padding:'0.55rem 1.8rem', borderRadius:'25px', cursor:'pointer', transition:'all 0.3s ease',
            pointerEvents:'auto', boxShadow:'0 8px 25px rgba(167,139,250,0.3)',
          }}>كملي للقلب يا هولي →</button>
        )}
      </div>
    </div>
  );
};
