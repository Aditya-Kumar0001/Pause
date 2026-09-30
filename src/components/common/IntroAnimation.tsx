import React, { useState, useEffect } from 'react';
import cupLogoImg from '../../assets/cup-logo.png';

interface IntroAnimationProps {
  onComplete?: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [phase, setPhase] = useState<'initial' | 'pouring' | 'filled' | 'glow' | 'resolving' | 'done'>('initial');

  useEffect(() => {
    // Check if user has already seen the intro during this session or prefers reduced motion
    const hasSeenIntro = sessionStorage.getItem('pause_intro_seen');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasSeenIntro || prefersReducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    setIsVisible(true);

    // Sequence timeline (~2.4s total)
    const t1 = setTimeout(() => setPhase('pouring'), 150);
    const t2 = setTimeout(() => setPhase('filled'), 1300);
    const t3 = setTimeout(() => setPhase('glow'), 1800);
    const t4 = setTimeout(() => setPhase('resolving'), 2200);
    const t5 = setTimeout(() => {
      setPhase('done');
      setIsVisible(false);
      sessionStorage.setItem('pause_intro_seen', 'true');
      if (onComplete) onComplete();
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('pause_intro_seen', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible && phase === 'done') return null;
  if (!isVisible) return null;

  return (
    <div className={`intro-overlay ${phase === 'resolving' || phase === 'done' ? 'hidden' : ''}`} aria-live="polite">
      {/* Background paper texture & warm steam */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'var(--color-brown-secondary)',
            letterSpacing: '0.05em'
          }}
        >
          Slow down. Taste the moment.
        </span>
      </div>

      <div className="intro-illustration-box">
        {/* Coffee Pouring Stream from above */}
        {phase === 'pouring' && <div className="intro-pour-stream" />}

        {/* Floating subtle steam particles */}
        {(phase === 'filled' || phase === 'glow') && (
          <>
            <div className="intro-steam-particle" style={{ left: '42%', animationDelay: '0s' }} />
            <div className="intro-steam-particle" style={{ left: '55%', animationDelay: '0.4s' }} />
          </>
        )}

        {/* The Cup with liquid fill */}
        <div className="intro-cup-wrapper">
          <div
            className="intro-liquid-container"
            style={{
              height: phase === 'initial' ? '0%' : phase === 'pouring' ? '50%' : '90%',
              transition: 'height 1.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          <img
            src={cupLogoImg}
            alt="Pause Coffee Cup"
            className="intro-cup-img"
            style={{
              filter: phase === 'glow' ? 'drop-shadow(0 0 15px rgba(201, 122, 62, 0.7))' : 'none',
              transition: 'filter 0.5s ease'
            }}
          />
        </div>

        {/* Pause Symbol Pulse */}
        {phase === 'glow' && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-espresso)',
              letterSpacing: '0.2em'
            }}
            className="animate-fade-in"
          >
            || PAUSE
          </div>
        )}
      </div>

      <button className="intro-skip-btn" onClick={handleSkip} aria-label="Skip animation">
        Skip Intro ✕
      </button>
    </div>
  );
};
