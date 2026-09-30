import React from 'react';
import { MenuItem } from '../../types';
import cupLogoImg from '../../assets/cup-logo.png';

interface MenuCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
  return (
    <div
      className="menu-item-card"
      onClick={() => onClick(item)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === 'Enter' && onClick(item)}
      aria-label={`View details for ${item.name}`}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-espresso-dark)',
          marginBottom: 'var(--space-md)',
          position: 'relative'
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        {item.isFeatured && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'var(--color-terracotta)',
              color: '#fff',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700
            }}
          >
            Featured
          </div>
        )}
      </div>

      <div>
        <div className="menu-item-header">
          <h3 className="menu-item-title">{item.name}</h3>
          <div className="menu-item-price">₹{item.price}</div>
        </div>

        <p className="menu-item-desc">{item.description}</p>
      </div>

      <div className="menu-item-footer">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {item.dietaryTags?.map((tag) => (
            <span key={tag} className="tag-label" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--color-cream)', borderRadius: '2px' }}>
              {tag}
            </span>
          ))}
        </div>

        {item.kinkooValue > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-warm-amber)',
              fontWeight: 700
            }}
            title="Redeem with Kinkoos"
          >
            <img src={cupLogoImg} alt="" style={{ width: '13px', height: '13px' }} />
            <span>{item.kinkooValue} K</span>
          </div>
        )}
      </div>
    </div>
  );
};
