import React from 'react';
import { MenuCategoryType } from '../../types';

interface MenuFilterProps {
  categories: (MenuCategoryType | 'All')[];
  selectedCategory: MenuCategoryType | 'All';
  onSelectCategory: (category: MenuCategoryType | 'All') => void;
}

export const MenuFilter: React.FC<MenuFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="menu-nav-tabs" role="tablist" aria-label="Menu categories">
      {categories.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={selectedCategory === cat}
          className={`menu-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
