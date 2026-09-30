import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Chrome } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { authLoading, firebaseUser, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = (location.state as { from?: string } | null)?.from || '/account';

  useEffect(() => {
    if (!authLoading && !isSubmitting && !error && firebaseUser) navigate(redirectPath, { replace: true });
  }, [authLoading, error, firebaseUser, isSubmitting, navigate, redirectPath]);

  if (authLoading) {
    return <div className="auth-state" role="status">Checking your account...</div>;
  }
  if (firebaseUser && !isSubmitting && !error) return <Navigate to={redirectPath} replace />;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) setError(result.error || 'We could not complete that request. Please try again.');
    } catch {
      setError('We could not complete that request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page section">
      <div className="auth-content">
        <div className="auth-heading">
          <span className="section-tag">A moment for yourself</span>
          <h1 className="heading-xl">Welcome to Pause</h1>
          <p className="body-small">Sign in to keep your Pause moments close.</p>
        </div>

        <div className="auth-form-surface">
          <button type="button" className="btn btn-secondary btn-full auth-google-button" onClick={handleGoogleSignIn} disabled={isSubmitting}>
            <Chrome size={17} />
            {isSubmitting ? 'Connecting...' : 'Continue with Google'}
          </button>

          {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
};
