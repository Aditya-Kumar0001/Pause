import React, { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Chrome } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const {
    authLoading,
    firebaseUser,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = (location.state as { from?: string } | null)?.from || '/account';

  useEffect(() => {
    if (!authLoading && !isSubmitting && !error && firebaseUser) navigate(redirectPath, { replace: true });
  }, [authLoading, error, firebaseUser, isSubmitting, navigate, redirectPath]);

  if (authLoading) {
    return <div className="auth-state" role="status">Checking your account...</div>;
  }
  if (firebaseUser && !isSubmitting && !error) return <Navigate to={redirectPath} replace />;

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
  };

  const runAuth = async (operation: () => Promise<{ success: boolean; error?: string }>) => {
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      const result = await operation();
      if (!result.success) setError(result.error || 'We could not complete that request. Please try again.');
      return result.success;
    } catch {
      setError('We could not complete that request. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'reset') {
      if (await runAuth(() => sendPasswordReset(email))) {
        setNotice('If an account exists for that email, a reset link is on its way.');
      }
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('The passwords do not match.');
        return;
      }
      await runAuth(() => signUpWithEmail(name.trim(), phone.trim(), email.trim(), password));
      return;
    }

    await runAuth(() => signInWithEmail(email.trim(), password));
  };

  const handleGoogleSignIn = async () => {
    await runAuth(signInWithGoogle);
  };

  return (
    <section className="auth-page section">
      <div className="auth-content">
        <div className="auth-heading">
          <span className="section-tag">A moment for yourself</span>
          <h1 className="heading-xl">
            {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome to Pause'}
          </h1>
          <p className="body-small">
            {mode === 'reset'
              ? 'We will send a password reset link to your email.'
              : 'Sign in to keep your Pause moments close.'}
          </p>
        </div>

        <div className="auth-form-surface">
          {mode !== 'reset' && (
            <>
              <button type="button" className="btn btn-secondary btn-full auth-google-button" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <Chrome size={17} />
                {isSubmitting ? 'Connecting...' : 'Continue with Google'}
              </button>
              <div className="auth-divider"><span>or</span></div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Name</label>
                <input id="auth-name" className="form-input" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            )}

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-phone">Phone Number</label>
                <input id="auth-phone" className="form-input" type="tel" autoComplete="tel" inputMode="tel" minLength={7} maxLength={20} required value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email</label>
              <input id="auth-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            {mode !== 'reset' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <input id="auth-password" className="form-input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            )}

            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
                <input id="auth-confirm-password" className="form-input" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
            )}

            {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-message-success" role="status">{notice}</p>}

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'reset'
                    ? 'Send Reset Link'
                    : 'Sign In'}
            </button>
          </form>

          {mode === 'signin' && (
            <button className="auth-text-link auth-forgot-link" type="button" onClick={() => selectMode('reset')}>
              Forgot password?
            </button>
          )}

          <div className="auth-switch">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button className="auth-text-link" type="button" onClick={() => selectMode('signin')}>Sign in</button>
              </>
            ) : mode === 'reset' ? (
              <button className="auth-text-link" type="button" onClick={() => selectMode('signin')}>
                <ArrowLeft size={14} /> Back to sign in
              </button>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button className="auth-text-link" type="button" onClick={() => selectMode('signup')}>Create account</button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};