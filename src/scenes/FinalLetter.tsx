import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onRestart: () => void; isActive: boolean; }

export const FinalLetter: React.FC<Props> = ({ onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'envelope' | 'opening' | 'letter' | 'closing'>('envelope');
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const { play } = useSound();
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const timersRef = useRef<number[]>([]);

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

  // Background particles
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

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.1,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      const w = window.innerWidth, h = window.innerHeight;
      timeRef.current += 0.016;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a0a0a'); bg.addColorStop(0.3, '#2d1b1b');
      bg.addColorStop(0.6, '#3d2b2b'); bg.addColorStop(1, '#2a1f1a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.phase += 0.02;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const a = p.alpha + Math.sin(p.phase) * 0.1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 149, 107, ${Math.max(0, a)})`; ctx.fill();
        const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        gg.addColorStop(0, `rgba(201, 149, 107, ${Math.max(0, a * 0.3)})`);
        gg.addColorStop(1, 'transparent');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  // Auto-reveal paragraphs
  useEffect(() => {
    if (phase !== 'letter' || showAll) return;
    if (visibleParagraphs >= content.finalLetter.paragraphs.length + 2) return;
    const timer = window.setTimeout(() => {
      setVisibleParagraphs(prev => prev + 1);
    }, 1200);
    addTimer(timer);
    return () => clearTimeout(timer);
  }, [phase, visibleParagraphs, showAll]);

  const openEnvelope = useCallback(() => {
    play('envelope');
    setPhase('opening');
    addTimer(window.setTimeout(() => setPhase('letter'), 1400));
  }, [play]);

  const handleShowAll = useCallback(() => {
    setShowAll(true);
    setVisibleParagraphs(content.finalLetter.paragraphs.length + 2);
  }, []);

  const totalItems = content.finalLetter.paragraphs.length + 2;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Envelope - Perfectly Centered in Viewport */}
      {phase === 'envelope' && (
        <div onClick={openEnvelope} style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', animation: 'fadeInUp 1.2s ease forwards',
          textAlign: 'center', padding: '1rem',
          zIndex: 10,
        }}>
          {/* Envelope body */}
          <div style={{
            width: 'min(300px, 78vw)', height: 'min(190px, 50vw)',
            background: 'linear-gradient(135deg, #d4a574, #c9956b, #b8845a)',
            borderRadius: '8px', position: 'relative', margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,149,107,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}>
            {/* Flap */}
            <div style={{
              position: 'absolute', top: '-1px', left: 0, right: 0,
              height: '50%', overflow: 'hidden',
            }}>
              <div style={{
                width: '141%', height: '141%', background: 'linear-gradient(135deg, #c9956b, #b8845a)',
                transform: 'rotate(45deg)', transformOrigin: 'top left',
                position: 'absolute', top: 0, left: 0,
                borderRadius: '4px',
              }} />
            </div>
            {/* Seal */}
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'radial-gradient(circle, #a83262, #8b2252)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', color: '#f5e6d3', zIndex: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>♡</div>
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1rem, 3.5vw, 1.3rem)',
            color: '#f5e6d3', marginTop: '1.8rem', fontStyle: 'italic',
            animation: 'pulse 3s ease-in-out infinite', letterSpacing: '0.05em',
            textAlign: 'center',
          }}>{content.finalLetter.envelopeTitle}</p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.72rem',
            color: 'rgba(245,230,211,0.55)', marginTop: '0.6rem', letterSpacing: '0.12em',
            textAlign: 'center',
          }}>اضغطي عشان تفتحي 💌</p>
        </div>
      )}

      {/* Opening animation */}
      {phase === 'opening' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{
            width: 'min(300px, 78vw)', height: 'min(190px, 50vw)',
            background: 'linear-gradient(135deg, #d4a574, #c9956b)',
            borderRadius: '8px', position: 'relative',
            animation: 'envelopeOpen 1.4s ease forwards',
          }} />
          <style>{`
            @keyframes envelopeOpen {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.08) rotateX(20deg); opacity: 0.8; }
              100% { transform: scale(0.5) translateY(-80px); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Letter */}
      {phase === 'letter' && (
        <div className="scrollable" style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: 'clamp(1.5rem, 4vh, 2.8rem) clamp(0.75rem, 3vw, 1.5rem)',
          animation: 'fadeIn 1.2s ease forwards',
        }}>
          <div style={{
            maxWidth: '560px', width: '100%', background: '#faf8f5',
            borderRadius: '8px', padding: 'clamp(1.5rem, 5vw, 3rem)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.1)',
            position: 'relative', minHeight: '350px',
            direction: 'rtl', textAlign: 'right',
          }}>
            {/* Paper texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '8px',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px)',
              pointerEvents: 'none',
            }} />

            {/* Letter title */}
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.3rem, 5vw, 2rem)',
              color: '#2c1810', marginBottom: '1.8rem', fontWeight: 600,
              animation: 'fadeInUp 1s ease forwards',
              textAlign: 'center',
            }}>
              {content.finalLetter.letterTitle}
            </h2>

            {/* Paragraphs */}
            {content.finalLetter.paragraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(0.95rem, 3.2vw, 1.2rem)',
                color: '#2c1810', lineHeight: 1.85, marginBottom: '1.3rem',
                opacity: i < visibleParagraphs ? 1 : 0,
                transform: i < visibleParagraphs ? 'translateY(0)' : 'translateY(15px)',
                transition: 'opacity 1s ease, transform 1s ease',
              }}>
                {para}
              </p>
            ))}

            {/* Signature */}
            {content.finalLetter.signature && (
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.05rem, 3.5vw, 1.35rem)',
                color: '#2c1810', marginTop: '2rem', fontWeight: 600,
                opacity: visibleParagraphs > content.finalLetter.paragraphs.length ? 1 : 0,
                transition: 'opacity 1s ease',
              }}>
                {content.finalLetter.signature}
              </p>
            )}

            {/* Date */}
            {content.finalLetter.date && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '0.9rem',
                color: 'rgba(44, 24, 16, 0.5)', marginTop: '0.5rem', fontStyle: 'italic',
                opacity: visibleParagraphs > content.finalLetter.paragraphs.length + 1 ? 1 : 0,
                transition: 'opacity 1s ease',
              }}>
                {content.finalLetter.date}
              </p>
            )}

            {/* Show all button */}
            {!showAll && visibleParagraphs < totalItems && (
              <button onClick={handleShowAll} style={{
                marginTop: '1rem',
                background: 'none', border: 'none', color: 'rgba(44,24,16,0.4)',
                fontFamily: "'Inter', sans-serif", fontSize: '0.7rem',
                cursor: 'pointer', letterSpacing: '0.05em',
                display: 'block',
              }}>
                عرض الرسالة كاملة ↓
              </button>
            )}
          </div>

          {/* Closing section */}
          {visibleParagraphs >= totalItems && (
            <div style={{
              margin: '2.5rem 0 3rem 0',
              textAlign: 'center', animation: 'fadeIn 1.5s ease forwards',
              zIndex: 10,
            }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)', color: 'rgba(245,230,211,0.7)',
                fontStyle: 'italic', marginBottom: '1.2rem', textAlign: 'center',
              }}>
                {content.closing.message}
              </p>
              <button onClick={onRestart} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif",
                fontSize: '0.75rem', letterSpacing: '0.12em', padding: '0.7rem 1.8rem',
                borderRadius: '30px', cursor: 'pointer', backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}>
                {content.closing.restartText}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'closing' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', animation: 'fadeIn 2s ease forwards', padding: '1rem',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: '#f5e6d3',
            fontStyle: 'italic', textAlign: 'center', maxWidth: '400px',
          }}>
            {content.closing.message}
          </p>
          <button onClick={onRestart} style={{
            marginTop: '2rem', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)',
            fontFamily: "'Inter', sans-serif", fontSize: '0.75rem',
            letterSpacing: '0.15em', padding: '0.8rem 2rem', borderRadius: '30px',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}>
            {content.closing.restartText}
          </button>
        </div>
      )}
    </div>
  );
};
