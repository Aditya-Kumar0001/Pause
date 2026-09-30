import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const AdminLoginPage: React.FC = () => {
  const { loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await loginAsAdmin(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/admin-controls');
    } else {
      setError(res.error || 'Invalid credentials.');
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Staff Email</label>
            <div style={{ position: 'relative' }}>
              <KeyRound
                size={18}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-brown-muted)' }}
              />
              <input
                id="admin-email"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="Enter staff email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              required
              className="form-input"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-full"
            style={{ marginBottom: 'var(--space-md)' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Enter Admin Dashboard'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-cream btn-sm btn-full"
            style={{ border: 'none' }}
          >
            <ArrowLeft size={14} /> Back to Customer Website
          </button>
        </form>
      </div>
    </div>
  );
};
