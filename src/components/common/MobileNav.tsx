import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
      <div className="mobile-nav-header">
        <img src={logoImg} alt="Pause Logo" style={{ height: '40px', width: 'auto' }} />
        <button
          onClick={onClose}
          style={{ padding: '0.4rem', color: 'var(--color-espresso)' }}
          aria-label="Close navigation"
        >
          <X size={26} />
        </button>
      </div>

      <nav className="mobile-nav-links">
        <NavLink to="/menu" className="mobile-nav-link" onClick={onClose}>
          <span>Menu</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
        <NavLink to="/experience" className="mobile-nav-link" onClick={onClose}>
          <span>Experience</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
        <NavLink to="/community" className="mobile-nav-link" onClick={onClose}>
          <span>Community</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
        <NavLink to="/story" className="mobile-nav-link" onClick={onClose}>
          <span>Our Story</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
        <NavLink to="/offers" className="mobile-nav-link" onClick={onClose}>
          <span>Offers</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
        <NavLink to="/contact" className="mobile-nav-link" onClick={onClose}>
          <span>Visit Us</span>
          <ArrowRight size={18} style={{ opacity: 0.5 }} />
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--color-ink-rule)' }}>
        <Link
          to="/experience"
          onClick={onClose}
          className="btn btn-primary btn-full"
        >
          Check Experience Availability
        </Link>
        <div style={{ textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          PAUSE COFFEE & EATERY
        </div>
      </div>
    </div>
  );
};
