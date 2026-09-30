import React from 'react';

export const CoffeePourHero: React.FC = () => {
  return (
    <div className="continuous-pour-hero" aria-label="Pause Continuous Coffee Pouring Animation">
      <div className="pour-svg-container">
        <svg
          viewBox="0 0 640 440"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pour-master-svg"
        >
          <defs>
            {/* Receiving Cup Interior Clip Path */}
            <clipPath id="cupInteriorClip">
              <path d="M 188 175 H 352 V 353 Q 352 378 332 387 H 208 Q 188 378 188 353 V 175 Z" />
            </clipPath>

            {/* Coffee Stream Fluid Gradient */}
            <linearGradient id="coffeeStreamFluid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38220E" />
              <stop offset="25%" stopColor="#241408" />
              <stop offset="55%" stopColor="#442611" />
              <stop offset="85%" stopColor="#241408" />
              <stop offset="100%" stopColor="#38220E" />
            </linearGradient>

            {/* Crema Surface Gradient */}
            <linearGradient id="cremaSurfaceGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7D441F" />
              <stop offset="45%" stopColor="#C47942" />
              <stop offset="100%" stopColor="#7D441F" />
            </linearGradient>
          </defs>

          {/* ============================================================
              LAYER 1: MUG SOFT FLOOR SHADOW
              ============================================================ */}
          <ellipse cx="270" cy="394" rx="74" ry="7" fill="rgba(56, 34, 14, 0.08)" />

          {/* ============================================================
              LAYER 2: RECEIVING CUP BACKGROUND INTERIOR
              ============================================================ */}
          <path
            d="M 188 175 H 352 V 353 Q 352 378 332 387 H 208 Q 188 378 188 353 V 175 Z"
            fill="#FAF6F0"
          />

          {/* ============================================================
              LAYER 3: COFFEE FILL INSIDE RECEIVING CUP
              ============================================================ */}
          <g clipPath="url(#cupInteriorClip)">
            {/* Deep Rich Espresso Liquid */}
            <rect
              x="180"
              y="262"
              width="180"
              height="130"
              fill="#241408"
            />

            {/* Crema Surface Line */}
            <path
              d="M 190 262 Q 270 266 350 262 L 350 270 Q 270 274 190 270 Z"
              fill="url(#cremaSurfaceGrad)"
              className="cup-crema-surface"
            />

            {/* Entry Impact Ripples */}
            <ellipse cx="316" cy="265" rx="8" ry="2.2" fill="none" stroke="#C47942" strokeWidth="1.2" className="ripple-anim-1" />
            <ellipse cx="316" cy="265" rx="16" ry="4" fill="none" stroke="#C47942" strokeWidth="0.9" className="ripple-anim-2" />
          </g>

          {/* ============================================================
              LAYER 4: ACTIVE FLOWING COFFEE STREAM (MATCHING PHOTO)
              (Thick organic stream with caramel highlight streaks)
              ============================================================ */}
          <g className="stream-jiggle-container">
            {/* Stream Solid Body Ribbon */}
            <path
              d="M 360 115 C 330 140 310 190 316 266 L 328 266 C 322 195 342 145 375 125 Z"
              fill="#241408"
            />

            {/* Background Stream Shadow Line */}
            <path
              d="M 366 120 C 338 145 315 195 320 266"
              stroke="#1A0D05"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Main Flowing Stream with organic liquid dashes */}
            <path
              d="M 366 120 C 338 145 315 195 320 266"
              stroke="url(#coffeeStreamFluid)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="14 6"
              fill="none"
              className="active-flowing-stream"
            />

            {/* Caramel / Amber Shimmer Streak along inner stream (As in Photo) */}
            <path
              d="M 361 123 C 334 148 312 198 317 264"
              stroke="#D49B6A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 16"
              fill="none"
              opacity="0.9"
              className="stream-shimmer-flow"
            />
          </g>

          {/* ============================================================
              LAYER 5: THE POURING GLASS CARAFE WITH RING HANDLE
              (Accurately hand-crafted to match the user's reference photo)
              ============================================================ */}
          <g className="pouring-pitcher-hand-motion">
            {/* 1. Clear Glass Interior Background */}
            <path
              d="M 360 110 L 465 45 Q 495 75 515 110 Q 515 155 460 185 Q 410 180 375 140 Z"
              fill="#FAF6F0"
            />

            {/* 2. Glass Base Warm Tint Accent */}
            <path
              d="M 378 142 Q 410 180 460 185 Q 515 155 515 110 L 465 45 Z"
              fill="#F3ECE0"
              opacity="0.6"
            />

            {/* 3. Deep Rich Espresso Liquid inside Tilted Carafe */}
            <path
              d="M 362 113 Q 415 135 514 116 Q 514 152 460 183 Q 412 178 376 138 Z"
              fill="#241408"
            />

            {/* 4. Warm Caramel / Crema Surface Top Band (As in Photo) */}
            <path
              d="M 360 110 Q 420 132 514 114 L 514 122 Q 420 140 363 118 Z"
              fill="url(#cremaSurfaceGrad)"
            />

            {/* 5. Inner Glass Reflection Highlight Arc (Bottom Curve) */}
            <path
              d="M 390 152 Q 430 174 485 152"
              stroke="#D49B6A"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />

            {/* 6. Upper Right Glass Shoulder Highlight Dashes */}
            <path
              d="M 470 65 L 490 82"
              stroke="#D49B6A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="6 4"
              fill="none"
              opacity="0.85"
            />

            {/* 7. Distinctive Circular Ring / Donut Handle (Attached Top-Right as in Photo) */}
            <g transform="translate(485, 34)">
              {/* Outer Ring Handle */}
              <circle
                cx="18"
                cy="18"
                r="17"
                fill="#FAF6F0"
                stroke="#261508"
                strokeWidth="3.8"
              />
              {/* Inner Cutout Hole */}
              <circle
                cx="18"
                cy="18"
                r="8"
                fill="#FAF6F0"
                stroke="#261508"
                strokeWidth="3.4"
              />
            </g>

            {/* 8. Bold Dark Espresso Glass Carafe Main Outer Contour */}
            <path
              d="M 360 110 L 465 45 Q 495 75 515 110 Q 515 155 460 185 Q 410 180 375 140 Z"
              stroke="#261508"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* 9. Spout Bevel Lip Detail */}
            <path
              d="M 360 110 Q 355 116 364 122"
              stroke="#261508"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          </g>

          {/* ============================================================
              LAYER 6: PAUSE BRAND LOGO & WORDMARK (100% VISIBLE FOREGROUND)
              ============================================================ */}
          <g className="pause-foreground-branding">
            {/* Mini Pause Cup Icon */}
            <g transform="translate(252, 220)">
              {/* Cup Lid / Rim */}
              <rect x="8" y="4" width="20" height="3.5" rx="1.2" fill="#FAF6F0" stroke="#38220E" strokeWidth="1.3" />
              <rect x="11" y="2" width="14" height="2" rx="0.6" fill="#FAF6F0" stroke="#38220E" strokeWidth="1.1" />
              {/* Cup Body */}
              <path
                d="M 8 7.5 L 10 34 Q 10.5 38 18 38 Q 25.5 38 26 34 L 28 7.5 Z"
                fill="#FAF6F0"
                stroke="#38220E"
                strokeWidth="1.3"
              />
              {/* Cup Sleeve / Band */}
              <path
                d="M 8.8 15 L 9.7 27 L 26.3 27 L 27.2 15 Z"
                fill="#E2D5C4"
                stroke="#38220E"
                strokeWidth="1.1"
              />
              {/* The Pause '||' Symbol inside the icon */}
              <line x1="16" y1="18" x2="16" y2="24" stroke="#38220E" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="20" y1="18" x2="20" y2="24" stroke="#38220E" strokeWidth="1.7" strokeLinecap="round" />
            </g>

            {/* "pause" Lowercase Wordmark (Crisp Foreground Ivory Light Cream) */}
            <text
              x="270"
              y="322"
              textAnchor="middle"
              fill="#FAF6F0"
              fontFamily="var(--font-serif, 'Fraunces', serif)"
              fontSize="34"
              fontWeight="600"
              letterSpacing="-0.02em"
              className="pause-cup-title"
            >
              pause
            </text>

            {/* "COFFEE & EATERY" Subtitle */}
            <text
              x="270"
              y="344"
              textAnchor="middle"
              fill="#FAF6F0"
              fontFamily="var(--font-mono, 'Space Grotesk', monospace)"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="0.25em"
              opacity="0.95"
            >
              COFFEE &amp; EATERY
            </text>
          </g>

          {/* ============================================================
              LAYER 7: RECEIVING CUP BODY OUTLINE & FLANGED TOP COLLAR
              ============================================================ */}
          <g>
            {/* Cup Body Outline */}
            <path
              d="M 188 175 H 352 V 353 Q 352 378 332 387 H 208 Q 188 378 188 353 V 175"
              stroke="#38220E"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Flanged Top Lip / Collar */}
            <rect
              x="187"
              y="174"
              width="166"
              height="9"
              rx="3.5"
              fill="#FAF6F0"
              stroke="#38220E"
              strokeWidth="3.5"
            />
          </g>
        </svg>
      </div>

      {/* Editorial Punchline Below Animation */}
      <div className="pour-caption-tag">
        <span className="pause-symbol-accent">||</span>
        <span>A CONTINUOUS MOMENT TO BREATHE</span>
        <span className="pause-symbol-accent">||</span>
      </div>
    </div>
  );
};
