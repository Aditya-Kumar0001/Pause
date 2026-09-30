import React, { useState } from 'react';
import { ExperienceSlot } from '../../types';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import cupLogoImg from '../../assets/cup-logo.png';

interface BookingModalProps {
  slot: ExperienceSlot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ slot, isOpen, onClose }) => {
  const { bookExperience, balanceState } = useApp();
  const { currentUser } = useAuth();

  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [useMonthlyReward, setUseMonthlyReward] = useState<boolean>(balanceState.hasEarnedMonthlyExperience);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!slot) return null;

  const hasSufficientKinkoos = balanceState.currentBalance >= slot.kinkooRequired;
  const canUseMonthlyReward = balanceState.hasEarnedMonthlyExperience;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a contact phone number for workshop coordination.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await bookExperience(slot.id, phone, useMonthlyReward);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Failed to book slot.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? 'Reservation Confirmed' : 'Reserve Behind-The-Bar Session'}
      subtitle={isSuccess ? 'We look forward to welcoming you behind the counter' : slot.title}
    >
      {!isSuccess ? (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-surface-pure)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-brown-border)',
              marginBottom: 'var(--space-lg)'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--color-espresso)', marginBottom: '0.2rem' }}>
              <strong>Date:</strong> {slot.date} • <strong>Time:</strong> {slot.time}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-espresso)' }}>
              <strong>Duration:</strong> {slot.durationMinutes} Minutes Hands-on
            </div>
          </div>

          {/* Payment / Reward Method Selection */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">Payment & Redemption Method</label>

            {canUseMonthlyReward && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: useMonthlyReward ? 'rgba(90, 113, 92, 0.1)' : '#fff',
                  border: useMonthlyReward ? '1px solid var(--color-sage)' : '1px solid var(--color-brown-border-light)',
                  borderRadius: 'var(--radius-xs)',
                  marginBottom: 'var(--space-sm)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="redemptionMethod"
                  checked={useMonthlyReward}
                  onChange={() => setUseMonthlyReward(true)}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-sage)' }}>
                    ★ 6 Monthly Verified Visits Reward (Free)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    You completed 6 visits this month! Complimentary workshop unlocked.
                  </div>
                </div>
              </label>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: !useMonthlyReward ? 'var(--color-surface-pure)' : '#fff',
                border: !useMonthlyReward ? '1px solid var(--color-espresso)' : '1px solid var(--color-brown-border-light)',
                borderRadius: 'var(--radius-xs)',
                cursor: hasSufficientKinkoos ? 'pointer' : 'not-allowed',
                opacity: hasSufficientKinkoos ? 1 : 0.6
              }}
            >
              <input
                type="radio"
                name="redemptionMethod"
                disabled={!hasSufficientKinkoos}
                checked={!useMonthlyReward}
                onChange={() => setUseMonthlyReward(false)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-espresso)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src={cupLogoImg} alt="" style={{ width: '13px', height: '13px' }} />
                  <span>Redeem with {slot.kinkooRequired} Kinkoos</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Your Balance: {balanceState.currentBalance} Kinkoos {hasSufficientKinkoos ? '(Sufficient)' : '(Insufficient)'}
                </div>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Attendee Name</label>
            <input type="text" className="form-input" value={currentUser.name} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button type="button" onClick={handleClose} className="btn btn-secondary btn-full">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-full">
              {isSubmitting ? 'Reserving…' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--color-sage)', margin: '0 auto var(--space-md) auto' }} />
          <h4 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', marginBottom: '0.35rem' }}>
            Reservation Confirmed
          </h4>
          <p className="body-small" style={{ maxWidth: '380px', margin: '0 auto var(--space-xl) auto' }}>
            Please arrive 10 minutes prior to session start at Pause Coffee & Eatery. Barista apron and tools will be prepared for you.
          </p>

          <button onClick={handleClose} className="btn btn-primary btn-full">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
