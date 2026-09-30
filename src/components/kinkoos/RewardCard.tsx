import React from 'react';
import { RewardItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { Lock, ArrowRight } from 'lucide-react';
import cupLogoImg from '../../assets/cup-logo.png';

interface RewardCardProps {
  reward: RewardItem;
  onClaim: (reward: RewardItem) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, onClaim }) => {
  const { balanceState } = useApp();

  const isLockedByMinimumBalance = balanceState.currentBalance < 500;
  const isLockedByCost = balanceState.currentBalance < reward.kinkooCost;

  return (
    <div className="card-paper-bordered" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Image frame */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: 'var(--radius-xs)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-parchment)',
          border: '1px solid var(--color-brown-border-light)',
          marginBottom: 'var(--space-md)',
          position: 'relative'
        }}
      >
        <img
          src={reward.image}
          alt={reward.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'var(--color-espresso)',
            color: 'var(--color-cream)',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <img src={cupLogoImg} alt="" style={{ width: '13px', height: '13px' }} />
          {reward.kinkooCost} Kinkoos
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="tag-label" style={{ marginBottom: '0.2rem' }}>
          {reward.category}
        </span>
        <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', marginBottom: '0.35rem', color: 'var(--color-espresso)' }}>
          {reward.title}
        </h4>
        <p className="body-small" style={{ marginBottom: 'var(--space-lg)', flex: 1 }}>
          {reward.description}
        </p>

        {/* Claim Action */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)', borderTop: '1px dotted var(--color-ink-rule)' }}>
          {isLockedByMinimumBalance ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-brown-muted)', fontSize: '0.775rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={13} /> 500 Kinkoos Minimum Required
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>({balanceState.currentBalance}/500)</span>
            </div>
          ) : isLockedByCost ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-brown-muted)', fontSize: '0.775rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={13} /> Need {reward.kinkooCost - balanceState.currentBalance} More Kinkoos
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>({balanceState.currentBalance}/{reward.kinkooCost})</span>
            </div>
          ) : (
            <button
              onClick={() => onClaim(reward)}
              className="btn btn-primary btn-sm btn-full"
              style={{ justifyContent: 'space-between' }}
            >
              <span>Redeem Reward</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
