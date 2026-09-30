import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Clock, Mail, Phone } from 'lucide-react';
import logoLightImg from '../../assets/logo-light.png';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { settings } = useApp();

  const rawPunchline = settings.heroPunchlines?.[2] || 'More than coffee. A quiet pause in a rushing world.';
  const finalPunchline = rawPunchline.replace(/^\[.*?—\s*/, '').replace(/\]$/, '').trim();

  const instagramUrl = settings.instagram?.startsWith('http')
    ? settings.instagram
    : 'https://www.instagram.com/pause.chennai?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==';

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <Link to="/" style={{ display: 'inline-block', marginBottom: 'var(--space-md)' }}>
              <img
                src={logoLightImg}
                alt="Pause Coffee & Eatery"
                style={{ height: '48px', width: 'auto' }}
              />
            </Link>
            <p className="footer-brand-desc">
              A European-inspired coffee house built around the craft of slowing down. Hand-brewed coffees, seasonal roasts, hands-on barista experiences, and a welcoming community table.
            </p>
            <div className="footer-punchline-quote">
              "{finalPunchline}"
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-column">
            <h4 className="footer-column-title">Explore</h4>
            <ul className="footer-links-list">
              <li><Link to="/menu" className="footer-link">Menu</Link></li>
              <li><Link to="/experience" className="footer-link">Experience</Link></li>
              <li><Link to="/community" className="footer-link">Community</Link></li>
              <li><Link to="/story" className="footer-link">Our Story</Link></li>
              <li><Link to="/offers" className="footer-link">Offers</Link></li>
              <li><Link to="/kinkoos" className="footer-link">Kinkoos</Link></li>
            </ul>
          </div>

          {/* Visiting & Hours */}
          <div className="footer-column">
            <h4 className="footer-column-title">Visiting Hours</h4>
            <div className="footer-info-list">
              <div className="footer-info-item">
                <Clock size={16} className="footer-icon" />
                <div>
                  <div className="footer-info-label">Mon – Fri</div>
                  <div className="footer-info-value">{settings.openingHours.weekdays}</div>
                </div>
              </div>
              <div className="footer-info-item">
                <Clock size={16} className="footer-icon" />
                <div>
                  <div className="footer-info-label">Sat – Sun</div>
                  <div className="footer-info-value">{settings.openingHours.weekends}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Contact */}
          <div className="footer-column">
            <h4 className="footer-column-title">Contact & Location</h4>
            <div className="footer-info-list">
              <div className="footer-info-item">
                <MapPin size={16} className="footer-icon" />
                <div>
                  <a
                    href={settings.googleMapsUrl || 'https://www.google.com/maps/place/Pause/@13.0312118,80.1833563,18.6z/data=!4m6!3m5!1s0x3a5261001bcfded7:0x9688462fab2ab15b!8m2!3d13.0314803!4d80.1836163!16s%2Fg%2F11zgm5f36g'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link-direct"
                    style={{ lineHeight: 1.4, display: 'block', marginBottom: '0.35rem' }}
                  >
                    {settings.address || '25JM+HFP, 19, Valluvar Salai, Ramapuram, Chennai 600089'}
                  </a>
                  <a
                    href={settings.googleMapsUrl || 'https://www.google.com/maps/place/Pause/@13.0312118,80.1833563,18.6z/data=!4m6!3m5!1s0x3a5261001bcfded7:0x9688462fab2ab15b!8m2!3d13.0314803!4d80.1836163!16s%2Fg%2F11zgm5f36g'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'var(--color-warm-amber)',
                      fontSize: '0.775rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <span>Get Directions on Google Maps →</span>
                  </a>
                </div>
              </div>
              <div className="footer-info-item">
                <Phone size={16} className="footer-icon" />
                <div>
                  <a href="tel:8056063347" className="footer-link-direct">
                    +91 80560 63347
                  </a>
                </div>
              </div>
              <div className="footer-info-item">
                <Mail size={16} className="footer-icon" />
                <div>
                  <a href={`mailto:${settings.email}`} className="footer-link-direct">
                    {settings.email}
                  </a>
                </div>
              </div>
              <div className="footer-info-item">
                <Instagram size={16} className="footer-icon" />
                <div>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link-direct"
                  >
                    @pause.chennai
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © 2026 PAUSE COFFEE & EATERY. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <Link to="/contact">Location</Link>
            <Link to="/story">Philosophy</Link>
            <Link to="/kinkoos">Loyalty Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
