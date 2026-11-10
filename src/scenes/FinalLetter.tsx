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

  // Background particles
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
        // Subtle glow
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
    if (visibleParagraphs >= content.finalLetter.paragraphs.length + 2) return; // +2 for signature and date
    const timer = setTimeout(() => {
      setVisibleParagraphs(prev => prev + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [phase, visibleParagraphs, showAll]);

  const openEnvelope = useCallback(() => {
    play('envelope');
    setPhase('opening');
    setTimeout(() => setPhase('letter'), 1500);
  }, [play]);

  const handleShowAll = useCallback(() => {
    setShowAll(true);
    setVisibleParagraphs(content.finalLetter.paragraphs.length + 2);
  }, []);

  const totalItems = content.finalLetter.paragraphs.length + 2; // paragraphs + signature + date

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Envelope */}
      {phase === 'envelope' && (
        <div onClick={openEnvelope} style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          cursor: 'pointer', animation: 'fadeInUp 1.5s ease forwards', textAlign: 'center',
        }}>
          {/* Envelope body */}
          <div style={{
            width: 'clamp(200px, 60vw, 320px)', height: 'clamp(130px, 40vw, 200px)',
            background: 'linear-gradient(135deg, #d4a574, #c9956b, #b8845a)',
            borderRadius: '8px', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,149,107,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 25px 70px rgba(0,0,0,0.6), 0 0 60px rgba(201,149,107,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,149,107,0.15)';
          }}
          >
            {/* Flap */}
            <div style={{
              position: 'absolute', top: '-1px', left: '0', right: '0',
              height: '50%', overflow: 'hidden',
            }}>
              <div style={{
                width: '141%', height: '141%', background: 'linear-gradient(135deg, #c9956b, #b8845a)',
                transform: 'rotate(45deg)', transformOrigin: 'top left',
                position: 'absolute', top: '0', left: '0',
                borderRadius: '4px',
              }} />
            </div>
            {/* Seal */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'radial-gradient(circle, #a83262, #8b2252)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', color: '#f5e6d3', zIndex: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>♡</div>
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
            color: '#f5e6d3', marginTop: '1.5rem', fontStyle: 'italic',
            animation: 'pulse 3s ease-in-out infinite', letterSpacing: '0.05em',
          }}>{content.finalLetter.envelopeTitle}</p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.65rem',
            color: 'rgba(245,230,211,0.4)', marginTop: '0.8rem', letterSpacing: '0.15em',
          }}>TAP TO OPEN</p>
        </div>
      )}

      {/* Opening animation */}
      {phase === 'opening' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{
            width: 'clamp(200px, 60vw, 320px)', height: 'clamp(130px, 40vw, 200px)',
            background: 'linear-gradient(135deg, #d4a574, #c9956b)',
            borderRadius: '8px', position: 'relative',
            animation: 'envelopeOpen 1.5s ease forwards',
          }} />
          <style>{`
            @keyframes envelopeOpen {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1) rotateX(20deg); opacity: 0.8; }
              100% { transform: scale(0.5) translateY(-100px); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Letter */}
      {phase === 'letter' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '3rem 1rem', animation: 'fadeIn 1.5s ease forwards',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            maxWidth: '580px', width: '92%', background: '#faf8f5',
            borderRadius: '4px', padding: 'clamp(2rem, 6vw, 3.5rem)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.1)',
            position: 'relative', minHeight: '400px',
          }}>
            {/* Paper texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '4px',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px)',
              pointerEvents: 'none',
            }} />

            {/* Letter title */}
            <h2 style={{
              fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
              color: '#2c1810', marginBottom: '2rem', fontWeight: 600,
              animation: 'fadeInUp 1s ease forwards',
            }}>
              {content.finalLetter.letterTitle}
            </h2>

            {/* Paragraphs */}
            {content.finalLetter.paragraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                color: '#2c1810', lineHeight: 1.8, marginBottom: '1.2rem',
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
                fontFamily: "'Dancing Script', 'Caveat', cursive", fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
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
                position: 'absolute', bottom: '1rem', right: '1.5rem',
                background: 'none', border: 'none', color: 'rgba(44,24,16,0.3)',
                fontFamily: "'Inter', sans-serif", fontSize: '0.65rem',
                cursor: 'pointer', letterSpacing: '0.1em',
              }}>
                SHOW ALL ↓
              </button>
            )}
          </div>

          {/* Closing section */}
          {visibleParagraphs >= totalItems && (
            <div style={{
              position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              textAlign: 'center', animation: 'fadeIn 2s ease forwards',
            }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(0.85rem, 2vw, 1.1rem)', color: 'rgba(245,230,211,0.6)',
                fontStyle: 'italic', marginBottom: '1rem',
              }}>
                {content.closing.message}
              </p>
              <button onClick={onRestart} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif",
                fontSize: '0.7rem', letterSpacing: '0.15em', padding: '0.6rem 1.5rem',
                borderRadius: '30px', cursor: 'pointer', backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
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
          flexDirection: 'column', animation: 'fadeIn 2s ease forwards',
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
