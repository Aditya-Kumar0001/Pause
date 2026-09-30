import React from 'react';
import { Coffee } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <Coffee size={44} />}
      </div>
      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.4rem', color: 'var(--color-espresso)' }}>
        {title}
      </h4>
      {description && (
        <p className="body-small" style={{ maxWidth: '400px', margin: '0 auto var(--space-md) auto' }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-cream btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
