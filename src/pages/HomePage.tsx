import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CoffeePourHero } from '../components/home/CoffeePourHero';

export const HomePage: React.FC = () => {
  const { settings } = useApp();

  const primaryPunchline = 'Pause your life. Take a moment for yourself.';
  const secondaryLead = 'In the rush of work and daily demands, a pause is not lost time—it is how we restore clarity, cherish quiet moments, and savor the deliberate craft of hand-brewed coffee.';
  const rawFinal = settings.heroPunchlines?.[2] || 'More than coffee. A quiet pause in a rushing world.';
  const finalPunchline = rawFinal.replace(/^\[.*?—\s*/, '').replace(/\]$/, '').trim();

  return (
    <div>
      {/* ===================================================================
          1. HERO (First Thing: Continuous Coffee Pouring into Pause Cup)
          =================================================================== */}
      <section className="landing-hero-section">
        <div className="container">
          {/* 1. First Visual Encounter: The Continuous Coffee Pouring Animation */}
          <CoffeePourHero />

          {/* 2. Central Editorial Brand & Punchlines */}
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div className="hero-editorial-badge">
              <span>|| Pause Coffee & Eatery</span>
            </div>

            <h1 className="hero-main-title">PAUSE</h1>
            <div className="hero-main-subtitle">Coffee & Eatery</div>

            <div className="hero-core-punchline">
              "{primaryPunchline}"
            </div>

            <p className="hero-philosophy-lead">
              {secondaryLead}
            </p>

            <div className="hero-cta-buttons">
              <Link to="/menu" className="btn btn-primary btn-lg">
                <span>Explore The Menu</span>
                <ArrowRight size={15} />
              </Link>
              <Link to="/contact" className="btn btn-secondary btn-lg">
                Visit Pause
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. BESTSELLERS (01 / Pause Coffee & 02 / Bomboloni)
          =================================================================== */}
      <section className="bestsellers-spread-section">
        <div className="container">
          <div className="bestsellers-header-center">
            <span className="tag-label">The Signatures</span>
            <h2 className="heading-xl" style={{ margin: 'var(--space-2xs) 0 0 0' }}>
              Selected Best Sellers
            </h2>
          </div>

          <div className="bestsellers-split-grid">
            {/* 01 / PAUSE COFFEE */}
            <div className="bestseller-editorial-card">
              <div className="bestseller-photo-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=1000&q=85"
                  alt="Single origin Pause espresso extraction in ceramic cup"
                />
              </div>
              <div className="bestseller-label-row">
                <span className="bestseller-num-tag">01 / Beverage</span>
                <span className="tag-label">Calibrated 0.1g Extractions</span>
              </div>
              <h3 className="bestseller-item-name">Pause Coffee</h3>
              <p className="bestseller-item-desc">
                Hand-pulled espresso, velvety cortados, and slow single-origin manual pour-overs calibrated for deliberate savoring.
              </p>
              <Link to="/menu" className="bestseller-link-btn">
                View Coffee Offerings →
              </Link>
            </div>

            {/* 02 / BOMBOLONI */}
            <div className="bestseller-editorial-card">
              <div className="bestseller-photo-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=85"
                  alt="Artisanal Italian bomboloni pastries with rich fillings"
                />
              </div>
              <div className="bestseller-label-row">
                <span className="bestseller-num-tag">02 / Bakery</span>
                <span className="tag-label">Pre-Order Fresh</span>
              </div>
              <h3 className="bestseller-item-name">Bomboloni</h3>
              <p className="bestseller-item-desc">
                Artisanal Italian brioche doughnuts dusted in sugar and generously filled with vanilla bean custard, dark chocolate, and Nutella.
              </p>
              <Link to="/menu" className="bestseller-link-btn">
                Explore Bakery Menu →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. THE MEANING OF PAUSE (Core Philosophy Section)
          =================================================================== */}
      <section className="pause-philosophy-section">
        <div className="container">
          <div className="philosophy-central-grid">
            <div>
              <div className="philosophy-tag-lead">The Philosophy of Pause</div>
              <h2 className="philosophy-huge-quote">
                Give your life a moment to pause.
              </h2>
            </div>

            <div>
              <p className="philosophy-narrative-text">
                "Pause was created around a single truth: life should not be rushed. Giving a pause in your day—from work, from pressure, from the digital noise—is how you take time for yourself to enjoy, to cherish, and to simply be present."
              </p>

              <div className="philosophy-pillars-list">
                <span className="pillar-item">|| Time for Yourself</span>
                <span className="pillar-item">|| Unhurried Craft</span>
                <span className="pillar-item">|| The Communal Table</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. SUBTLE BRAND DOORWAYS (Experience & Community)
          =================================================================== */}
      <section className="brand-doorways-section">
        <div className="container">
          <div className="brand-doorways-grid">
            {/* The Experience Doorway */}
            <div className="brand-doorway-item">
              <div>
                <div className="doorway-tag">Behind the Bar</div>
                <h3 className="doorway-title">The Coffee Experience</h3>
                <p className="doorway-line">
                  Step behind our counter during calm morning hours. Dial in the grinder, texture silky microfoam, and hand-craft your own drink.
                </p>
              </div>
              <Link to="/experience" className="doorway-link">
                Discover The Experience →
              </Link>
            </div>

            {/* The Community Doorway */}
            <div className="brand-doorway-item">
              <div>
                <div className="doorway-tag">The Third Place</div>
                <h3 className="doorway-title">The Pause Community</h3>
                <p className="doorway-line">
                  Coffee brings people in. Our long pine table hosts open tasting cuppings, quiet reading sessions, and cultural conversations.
                </p>
              </div>
              <Link to="/community" className="doorway-link">
                Explore The Community →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. VISIT PAUSE / FINAL CALL TO ACTION
          =================================================================== */}
      <section className="minimal-visit-section">
        <div className="container">
          <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>
            Your Sanctuary in Chennai
          </div>
          <h2 className="visit-punchline-final">
            "{finalPunchline}"
          </h2>
          <p className="visit-sub-line">
            Take a seat by our arched windows, listen to the quiet hiss of steam, and savor your pause.
          </p>

          {/* Quick Location Callout Bar */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto var(--space-xl) auto',
              padding: '0.65rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              border: '1px solid var(--color-brown-border)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--color-espresso)'
            }}
          >
            <span>📍 19, Valluvar Salai, Ramapuram, Chennai 600089</span>
            <span style={{ color: 'var(--color-brown-muted)' }}>•</span>
            <a
              href={settings.googleMapsUrl || 'https://www.google.com/maps/place/Pause/@13.0312118,80.1833563,18.6z/data=!4m6!3m5!1s0x3a5261001bcfded7:0x9688462fab2ab15b!8m2!3d13.0314803!4d80.1836163!16s%2Fg%2F11zgm5f36g'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-warm-amber)', fontWeight: 600, textDecoration: 'none' }}
            >
              Maps & Directions ↗
            </a>
          </div>

          <div className="visit-actions-row">
            <Link to="/contact" className="btn btn-primary btn-lg">
              <span>Visit Us</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/story" className="btn btn-secondary btn-lg">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
