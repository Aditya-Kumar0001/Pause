import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { VisitToken } from '../../types';
import { useApp } from '../../context/AppContext';
import { Clock, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface VisitQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitQRModal: React.FC<VisitQRModalProps> = ({ isOpen, onClose }) => {
  const { generateVisitToken } = useApp();
  const [token, setToken] = useState<VisitToken | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generate token when modal opens
  const handleRegenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setToken(null);
    setSecondsRemaining(300);
    try {
      const newToken = await generateVisitToken();
      if (!newToken) {
        onClose();
        return;
      }
      setToken(newToken);
      setSecondsRemaining(300);
    } catch (error) {
      setToken(null);
      setGenerationError(error instanceof Error ? error.message : 'Could not generate a visit code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void handleRegenerate();
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || !token || secondsRemaining <= 0) return;

    const updateRemaining = () => {
      const expiresAt = new Date(token.expiresAt).getTime();
      setSecondsRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };
    updateRemaining();
    const timer = setInterval(() => {
      updateRemaining();
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, token]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isExpired = Boolean(token && secondsRemaining <= 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Visit Verification"
          subtitle="Show this six-digit code to your barista at the Pause counter to earn +100 Kinkoos"
      maxWidth="460px"
    >
      <div style={{ textAlign: 'center' }}>
        {/* Visit code */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-paper)',
            border: '1px solid var(--color-espresso)',
            borderRadius: 'var(--radius-xs)',
            padding: 'var(--space-md)',
            display: 'inline-block',
            position: 'relative'
          }}
        >
          {isExpired ? (
            <div
              style={{
                width: '200px',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-xs)'
              }}
            >
              <AlertTriangle size={32} style={{ color: 'var(--color-crimson-spam)' }} />
              <div style={{ fontWeight: 700, color: 'var(--color-espresso)' }}>Token Expired</div>
              <p className="body-small" style={{ fontSize: '0.775rem' }}>For security, this code expires after five minutes.</p>
              <button onClick={handleRegenerate} className="btn btn-primary btn-sm" style={{ marginTop: '0.4rem' }}>
                <RefreshCw size={13} /> Generate New Pass
              </button>
            </div>
          ) : token ? (
            <div style={{ width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
              <div className="tag-label">Six-Digit Visit Code</div>
              <div
                aria-label={`Visit code ${token.token}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '2.1rem', fontWeight: 800, color: 'var(--color-espresso)', letterSpacing: '0.18em' }}
              >
                {token.token}
              </div>
              <div className="body-small">Enter this code in the café admin panel.</div>
            </div>
          ) : (
            <div style={{ width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
              {generationError ? (
                <>
                  <AlertTriangle size={28} style={{ color: 'var(--color-crimson-spam)' }} />
                  <p className="body-small" role="alert">{generationError}</p>
                  <button onClick={handleRegenerate} disabled={isGenerating} className="btn btn-primary btn-sm">
                    <RefreshCw size={13} /> Try Again
                  </button>
                </>
              ) : (
                <p className="body-small" role="status">{isGenerating ? 'Generating visit pass...' : 'Preparing visit pass...'}</p>
              )}
            </div>
          )}
        </div>

        {/* Timer Bar */}
        {token && !isExpired && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              backgroundColor: 'var(--color-surface-pure)',
              border: '1px solid var(--color-brown-border)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: secondsRemaining < 60 ? 'var(--color-crimson-spam)' : 'var(--color-espresso)',
              fontWeight: 600
            }}
          >
            <Clock size={13} />
            <span>
              Expires in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Rules note */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-surface-pure)',
            border: '1px solid var(--color-brown-border-light)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.775rem',
            color: 'var(--text-secondary)',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-espresso)', marginBottom: '0.2rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--color-sage)' }} /> {token?.validationMode === 'local_fallback' ? 'Local Visit Code' : 'Server-Validated Physical Presence'}
          </div>
          {token?.validationMode === 'local_fallback'
            ? 'Firebase Functions are unavailable. This temporary code is stored in this browser, so staff must validate it from this same browser.'
            : 'Single-use security code. It expires after five minutes and can only be validated once by cafe staff.'}
        </div>
      </div>
    </Modal>
  );
};
