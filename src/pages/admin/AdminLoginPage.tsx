import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowLeft, Chrome } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const AdminLoginPage: React.FC = () => {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);

    const res = await loginAsAdmin();
    setIsSubmitting(false);

    if (res.success) {
      navigate('/admin-controls');
    } else {
      setError(res.error || 'This Google account is not an authorized café admin.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#261608',
        padding: 'var(--space-md)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FAF6F0',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid #D1BEA8'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <img src={logoImg} alt="Pause Logo" style={{ height: '56px', margin: '0 auto var(--space-md) auto' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-espresso)', marginBottom: '0.2rem' }}>
            Café Administration Portal
          </h2>
          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-brown-muted)' }}>
            PAUSE INTERNAL STAFF GATEWAY
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'rgba(158, 42, 43, 0.1)',
              border: '1px solid var(--color-crimson-spam)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-crimson-spam)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: 'var(--space-lg)'
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="btn btn-primary btn-full"
          style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Chrome size={17} />
          {isSubmitting ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-cream btn-sm btn-full"
          style={{ border: 'none' }}
        >
          <ArrowLeft size={14} /> Back to Customer Website
        </button>
      </div>
    </div>
  );
};
