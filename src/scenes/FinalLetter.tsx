import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from '../systems/SoundManager';
import { content } from '../config/content';

interface Props { onRestart: () => void; isActive: boolean; }

export const FinalLetter: React.FC<Props> = ({ onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'envelope' | 'opening' | 'letter'>('envelope');
  const [showClosing, setShowClosing] = useState(false);
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

  // Background floating ember particles
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

    const particles = Array.from({ length: 50 }, () => ({
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

  const openEnvelope = useCallback(() => {
    play('envelope');
    setPhase('opening');
    addTimer(window.setTimeout(() => setPhase('letter'), 1200));
  }, [play]);

  const handleFinishReading = useCallback(() => {
    play('sparkle');
    setShowClosing(true);
  }, [play]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Envelope Phase */}
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
            borderRadius: '10px', position: 'relative', margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(201,149,107,0.2)',
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
            {/* Wax Seal */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'radial-gradient(circle, #be123c, #881337)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', color: '#f5e6d3', zIndex: 2,
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            }}>♡</div>
          </div>
          <p style={{
            fontFamily: "'SaleemQuran', serif", fontSize: 'clamp(1.3rem, 4.2vw, 1.6rem)',
            color: '#f5e6d3', marginTop: '1.8rem', fontWeight: 'normal',
            animation: 'pulse 3s ease-in-out infinite',
            textAlign: 'center',
          }}>{content.finalLetter.envelopeTitle}</p>
          <p style={{
            fontFamily: "'SaleemQuran', serif", fontSize: '1rem',
            color: 'rgba(245,230,211,0.7)', marginTop: '0.5rem',
            textAlign: 'center',
          }}>اضغطي عشان تفتحي الجواب 💌</p>
        </div>
      )}

      {/* Opening Animation Phase */}
      {phase === 'opening' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            width: 'min(300px, 78vw)', height: 'min(190px, 50vw)',
            background: 'linear-gradient(135deg, #d4a574, #c9956b)',
            borderRadius: '10px', position: 'relative',
            animation: 'envelopeOpen 1.2s ease forwards',
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

      {/* Letter on Authentic Notebook Paper (ورقة كشكول مسطر كاملة وبدون قص) */}
      {phase === 'letter' && (
        <div className="scrollable" style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: 'clamp(1.5rem, 4vh, 2.8rem) clamp(0.75rem, 3vw, 1.5rem)',
          animation: 'fadeIn 1s ease forwards',
        }}>
          <div style={{
            maxWidth: '560px', width: '100%',
            backgroundColor: '#fffdf9',
            /* Authentic school notebook styling:
               1. Red margin line on the right for Arabic (margin at 45px)
               2. Blue horizontal ruled lines repeating continuously
            */
            backgroundImage: `
              linear-gradient(90deg, transparent calc(100% - 46px), rgba(244, 63, 94, 0.35) calc(100% - 46px), rgba(244, 63, 94, 0.35) calc(100% - 44px), transparent calc(100% - 44px)),
              repeating-linear-gradient(transparent, transparent 35px, rgba(147, 197, 253, 0.32) 35px, rgba(147, 197, 253, 0.32) 36px)
            `,
            borderRadius: '10px',
            padding: 'clamp(2rem, 6vw, 3rem) clamp(1.4rem, 5vw, 2.8rem)',
            boxShadow: '0 25px 70px rgba(0,0,0,0.65), inset 0 0 50px rgba(230,215,190,0.3)',
            border: '1px solid #e7dfd5',
            position: 'relative',
            height: 'auto',
            direction: 'rtl', textAlign: 'right',
          }}>
            {/* Top spiral binder hole punches decoration */}
            <div style={{
              position: 'absolute', top: '10px', left: '20px', right: '20px',
              display: 'flex', justifyContent: 'space-around', pointerEvents: 'none',
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: '#e2d9cd', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
                }} />
              ))}
            </div>

            {/* Letter title */}
            <h2 style={{
              fontFamily: "'SaleemQuran', serif",
              fontSize: 'clamp(1.6rem, 5.8vw, 2.4rem)',
              color: '#1e1b4b', marginBottom: '1.8rem', marginTop: '0.8rem',
              fontWeight: 'normal', animation: 'fadeInUp 1s ease forwards',
              textAlign: 'center',
            }}>
              {content.finalLetter.letterTitle}
            </h2>

            {/* Paragraphs in ink handwriting - all clearly displayed */}
            {content.finalLetter.paragraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: "'SaleemQuran', serif",
                fontSize: 'clamp(1.2rem, 4.2vw, 1.55rem)',
                color: '#1e1b4b', lineHeight: '36px', marginBottom: '1.6rem',
                animation: 'fadeInUp 0.8s ease forwards',
              }}>
                {para}
              </p>
            ))}

            {/* Signature & Date clearly placed inside at the end of the notebook paper */}
            <div style={{
              marginTop: '2.5rem',
              paddingTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderTop: '1px dashed rgba(30, 27, 75, 0.18)',
            }}>
              {content.finalLetter.signature && (
                <p style={{
                  fontFamily: "'SaleemQuran', serif",
                  fontSize: 'clamp(1.3rem, 4.6vw, 1.7rem)',
                  color: '#881337', fontWeight: 'normal',
                  lineHeight: '36px', marginBottom: '0.4rem',
                }}>
                  {content.finalLetter.signature}
                </p>
              )}

              {content.finalLetter.date && (
                <p style={{
                  fontFamily: "'SaleemQuran', serif", fontSize: '1.05rem',
                  color: 'rgba(30, 27, 75, 0.65)',
                }}>
                  {content.finalLetter.date}
                </p>
              )}
            </div>

            {/* Manual button to indicate finished reading - NO automatic jumps */}
            {!showClosing && (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={handleFinishReading}
                  style={{
                    background: 'linear-gradient(135deg, rgba(190,18,60,0.1), rgba(136,19,55,0.15))',
                    border: '1px solid rgba(136,19,55,0.3)',
                    color: '#881337', fontFamily: "'SaleemQuran', serif",
                    fontSize: '1rem', padding: '0.6rem 2rem',
                    borderRadius: '25px', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}>
                  خلصت قراءة يا أسامة ♡
                </button>
              </div>
            )}
          </div>

          {/* Closing section below the notebook paper - ONLY appears when user clicks finished */}
          {showClosing && (
            <div style={{
              margin: '2.5rem 0 3.5rem 0',
              textAlign: 'center', animation: 'fadeInUp 1s ease forwards',
              zIndex: 10,
            }}>
              <p style={{
                fontFamily: "'SaleemQuran', serif",
                fontSize: 'clamp(1.2rem, 3.8vw, 1.55rem)', color: 'rgba(245,230,211,0.95)',
                marginBottom: '1.2rem', textAlign: 'center',
              }}>
                {content.closing.message}
              </p>
              <button onClick={onRestart} style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff', fontFamily: "'SaleemQuran', serif",
                fontSize: '1.05rem', padding: '0.65rem 2.2rem',
                borderRadius: '30px', cursor: 'pointer', backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease', boxShadow: '0 8px 25px rgba(255,255,255,0.15)',
              }}>
                {content.closing.restartText}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
