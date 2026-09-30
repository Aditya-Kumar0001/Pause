import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Clock, Phone, Instagram, Send, CheckCircle2, Navigation, Copy, ExternalLink, Sparkles } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '2',
    date: '',
    time: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    showToast('Table pause inquiry received! Our team will confirm shortly.', 'success');
  };

  const fullAddress = settings.address || '25JM+HFP, 19, Valluvar Salai, K P Nagar, Andavar Nagar, Chidambaram Nagar, Ramapuram, Chennai, Tamil Nadu 600089';
  const googleMapsLink = settings.googleMapsUrl || 'https://www.google.com/maps/place/Pause/@13.0312118,80.1833563,18.6z/data=!4m6!3m5!1s0x3a5261001bcfded7:0x9688462fab2ab15b!8m2!3d13.0314803!4d80.1836163!16s%2Fg%2F11zgm5f36g';
  const mapEmbedUrl = settings.googleMapsEmbedUrl || 'https://maps.google.com/maps?q=13.0314803,80.1836163&hl=en&z=17&output=embed';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    showToast('Address copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const instagramUrl = settings.instagram?.startsWith('http')
    ? settings.instagram
    : 'https://www.instagram.com/pause.chennai?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==';

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-header text-center">
          <span className="section-tag">
            <Sparkles size={12} style={{ color: 'var(--color-warm-amber)' }} />
            A Sanctuary in Ramapuram
          </span>
          <h1 className="display-hero" style={{ marginBottom: 'var(--space-xs)' }}>
            Visit Pause
          </h1>
          <p className="subheading-editorial" style={{ maxWidth: '640px', margin: '0 auto' }}>
            "Give your day a pause. Take a seat by our arched windows, browse the library nook, or visit our communal table."
          </p>
        </div>

        <div className="hero-editorial-split" style={{ alignItems: 'flex-start', gap: 'var(--space-3xl)' }}>
          {/* Left Column: Café Info & Interactive Google Map */}
          <div>
            {/* Atmosphere & Details Card */}
            <div className="card-paper-bordered" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>
                Physical Café Details
              </div>
              <h2 className="heading-lg" style={{ marginBottom: 'var(--space-lg)' }}>
                Atmosphere & Hours
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {/* Full Address */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <MapPin size={20} style={{ color: 'var(--color-espresso)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: 'var(--color-espresso)', fontSize: '0.95rem' }}>Location & Address</strong>
                      <button
                        onClick={handleCopyAddress}
                        style={{
                          fontSize: '0.75rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-brown-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--color-parchment-light)'
                        }}
                        title="Copy full address"
                      >
                        <Copy size={12} />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {fullAddress}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-parchment" style={{ fontSize: '0.7rem' }}>
                        Plus Code: 25JM+HFP
                      </span>
                      <span className="badge badge-parchment" style={{ fontSize: '0.7rem' }}>
                        Ramapuram, Chennai
                      </span>
                      <span className="badge badge-parchment" style={{ fontSize: '0.7rem' }}>
                        PIN 600089
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visiting Hours */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <Clock size={20} style={{ color: 'var(--color-warm-amber)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--color-espresso)', fontSize: '0.95rem' }}>Visiting Hours</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem', lineHeight: 1.5 }}>
                      <div>Weekdays: <strong>{settings.openingHours.weekdays}</strong></div>
                      <div>Weekends: <strong>{settings.openingHours.weekends}</strong></div>
                      <div>Holidays: <strong>{settings.openingHours.holidayHours}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Direct Phone Line */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <Phone size={20} style={{ color: 'var(--color-sage)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--color-espresso)', fontSize: '0.95rem' }}>Direct Line</strong>
                    <div>
                      <a
                        href="tel:8056063347"
                        style={{ color: 'var(--color-espresso)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
                      >
                        +91 80560 63347
                      </a>
                    </div>
                  </div>
                </div>

                {/* Instagram */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <Instagram size={20} style={{ color: 'var(--color-espresso)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--color-espresso)', fontSize: '0.95rem' }}>Social Archive</strong>
                    <div>
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-espresso)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        @pause.chennai
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Google Map Frame */}
            <div className="card-paper-bordered" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--color-surface-pure)' }}>
              {/* Map Top Bar */}
              <div
                style={{
                  padding: '0.75rem var(--space-md)',
                  backgroundColor: 'var(--color-espresso)',
                  color: 'var(--color-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4ade80',
                      boxShadow: '0 0 8px #4ade80'
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em' }}>
                    LIVE LOCATION • RAMAPURAM
                  </span>
                </div>
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--color-cream)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-xs)'
                  }}
                >
                  <span>Open in Maps</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Google Maps Embed Iframe */}
              <div style={{ width: '100%', height: '280px', position: 'relative', backgroundColor: '#e5e3df' }}>
                <iframe
                  title="Pause Coffee & Eatery Google Map Location"
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Map Bottom Actions Strip */}
              <div
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--color-surface-paper)',
                  borderTop: '1px solid var(--color-brown-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-sm)'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Pause Coffee & Eatery</strong> • 19, Valluvar Salai, Ramapuram
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Navigation size={13} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Table Reservation Enquiry */}
          <div className="card-paper-bordered">
            <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>
              Table & Space Inquiries
            </div>
            <h2 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
              Reserve a Table Pause
            </h2>
            <p className="body-small" style={{ marginBottom: 'var(--space-xl)' }}>
              For quiet reading, small meetings, or group conversations. Walk-ins are always welcomed at our communal table.
            </p>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+91 80560 63347"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Guests</label>
                    <select
                      className="form-select"
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    >
                      <option value="1">1 Person (Quiet Reading)</option>
                      <option value="2">2 People (Window Table)</option>
                      <option value="4">4 People (Pine Table)</option>
                      <option value="6+">6+ People (Group Session)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Notes or Dietary Preferences (Optional)</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="e.g. Quiet corner, oat milk preferences..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  <Send size={15} />
                  <span>Submit Table Inquiry</span>
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--color-sage)', margin: '0 auto var(--space-md) auto' }} />
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', marginBottom: '0.35rem' }}>
                  Inquiry Received
                </h3>
                <p className="body-small" style={{ maxWidth: '380px', margin: '0 auto var(--space-xl) auto' }}>
                  Thank you, {formData.name}. We look forward to welcoming you to Pause.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', guests: '2', date: '', time: '', message: '' });
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Submit Another Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
