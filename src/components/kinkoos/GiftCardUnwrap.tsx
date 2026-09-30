import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import cupLogoImg from '../../assets/cup-logo.png';
import { Gift } from 'lucide-react';

interface GiftCardUnwrapProps {
  compact?: boolean;
}

export const GiftCardUnwrap: React.FC<GiftCardUnwrapProps> = ({ compact = false }) => {
  const { balanceState, claimWeeklyGift } = useApp();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'awarded' | 'already_claimed'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleOpen = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const result = await claimWeeklyGift();
      if (result.success) {
        setIsOpened(true);
        setClaimStatus('awarded');
        setClaimError(null);
      } else if (result.alreadyClaimed) {
        setIsOpened(true);
        setClaimStatus('already_claimed');
        setClaimError(null);
      } else {
        setClaimError(result.error || 'We could not claim your Kinkoos. Please try again.');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
      <div className="section-tag" style={{ margin: '0 auto var(--space-xs) auto' }}>
        <span>Weekly Community Gift</span>
      </div>

      <h3 style={{ fontSize: compact ? '1.25rem' : '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', marginBottom: '0.35rem' }}>
        Weekly 100 Complimentary Kinkoos
      </h3>
      <p className="body-small" style={{ marginBottom: 'var(--space-lg)' }}>
        Signed-in members can claim 100 complimentary Kinkoos once each calendar week to celebrate slow coffee craft.
      </p>

      {!isOpened ? (
        <div className="gift-card-envelope">
          <div style={{ width: '48px', height: '48px', margin: '0 auto var(--space-md) auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-espresso)', color: 'var(--color-cream)', borderRadius: 'var(--radius-xs)' }}>
            <Gift size={24} />
          </div>

          <div className="tag-label" style={{ marginBottom: '0.4rem' }}>
            Weekly Gift Voucher
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-espresso)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            100 Kinkoos Pass
          </div>

          <button
            onClick={handleOpen}
            disabled={isClaiming}
            className="btn btn-primary btn-lg"
          >
            {isClaiming ? 'Claiming…' : balanceState.claimedWeeklyGiftThisWeek ? "Check This Week's Status" : "Claim This Week's 100 Kinkoos"}
          </button>
          {claimError && <p role="alert" style={{ color: 'var(--color-crimson-spam)', marginTop: 'var(--space-sm)', fontSize: '0.85rem' }}>{claimError}</p>}
        </div>
      ) : (
        <div className="gift-card-opened">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: 'var(--space-xs)' }}>
            <img src={cupLogoImg} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-espresso)' }}>
              100 Kinkoos
            </div>
          </div>

          {claimStatus === 'awarded' ? (
            <div style={{ color: 'var(--color-sage)', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.35rem' }}>
              ✓ Successfully claimed! 100 Kinkoos have been added to your ledger.
            </div>
          ) : (
            <div style={{ color: 'var(--color-espresso)', fontSize: '0.9rem', marginTop: '0.35rem', fontWeight: 600 }}>
              YOU'VE ALREADY CLAIMED THIS WEEK'S KINKOOS.
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.2rem' }}>
                Your next 100 Kinkoos gift voucher will be ready next week.
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-ink-rule)', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PAUSE LOYALTY LEDGER • SERVER VALIDATED
          </div>
        </div>
      )}
    </div>
  );
};
