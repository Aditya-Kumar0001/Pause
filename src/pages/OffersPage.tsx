import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OfferItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OffersPage: React.FC = () => {
  const { offers } = useApp();
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'scheduled' | 'expired'>('active');

  const filteredOffers = offers.filter((o: OfferItem) => {
    if (statusFilter === 'active') return o.status === 'active';
    if (statusFilter === 'scheduled') return o.status === 'scheduled';
    if (statusFilter === 'expired') return o.status === 'expired';
    return true;
  });

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-header text-center">
          <span className="section-tag">|| Curated Invitations</span>
          <h1 className="display-hero" style={{ marginBottom: 'var(--space-xs)' }}>
            Invitations to Pause
          </h1>
          <p className="subheading-editorial" style={{ maxWidth: '620px', margin: '0 auto' }}>
            "Curated morning rituals, tasting pairings, and member moments designed to enrich your pause."
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="editorial-tabs" style={{ justifyContent: 'center', maxWidth: '480px', margin: '0 auto var(--space-3xl) auto' }}>
          <button
            className={`editorial-tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active Invitations
          </button>
          <button
            className={`editorial-tab-btn ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            Upcoming
          </button>
          <button
            className={`editorial-tab-btn ${statusFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setStatusFilter('expired')}
          >
            Past Archives
          </button>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-2xl)' }}>
            {filteredOffers.map((offer: OfferItem) => (
              <div key={offer.id} className="card-paper-bordered" style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/10',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-parchment)',
                    border: '1px solid var(--color-brown-border-light)',
                    marginBottom: 'var(--space-md)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={offer.image}
                    alt={offer.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'var(--color-espresso)',
                      color: 'var(--color-cream)',
                      padding: '0.25rem 0.6rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {offer.badge}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', marginBottom: '0.35rem', color: 'var(--color-espresso)' }}>
                    {offer.title}
                  </h3>

                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-brown-secondary)', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                    "{offer.punchline}"
                  </div>

                  <p className="body-small" style={{ marginBottom: 'var(--space-lg)', flex: 1 }}>
                    {offer.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-mono)' }}>
                    <Calendar size={13} style={{ color: 'var(--color-warm-amber)' }} />
                    <span>Validity: {offer.startDate} to {offer.endDate}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      onClick={() => setSelectedOffer(offer)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      Invitation Terms
                    </button>
                    <Link to="/kinkoos" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                      {offer.ctaText}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-espresso)', marginBottom: '0.3rem' }}>
              No {statusFilter} invitations at this moment.
            </h4>
            <p className="body-small">New seasonal café pairings and member rituals are posted regularly.</p>
          </div>
        )}

        {/* Offer Details Modal */}
        <Modal
          isOpen={Boolean(selectedOffer)}
          onClose={() => setSelectedOffer(null)}
          title={selectedOffer?.title}
          subtitle={`Invitation Details • ${selectedOffer?.badge}`}
        >
          {selectedOffer && (
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--color-espresso)', marginBottom: 'var(--space-md)' }}>
                "{selectedOffer.punchline}"
              </div>

              <p className="body-regular" style={{ marginBottom: 'var(--space-lg)' }}>
                {selectedOffer.description}
              </p>

              <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>
                Terms & Conditions
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)' }}>
                {selectedOffer.terms.map((term: string, index: number) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--color-sage)', flexShrink: 0, marginTop: '3px' }} />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => setSelectedOffer(null)} className="btn btn-primary btn-full">
                Back to Invitations
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
