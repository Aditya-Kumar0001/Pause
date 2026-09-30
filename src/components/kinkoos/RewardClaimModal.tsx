import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../common/Modal';
import { RedemptionRecord, RewardItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { AlertCircle } from 'lucide-react';
import cupLogoImg from '../../assets/cup-logo.png';

interface RewardClaimModalProps {
  reward: RewardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RewardClaimModal: React.FC<RewardClaimModalProps> = ({ reward, isOpen, onClose }) => {
  const { claimReward, balanceState } = useApp();
  const [redemption, setRedemption] = useState<RedemptionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRedemption(null);
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (redemption && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({
          voucherCode: redemption.code,
          rewardId: redemption.rewardId,
          userId: redemption.userId
        }),
        {
          width: 160,
          margin: 1,
          color: {
            dark: '#23150A',
            light: '#FAF6F0'
          }
        }
      );
    }
  }, [redemption]);

  if (!reward) return null;

  const handleConfirmClaim = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await claimReward(reward.id);
      if (res.success && res.redemption) setRedemption(res.redemption);
      else setError(res.error || 'Unable to claim reward.');
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'Unable to claim reward.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={redemption ? 'Reward Voucher Issued' : 'Confirm Reward Redemption'}
      subtitle={redemption ? 'Present this voucher to your barista in person at Pause' : 'Kinkoos will be deducted from your account ledger'}
    >
      {!redemption ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-surface-pure)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-brown-border)',
              marginBottom: 'var(--space-lg)'
            }}
          >
            <img
              src={reward.image}
              alt={reward.title}
              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-xs)' }}
            />
            <div>
              <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)', marginBottom: '0.2rem' }}>
                {reward.title}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-espresso)', fontSize: '0.85rem' }}>
                <img src={cupLogoImg} alt="" style={{ width: '13px', height: '13px' }} />
                {reward.kinkooCost} Kinkoos
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span>Current Kinkoo Balance:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{balanceState.currentBalance}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: 'var(--color-crimson-spam)' }}>
              <span>Cost to Deduct:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>-{reward.kinkooCost}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dotted var(--color-ink-rule)', fontWeight: 600, color: 'var(--color-espresso)' }}>
              <span>Remaining Balance:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{balanceState.currentBalance - reward.kinkooCost}</strong>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--color-parchment-light)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.775rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xl)',
              border: '1px solid var(--color-brown-border-light)'
            }}
          >
            <strong>Physical Café Rule:</strong> Kinkoo reward redemptions require an in-person physical café visit.
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button onClick={onClose} className="btn btn-secondary btn-full">
              Cancel
            </button>
            <button
              onClick={handleConfirmClaim}
              disabled={isProcessing}
              className="btn btn-primary btn-full"
            >
              {isProcessing ? 'Deducting...' : `Confirm & Claim`}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              backgroundColor: 'var(--color-surface-pure)',
              border: '1px solid var(--color-espresso)',
              borderRadius: 'var(--radius-xs)',
              padding: 'var(--space-xl)',
              margin: '0 auto var(--space-lg) auto',
              maxWidth: '340px'
            }}
          >
            <div className="tag-label">
              Voucher Passcode
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--color-espresso)',
                letterSpacing: '0.1em',
                margin: '0.25rem 0 var(--space-md) 0'
              }}
            >
              {redemption.code}
            </div>

            <canvas ref={canvasRef} style={{ margin: '0 auto', display: 'block' }} />

            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-espresso)' }}>
              {reward.title}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              Valid for 15 days • Single use
            </div>
          </div>

          <p className="body-small" style={{ marginBottom: 'var(--space-xl)' }}>
            Show this passcode or QR code to the barista at Pause to receive your item.
          </p>

          <button onClick={onClose} className="btn btn-primary btn-full">
            Done & Return to Account
          </button>
        </div>
      )}
    </Modal>
  );
};
