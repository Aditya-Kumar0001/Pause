import React, { useState, useEffect } from 'react';
import cupLogoImg from '../../assets/cup-logo.png';

export const CoffeePourInteraction: React.FC = () => {
  const [isPouring, setIsPouring] = useState<boolean>(true);
  const [fillLevel, setFillLevel] = useState<number>(65); // percentage (0 to 85)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPouring) {
      interval = setInterval(() => {
        setFillLevel((prev) => {
          if (prev >= 82) return 82;
          return prev + 1;
        });
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isPouring]);

  const handleResetPour = () => {
    setFillLevel(15);
    setIsPouring(true);
  };

  const togglePour = () => {
    if (fillLevel >= 80) {
      handleResetPour();
    } else {
      setIsPouring(!isPouring);
    }
  };

  return (
    <div className="coffee-pour-container" aria-label="Signature Pause Coffee Pouring Visual">
      <div className="pour-header-meta">
        <span className="tag-label">Signature Ritual</span>
        <div className="pour-status-indicator">
          <span className={`pour-dot ${isPouring && fillLevel < 82 ? 'active' : ''}`} />
          <span>{fillLevel >= 82 ? 'Poured' : isPouring ? 'Slow Pouring...' : 'Paused'}</span>
        </div>
      </div>

      <div className="pour-stage">
        {/* Tilting Glass Carafe with Ring Handle (Left) */}
        <div className={`pitcher-wrapper ${isPouring && fillLevel < 82 ? 'tilted' : ''}`}>
          <svg width="84" height="68" viewBox="0 0 84 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="pitcher-svg">
            {/* Glass interior background */}
            <path
              d="M10 32L45 10Q55 20 62 34Q62 52 42 62Q24 60 14 44Z"
              fill="#FAF6F0"
            />
            {/* Dark coffee liquid inside tilted carafe */}
            <path
              d="M11 34Q30 42 62 36Q62 52 42 62Q24 60 14 44Z"
              fill="#261508"
            />
            {/* Crema top surface band */}
            <path
              d="M10 32Q30 40 62 34L62 38Q30 44 12 36Z"
              fill="#C47942"
            />
            {/* Curved bottom glass reflection highlight */}
            <path
              d="M20 50Q34 58 52 50"
              stroke="#D49B6A"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            {/* Ring handle on upper right */}
            <circle cx="68" cy="16" r="10" fill="#FAF6F0" stroke="#261508" strokeWidth="2.4" />
            <circle cx="68" cy="16" r="5" fill="#FAF6F0" stroke="#261508" strokeWidth="2" />
            {/* Glass carafe outer outline */}
            <path
              d="M10 32L45 10Q55 20 62 34Q62 52 42 62Q24 60 14 44Z"
              stroke="#261508"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Spout lip */}
            <path
              d="M10 32Q8 35 12 38"
              stroke="#261508"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Liquid Pouring Stream */}
        <div className={`pour-stream ${isPouring && fillLevel < 82 ? 'flowing' : 'stopped'}`} />

        {/* The Pause Takeaway Cup (With Official "||" Symbol) */}
        <div className="pause-cup-wrapper">
          <div className="cup-outer-shape">
            {/* Cup Rim */}
            <div className="cup-rim" />

            {/* Cup Liquid Fill Layer */}
            <div
              className="cup-liquid"
              style={{
                height: `${fillLevel}%`
              }}
            >
              <div className="liquid-crema-surface" />
            </div>

            {/* Official Brand Logo Motif Center ("||" Cup Logo) */}
            <div className="cup-brand-stamp">
              <img src={cupLogoImg} alt="Pause || Mark" className="cup-logo-stamp-img" />
              <div className="cup-stamp-text">PAUSE</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pour-footer-action">
        <button
          onClick={togglePour}
          className="pour-action-btn"
          title="Click to interact with the slow pour"
        >
          {fillLevel >= 82 ? 'Pour Another Cup ↺' : isPouring ? 'Pause Stream ||' : 'Continue Pour →'}
        </button>
        <span className="caption-vintage">Calibrated 1:2 Espresso Extraction</span>
      </div>
    </div>
  );
};
