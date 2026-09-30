import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import cupLogoImg from '../../assets/cup-logo.png';

interface NavbarProps {
  onOpenMobileNav: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileNav }) => {
  const { balanceState, settings } = useApp();
  const { firebaseUser } = useAuth();

  return (
    <>
      {settings.announcementBar?.enabled && (
        <div className="announcement-bar">
          <span>{settings.announcementBar.text}</span>
          {settings.announcementBar.linkUrl && (
            <Link to={settings.announcementBar.linkUrl}>
              Claim Now →
            </Link>
          )}
        </div>
      )}

      <header className="site-header">
        <div className="container nav-container">
          {/* Brand Logo */}
          <Link to="/" className="nav-brand" aria-label="Pause Coffee & Eatery Home">
            <img src={logoImg} alt="Pause Coffee & Eatery" className="brand-logo-img" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links" aria-label="Main Navigation">
            <NavLink to="/menu" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Menu
            </NavLink>
            <NavLink to="/experience" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Experience
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Community
            </NavLink>
            <NavLink to="/story" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Our Story
            </NavLink>
            <NavLink to="/offers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Offers
            </NavLink>
            <NavLink to="/kinkoos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Kinkoos
            </NavLink>
          </nav>

          {/* Right-Side Actions */}
          <div className="nav-actions">
            <NavLink
              to="/contact"
              className={({ isActive }) => `nav-action-link nav-contact-link ${isActive ? 'active' : ''}`}
            >
              Visit Us
            </NavLink>

            <NavLink
              to={firebaseUser ? '/account' : '/signin'}
              className={({ isActive }) => `nav-action-link nav-auth-link ${isActive ? 'active' : ''}`}
              aria-label={firebaseUser ? 'Account' : 'Sign In'}
            >
              {firebaseUser ? 'Account' : 'Sign In'}
            </NavLink>

            <NavLink
              to="/kinkoos"
              className="nav-account-pill"
              title="View Customer Account & Kinkoos"
            >
              <img src={cupLogoImg} alt="" style={{ width: '15px', height: '15px', objectFit: 'contain' }} />
              <span>{balanceState.currentBalance} K</span>
            </NavLink>

            <button
              className="mobile-menu-toggle"
              onClick={onOpenMobileNav}
              aria-label="Open Mobile Menu"
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
