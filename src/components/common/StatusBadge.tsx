import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const s = status.toLowerCase();

  let badgeClass = 'badge';
  let displayLabel = label || status;

  if (s === 'active' || s === 'verified' || s === 'open' || s === 'confirmed') {
    badgeClass += ' badge-success';
  } else if (s === 'flagged' || s === 'flagged_spam' || s === 'cancelled' || s === 'expired') {
    badgeClass += ' badge-danger';
  } else if (s === 'used' || s === 'verified_consumed' || s === 'completed') {
    badgeClass += ' badge-dark';
  } else {
    badgeClass += ' badge-kinkoo';
  }

  return <span className={badgeClass}>{displayLabel}</span>;
};
