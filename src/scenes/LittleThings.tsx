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

  useEffect(() => { setTimeout(() => setCanProceed(true), 10000); }, []);

  useEffect(() => {
    if(initRef.current) return; initRef.current=true;
    orbsRef.current = content.moments.slice(0,5).map((m,i) => ({
      id:m.id, x:0, y:0,
      size:25, color:ORB_COLORS[i%5], phase:i*1.3, speed:0.4+i*0.08, discovered:false,
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

      const mobPos = [{nx:0.26,ny:0.25},{nx:0.74,ny:0.25},{nx:0.5,ny:0.42},{nx:0.26,ny:0.60},{nx:0.74,ny:0.60}];
      const deskPos = [{nx:0.2,ny:0.25},{nx:0.75,ny:0.2},{nx:0.15,ny:0.55},{nx:0.8,ny:0.5},{nx:0.5,ny:0.4}];

      orbsRef.current.forEach((orb, i)=>{
        const target = isMobile ? mobPos[i % 5] : deskPos[i % 5];
        const baseX = target.nx * w;
        const baseY = target.ny * h;
        orb.size = isMobile ? 22 : 25;
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
            if(n>=content.moments.length && !completedRef.current){
              completedRef.current=true;
              setCanProceed(true);
              // Auto-advance after 2s
              setTimeout(()=>onComplete(),2000);
            }
            return n;
          });
        }
        setActiveOrb(orb.id); play('reveal'); break;
      }
    }
  },[activeOrb,play,onComplete]);

  const activeMoment=content.moments.find(m=>m.id===activeOrb);

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <canvas ref={canvasRef}
        onClick={e=>{
          const rect = canvasRef.current?.getBoundingClientRect();
          if(!rect) return;
          handleOrbClick(e.clientX - rect.left, e.clientY - rect.top);
        }}
        onTouchEnd={e=>{
          const rect = canvasRef.current?.getBoundingClientRect();
          if(!rect) return;
          const t=e.changedTouches[0];
          if(t) handleOrbClick(t.clientX - rect.left, t.clientY - rect.top);
        }}
        style={{position:'absolute',inset:0,cursor:'pointer'}} />
      {activeMoment && (
        <div onClick={()=>setActiveOrb(null)} style={{
          position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          background:'rgba(0,0,0,0.5)',zIndex:20,cursor:'pointer',animation:'fadeIn 0.3s ease',
          padding:'1rem',
        }}>
          <div style={{maxWidth:'460px',width:'92%',maxHeight:'80vh',overflowY:'auto',
            padding:'clamp(1.5rem, 5vw, 2.5rem)',
            background:'rgba(255,255,255,0.08)',backdropFilter:'blur(25px)',WebkitBackdropFilter:'blur(25px)',
            borderRadius:'20px',border:'1px solid rgba(255,255,255,0.15)',
            animation:'fadeInUp 0.5s ease forwards',textAlign:'center',
            boxShadow:'0 20px 50px rgba(0,0,0,0.5)',direction:'rtl'}}>
            <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",
              fontSize:'clamp(1.1rem,4vw,1.6rem)',fontWeight:600,color:'#fef3c7',marginBottom:'0.8rem'}}>
              {activeMoment.title}</h3>
            <p style={{fontFamily:"'Cormorant Garamond',Georgia,serif",
              fontSize:'clamp(0.95rem,3.2vw,1.2rem)',color:'rgba(255,255,255,0.9)',lineHeight:1.7}}>
              {activeMoment.text}</p>
            <p style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.4)',marginTop:'1.5rem'}}>اضغطي عشان تقفلي</p>
          </div>
        </div>
      )}
      <div style={{position:'absolute',bottom:'2.5rem',left:'50%',transform:'translateX(-50%)',textAlign:'center',zIndex:5}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',
          pointerEvents:'none'}}>{discoveredCount}/{content.moments.length} اكتشفتي 💫</p>
        {canProceed && (
          <button onClick={onComplete} style={{
            marginTop:'0.8rem',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',
            color:'rgba(255,255,255,0.7)',fontFamily:"'Inter',sans-serif",fontSize:'0.75rem',
            padding:'0.5rem 1.5rem',borderRadius:'20px',cursor:'pointer',transition:'all 0.3s ease',
          }}>كملي →</button>
        )}
      </div>
    </div>
  );
};
