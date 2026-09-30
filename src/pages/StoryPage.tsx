import React from 'react';
import logoImg from '../assets/logo.png';

export const StoryPage: React.FC = () => {
  return (
    <div className="section">
      <div className="container">
        {/* Magazine-Style Story Article */}
        <article className="story-magazine-layout">
          <div className="story-magazine-header">
            <img src={logoImg} alt="Pause Coffee & Eatery" style={{ height: '56px', width: 'auto', margin: '0 auto var(--space-md) auto' }} />
            <div className="tag-label">Editorial Archive • Volume 01</div>
            <h1 className="display-editorial" style={{ margin: 'var(--space-xs) 0 var(--space-xs) 0' }}>
              The Story of Pause
            </h1>
            <div className="subheading-editorial">
              Giving Life a Moment to Slow Down, Cherish, and Simply Be
            </div>
          </div>

          {/* Lead Dropcap Paragraph */}
          <div className="story-lead-paragraph">
            The brand name <strong>Pause</strong> was born out of a simple observation: we live in a world consumed by momentum, deadlines, and screen-driven urgency. We rush between meetings, gulp down takeout coffee in traffic, and forget to breathe. <strong>Pause means giving a pause to your life, your work, and everything around you</strong>—to reclaim time for yourself to enjoy, cherish, and savor quiet moments.
          </div>

          <div className="framed-photo" style={{ height: '380px', margin: 'var(--space-2xl) 0' }}>
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80"
              alt="Artisanal European café interior with warm morning light"
            />
          </div>

          {/* 1. WHY PAUSE EXISTS */}
          <h2 className="story-section-heading">The Meaning of the Pause</h2>
          <p className="body-regular" style={{ marginBottom: 'var(--space-md)' }}>
            Through this cup of coffee, Pause offers an intentional sanctuary. We weigh our single-origin beans to the tenth of a gram, slow-pour our filters with steady hands, and invite you to sit down on textured wood, converse with a friend, or savor quiet solitude.
          </p>

          {/* Pull Quote */}
          <blockquote className="story-quote-block">
            "Pause is not lost time. It is the forgotten luxury of slowing down, looking up from our screens, and giving ourselves permission to enjoy the moment."
          </blockquote>

          {/* 2. THE FOUNDER & EUROPEAN INSPIRATION */}
          <h2 className="story-section-heading">European Inspiration & Hospitality</h2>
          <p className="body-regular" style={{ marginBottom: 'var(--space-md)' }}>
            Having immersed in European café traditions and specialty coffee culture across the grand coffee houses of Europe, our founder experienced firsthand how independent neighborhood cafés act as cultural sanctuaries.
          </p>
          <p className="body-regular" style={{ marginBottom: 'var(--space-md)' }}>
            In those side-street cafés, coffee is never treated as a fast-food transaction. It is an unhurried ritual—an invitation to sit by arched windows, read a book, and celebrate genuine human connection. That balance of artisan precision and timeless hospitality became the foundational DNA of Pause here in Chennai.
          </p>

          {/* 3. THE SYMBOL "||" */}
          <h2 className="story-section-heading">The Symbol "||"</h2>
          <p className="body-regular" style={{ marginBottom: 'var(--space-md)' }}>
            The two vertical bars <strong>||</strong> on our takeaway cup represent the universal pause symbol. It is a quiet reminder on your desk or in your hands that pausing is not a halt—it is how we restore clarity, focus, and human warmth.
          </p>

          {/* Sign-off */}
          <div style={{ textAlign: 'center', paddingTop: 'var(--space-2xl)', borderTop: '1px solid var(--color-ink-rule)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--color-espresso)' }}>
              "Pause your life. Take a moment for yourself."
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-brown-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              The Founding Team & Baristas of Pause • Chennai
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
