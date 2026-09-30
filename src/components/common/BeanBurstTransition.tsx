import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface ShardDef {
  id: number;
  width: number;
  height: number;
  tx: string;
  ty: string;
  rot: string;
}

interface SparkDef {
  id: number;
  stx: string;
  sty: string;
}

// Pre-calculated scattered shards in 360 degrees
const SHARDS: ShardDef[] = [
  { id: 1, width: 14, height: 18, tx: '-75px', ty: '-65px', rot: '-140deg' },
  { id: 2, width: 12, height: 16, tx: '0px', ty: '-85px', rot: '65deg' },
  { id: 3, width: 15, height: 19, tx: '80px', ty: '-60px', rot: '150deg' },
  { id: 4, width: 13, height: 15, tx: '95px', ty: '10px', rot: '-90deg' },
  { id: 5, width: 16, height: 17, tx: '70px', ty: '75px', rot: '110deg' },
  { id: 6, width: 12, height: 15, tx: '-10px', ty: '85px', rot: '-75deg' },
  { id: 7, width: 14, height: 18, tx: '-80px', ty: '60px', rot: '135deg' },
  { id: 8, width: 11, height: 14, tx: '-90px', ty: '-10px', rot: '-110deg' }
];

// Pre-calculated aroma spark particles
const SPARKS: SparkDef[] = [
  { id: 1, stx: '-50px', sty: '-90px' },
  { id: 2, stx: '60px', sty: '-80px' },
  { id: 3, stx: '100px', sty: '-20px' },
  { id: 4, stx: '75px', sty: '80px' },
  { id: 5, stx: '-60px', sty: '85px' },
  { id: 6, stx: '-95px', sty: '-40px' }
];

export const BeanBurstTransition: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const isFirstRender = useRef(true);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Avoid triggering on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathRef.current = location.pathname;
      return;
    }

    // Only trigger when the pathname genuinely changes
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;

      setIsTransitioning(true);
      setIsFadingOut(false);

      // Start fade-out at 1350ms (giving full 1.35s for the bean burst and scattering effect)
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 1350);

      // Complete and remove overlay from DOM at 1680ms (1.0s longer than previous 680ms)
      const doneTimer = setTimeout(() => {
        setIsTransitioning(false);
        setIsFadingOut(false);
      }, 1680);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(doneTimer);
      };
    }
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div
      className={`bean-burst-overlay ${isFadingOut ? 'fade-out' : ''}`}
      aria-hidden="true"
    >
      <div className="bean-burst-stage">
        {/* Expanding Aroma Shockwave Ring */}
        <div className="bean-shockwave" />

        {/* Phase 1: Whole Coffee Bean (zooms in and cracks) */}
        <div className="bean-whole">
          <svg viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="beanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A2E14" />
                <stop offset="50%" stopColor="#38220E" />
                <stop offset="100%" stopColor="#1A0F06" />
              </linearGradient>
              <linearGradient id="cleftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C97A3E" />
                <stop offset="100%" stopColor="#1A0F06" />
              </linearGradient>
            </defs>
            {/* Bean Outer Body */}
            <path
              d="M26 2 C39 2, 50 14, 50 34 C50 54, 38 66, 26 66 C14 66, 2 54, 2 34 C2 14, 13 2, 26 2 Z"
              fill="url(#beanGrad)"
              stroke="#23150A"
              strokeWidth="2"
            />
            {/* Bean Curved Cleft / Crease */}
            <path
              d="M26 6 Q31 22, 24 34 Q18 46, 26 62"
              stroke="url(#cleftGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M26 8 Q30 22, 24.5 34 Q19 46, 26 60"
              stroke="#FAF6F0"
              strokeWidth="1"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Phase 2: Bean Left Half Spreading Out */}
        <div className="bean-half-left">
          <svg viewBox="0 0 26 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path
              d="M26 2 C14 2, 2 14, 2 34 C2 54, 14 66, 26 66 Q18 46, 24 34 Q31 22, 26 2 Z"
              fill="#38220E"
              stroke="#23150A"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Phase 2: Bean Right Half Spreading Out */}
        <div className="bean-half-right">
          <svg viewBox="0 0 26 68" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path
              d="M0 2 C12 2, 24 14, 24 34 C24 54, 12 66, 0 66 Q-8 46, -2 34 Q5 22, 0 2 Z"
              fill="#2E1B0B"
              stroke="#23150A"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Flying Fragment Shards */}
        {SHARDS.map((shard) => (
          <div
            key={shard.id}
            className="bean-shard"
            style={
              {
                width: `${shard.width}px`,
                height: `${shard.height}px`,
                '--tx': shard.tx,
                '--ty': shard.ty,
                '--rot': shard.rot
              } as React.CSSProperties
            }
          />
        ))}

        {/* Golden Crema Sparks */}
        {SPARKS.map((spark) => (
          <div
            key={spark.id}
            className="bean-spark"
            style={
              {
                '--stx': spark.stx,
                '--sty': spark.sty
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="bean-burst-tag">
        || Fresh Extraction
      </div>
    </div>
  );
};
