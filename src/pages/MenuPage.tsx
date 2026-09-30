import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuCategoryType, MenuItem } from '../types';
import { Search } from 'lucide-react';
import { ItemDetailModal } from '../components/menu/ItemDetailModal';

const CATEGORY_ORDER: MenuCategoryType[] = [
  'Coffee',
  'Slow Bar',
  'Cold Coffee',
  'Thickshakes & Non-Coffee',
  'Bakery',
  'Mojitos',
  'Bites',
  'Burgers',
  'Wraps',
  'Combos',
  'Sweet Pause'
];

export const MenuPage: React.FC = () => {
  const { menuItems } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item: MenuItem) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.priceDisplay && item.priceDisplay.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Group items by category in the defined order
  const groupedCategories = useMemo(() => {
    const map = new Map<MenuCategoryType, MenuItem[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));

    filteredItems.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });

    return Array.from(map.entries()).filter(([_, items]) => items.length > 0);
  }, [filteredItems]);

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-header text-center">
          <span className="section-tag">|| Crafted for Savoring</span>
          <h1 className="display-hero" style={{ marginBottom: 'var(--space-xs)' }}>
            The Pause Menu
          </h1>
          <p className="subheading-editorial" style={{ maxWidth: '620px', margin: '0 auto' }}>
            "Give yourself time to pause. Hand-pulled espresso, slow filter extractions, chilled signatures & fresh café bakes."
          </p>
        </div>

        {/* Search & Category Quick-Navigation */}
        <div style={{ maxWidth: '640px', margin: '0 auto var(--space-2xl) auto' }}>
          <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
            <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-brown-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search drinks, roasts, or provisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="editorial-tabs menu-category-tabs" style={{ justifyContent: 'center' }}>
            <button
              className={`editorial-tab-btn ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Categories
            </button>
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                className={`editorial-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Printed Menu Sheet Layout */}
        <div className="menu-sheet-wrapper">
          <div className="menu-sheet-header">
            <div className="tag-label">Official Café Tariff</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-espresso)', marginTop: '0.25rem' }}>
              PAUSE COFFEE & EATERY
            </div>
            <div className="menu-sheet-subtitle">
              All extractions calibrated to 0.1g • Prices in Indian Rupees (₹)
            </div>
          </div>

          {groupedCategories.length > 0 ? (
            <div>
              {groupedCategories.map(([category, items]) => (
                <div key={category} className="menu-category-block">
                  <div className="menu-category-title-row">
                    <div className="menu-category-title">{category}</div>
                    {category === 'Sweet Pause' && (
                      <span className="menu-category-note">
                        Available by pre-order after lunch day
                      </span>
                    )}
                    {category === 'Combos' && (
                      <span className="menu-category-note">
                        Beverage + Food Pairing
                      </span>
                    )}
                  </div>

                  <div className="menu-items-list">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="menu-item-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedItem(item)}
                        title="Click to view details"
                      >
                        <div style={{ flex: '1 1 auto', marginRight: 'var(--space-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                            <span className="menu-item-name">{item.name}</span>
                            {item.isFeatured && (
                              <span className="badge badge-parchment" style={{ fontSize: '0.65rem' }}>
                                Signature
                              </span>
                            )}
                          </div>

                          {item.note && (
                            <div className="caption-vintage" style={{ marginTop: '0.15rem', color: 'var(--color-terracotta)' }}>
                              "{item.note}"
                            </div>
                          )}

                          {item.options && item.options.length > 0 && (
                            <div className="menu-item-options-list">
                              {item.options.map((opt, i) => (
                                <span key={i}>
                                  {opt.name}: <strong>₹{opt.price}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="menu-leader-dots" />

                        <div className="menu-price-text">
                          {item.priceDisplay || `₹${item.price}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-espresso)', marginBottom: '0.4rem' }}>
                No items found matching "{searchQuery}"
              </h4>
              <p className="body-small">Try clearing your search query or selecting another category.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'var(--space-md)' }}
              >
                Reset Menu
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-3xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--color-ink-rule)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-brown-muted)' }}>
              "Pause is not lost time. It is how you cherish the moments that truly matter."
            </div>
          </div>
        </div>

        {/* Item Detail Modal */}
        <ItemDetailModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      </div>
    </div>
  );
};
