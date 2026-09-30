import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Coffee, Heart, MessageCircle, Users } from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const { joinCommunity } = useApp();
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [joined, setJoined] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = await joinCommunity(contactForm);
    if (result.success) {
      setJoined(true);
    } else {
      setFormError(result.error || 'We could not add you right now. Please try again.');
    }
  };

  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80', caption: 'Sunday Tasting Table' },
    { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80', caption: 'Hands-on Pour-Over' },
    { url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=80', caption: 'Quiet Reading Hours' },
    { url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80', caption: 'Community Espresso Bar' }
  ];

  return (
    <div className="section">
      <div className="container">
        {/* Hero Section */}
        <div className="community-hero-box">
          <div className="tag-label" style={{ color: 'var(--color-parchment)', marginBottom: 'var(--space-xs)' }}>
            The Communal Table
          </div>
          <h1 className="display-editorial" style={{ color: '#fff', marginBottom: 'var(--space-md)' }}>
            THE PAUSE COMMUNITY
          </h1>
          <p style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-parchment)', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
            "Coffee brings people in. Taking a pause together gives them a reason to cherish the moment."
          </p>
        </div>

        {/* 1. Community Philosophy */}
        <div className="philosophy-section" style={{ backgroundColor: 'transparent', borderTop: 'none', padding: '0 0 var(--space-3xl) 0' }}>
          <div className="philosophy-split">
            <div>
              <span className="section-tag">A Place to Connect</span>
              <h2 className="heading-lg" style={{ marginTop: 'var(--space-xs)' }}>
                Why We Gather
              </h2>
            </div>
            <div className="philosophy-body">
              <p>
                In the European tradition of neighborhood gathering spaces, Pause is a refuge from the daily grind. We do not rush tables. Whether you come to sketch, write, or converse with a friend over steaming cups, our communal table is open to all who seek a pause.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Community Connection */}
        <div style={{ margin: 'var(--space-3xl) 0' }}>
          <div className="section-header">
            <span className="section-tag">People Who Pause</span>
            <h2 className="heading-xl">A table for people like you</h2>
            <p className="subheading-editorial" style={{ maxWidth: '680px', margin: 'var(--space-sm) auto 0 auto' }}>
              Come as you are. Some people talk over a flat white, some bring a notebook, and some simply sit with their coffee. There is room for every kind of pause here.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginTop: 'var(--space-2xl)' }}>
            {[
              { icon: Coffee, title: 'Share the ritual', text: 'Find people who care about the little details: a slower pour, a warm cup, and time to enjoy it.' },
              { icon: MessageCircle, title: 'Find your people', text: 'A gentle place for curious minds, regulars, makers, readers, and anyone looking for good company.' },
              { icon: Heart, title: 'Stay connected', text: 'Receive thoughtful notes from Pause and be the first to hear when the community gathers.' }
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card-paper-bordered" style={{ padding: 'var(--space-xl)' }}>
                <Icon size={24} style={{ color: 'var(--color-warm-amber)', marginBottom: 'var(--space-md)' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', marginBottom: 'var(--space-xs)' }}>{title}</h3>
                <p className="body-small">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Community Moments Gallery */}
        <div style={{ margin: 'var(--space-3xl) 0' }}>
          <div className="section-header">
            <span className="section-tag">Visual Archive</span>
            <h2 className="heading-xl">Community Moments</h2>
          </div>

          <div className="community-gallery-grid">
            {galleryImages.map((g, idx) => (
              <div key={idx} className="community-gallery-item">
                <img src={g.url} alt={g.caption} />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Join the Community Form */}
        <div style={{ maxWidth: '620px', margin: 'var(--space-4xl) auto 0 auto', textAlign: 'center', padding: 'var(--space-2xl)', backgroundColor: 'var(--color-surface-pure)', border: '1px solid var(--color-espresso)', borderRadius: 'var(--radius-xs)' }}>
          <span className="section-tag">Stay in the Circle</span>
          <h3 className="heading-lg" style={{ margin: 'var(--space-xs) 0 var(--space-sm) 0' }}>
            Join the Pause Table
          </h3>
          <p className="body-small" style={{ marginBottom: 'var(--space-lg)' }}>
            Leave your details and we will keep you close to the Pause table. No noise, just good coffee and invitations worth opening.
          </p>

          {joined ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: 'var(--color-sage)', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>You're part of the Pause Community Table. Welcome.</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>You'll soon be added to our social media groups too.</span>
            </div>
          ) : (
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', textAlign: 'left' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Your name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              />
              <input
                type="email"
                required
                className="form-input"
                placeholder="Email address"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
              <input
                type="tel"
                className="form-input"
                placeholder="Phone number (optional)"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
              {formError && <p style={{ color: 'var(--color-crimson-spam)', fontSize: '0.85rem', margin: 0 }}>{formError}</p>}
              <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-xs)' }}>
                <Users size={16} /> Join the Community
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
