import React from 'react';
import { MenuItem } from '../../types';
import { Modal } from '../common/Modal';
import cupLogoImg from '../../assets/cup-logo.png';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      subtitle={`Category: ${item.category}`}
    >
      <div>
        <div className="item-detail-price-row" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div className="item-detail-price" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-espresso)' }}>
            {item.priceDisplay || `₹${item.price}`}
          </div>

          {item.kinkooValue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-espresso)', fontWeight: 600 }}>
              <img src={cupLogoImg} alt="" style={{ width: '14px', height: '14px' }} />
              <span>Or {item.kinkooValue} Kinkoos</span>
            </div>
          )}
        </div>

        {item.options && item.options.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', backgroundColor: 'var(--color-surface-pure)', border: '1px solid var(--color-brown-border)', borderRadius: 'var(--radius-xs)' }}>
            <div className="tag-label" style={{ marginBottom: 'var(--space-xs)' }}>Available Options</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {item.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-espresso)' }}>
                  <span>{opt.name}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{opt.price}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.note && (
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--color-parchment-light)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-brown-border)',
              fontSize: '0.85rem',
              color: 'var(--color-espresso)',
              marginBottom: 'var(--space-lg)',
              fontStyle: 'italic'
            }}
          >
            "{item.note}"
          </div>
        )}

        {item.description && (
          <p className="body-regular" style={{ marginBottom: 'var(--space-lg)' }}>
            {item.description}
          </p>
        )}

        <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-ink-rule)' }}>
          <button onClick={onClose} className="btn btn-primary btn-full">
            Back to Menu
          </button>
        </div>
      </div>
    </Modal>
  );
};
