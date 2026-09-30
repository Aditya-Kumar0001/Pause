import React from 'react';
import { KinkooTransaction } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Clock } from 'lucide-react';
import cupLogoImg from '../../assets/cup-logo.png';

interface LedgerHistoryProps {
  transactions: KinkooTransaction[];
}

export const LedgerHistory: React.FC<LedgerHistoryProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
        Your Kinkoo story starts here. Visit the café to earn your first points.
      </div>
    );
  }

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Reference / Staff</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isCredit = tx.amount > 0;
            const formattedDate = new Date(tx.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <tr key={tx.id}>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{formattedDate}</span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={tx.type.replace('_', ' ')} />
                </td>
                <td style={{ fontWeight: 500 }}>{tx.description}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {tx.referenceId || tx.createdBy}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: isCredit ? 'var(--color-sage)' : 'var(--color-crimson-spam)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    {isCredit ? '+' : ''}
                    {tx.amount}
                    <img src={cupLogoImg} alt="" style={{ width: '12px', height: '12px', marginLeft: '2px' }} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
