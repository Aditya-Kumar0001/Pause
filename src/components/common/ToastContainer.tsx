import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Sparkles, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--color-sage)' }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--color-crimson-spam)' }} />}
          {toast.type === 'kinkoo' && <Sparkles size={18} style={{ color: 'var(--color-warm-amber)' }} />}
          {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-parchment)' }} />}

          <div style={{ flex: 1 }}>{toast.message}</div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{ color: 'var(--color-brown-muted)', padding: '2px', display: 'flex' }}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
