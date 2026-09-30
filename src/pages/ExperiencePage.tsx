import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SlotPicker } from '../components/experience/SlotPicker';
import { BookingModal } from '../components/experience/BookingModal';
import { ExperienceSlot } from '../types';
import cupLogoImg from '../assets/cup-logo.png';

export const ExperiencePage: React.FC = () => {
  const { balanceState, experienceSlots } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<ExperienceSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSelectSlot = (slot: ExperienceSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const steps = [
    { num: '01', title: 'Choose a calm session', desc: 'Select a date and time slot from the calendar during quiet café hours.' },
    { num: '02', title: 'Visit Pause', desc: 'Step into our sanctuary, put on an apron, and meet your barista mentor.' },
    { num: '03', title: 'Learn the craft', desc: 'Explore bean origins, grinder calibration to 0.1g, and extraction dynamics.' },
    { num: '04', title: 'Hand-pull your drink', desc: 'Operate the commercial bar, texture microfoam, and pour your own creation.' },
    { num: '05', title: 'Savor your pause', desc: 'Take a seat at the communal table and cherish what you hand-crafted.' }
  ];

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-header text-center">
          <span className="section-tag">|| Participatory Craft</span>
          <h1 className="display-hero" style={{ marginBottom: 'var(--space-xs)' }}>
            Coffee-Making Experience
          </h1>
          <p className="subheading-editorial" style={{ maxWidth: '640px', margin: '0 auto' }}>
            "Don't just drink the coffee. Pause your day, step behind the bar, and learn the tactile craft of slow coffee."
          </p>
        </div>

        {/* Tactile Introduction Split */}
        <div className="experience-hero-split">
          <div>
            <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>
              A Different Way to Pause
            </div>
            <h2 className="heading-lg" style={{ marginBottom: 'var(--space-md)' }}>
              Step Behind the Counter
            </h2>
            <p className="body-lead" style={{ marginBottom: 'var(--space-md)' }}>
              On selected calm days, we invite you behind our bar. Pause the demands of life, explore commercial equipment, understand bean origin profiles, and learn how coffee is prepared under intimate one-on-one mentorship.
            </p>
            <p className="body-regular" style={{ marginBottom: 'var(--space-lg)' }}>
              This is not a theoretical course—it is a hands-on experience designed to give you time for yourself to create, explore, and cherish the beauty of slow extractions.
            </p>

            {/* Eligibility Banner */}
            <div
              style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--color-surface-paper)',
                border: '1px solid var(--color-brown-border)',
                borderRadius: 'var(--radius-xs)',
                marginBottom: 'var(--space-xl)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-espresso)', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                <img src={cupLogoImg} alt="" style={{ width: '16px', height: '16px' }} />
                <span>Member Access</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-espresso)', marginBottom: '0.4rem' }}>
                <strong>Complimentary with 6 Monthly Verified Visits</strong> or redeemable with <strong>600 Kinkoos</strong>.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                <span>Your Monthly Visits</span>
                <span>{balanceState.monthlyVisits} / 6 Visits</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, (balanceState.monthlyVisits / 6) * 100)}%` }} />
              </div>
            </div>

            <a href="#available-sessions" className="btn btn-primary btn-lg">
              Check Experience Availability
            </a>
          </div>

          <div className="framed-photo" style={{ height: '420px' }}>
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
              alt="Hands calibrating coffee portafilter behind the bar"
            />
          </div>
        </div>

        {/* HOW IT WORKS Section */}
        <div style={{ margin: 'var(--space-4xl) 0' }}>
          <div className="section-header text-center">
            <span className="section-tag">How It Works</span>
            <h2 className="heading-xl">From Selection to First Sip</h2>
          </div>

          <div className="experience-step-grid">
            {steps.map((s) => (
              <div key={s.num} className="experience-step-card">
                <div className="experience-step-num">{s.num}</div>
                <div className="experience-step-text" style={{ marginBottom: '0.35rem', fontWeight: 600, color: 'var(--color-espresso)' }}>
                  {s.title}
                </div>
                <p className="body-small" style={{ fontSize: '0.8rem' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar / Session Availability Section */}
        <div id="available-sessions" style={{ marginTop: 'var(--space-3xl)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--color-ink-rule)', paddingBottom: 'var(--space-md)' }}>
            <div>
              <span className="section-tag">Available Sessions</span>
              <h2 className="heading-xl">Session Schedule</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Non-busy café hours • Limited capacity per session
            </div>
          </div>

          <SlotPicker
            slots={experienceSlots}
            selectedSlotId={selectedSlot?.id || null}
            onSelectSlot={handleSelectSlot}
          />
        </div>

        {/* Booking Modal */}
        <BookingModal
          slot={selectedSlot}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};
