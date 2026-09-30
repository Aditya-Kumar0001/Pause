import { RewardItem } from '../types';

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew-1',
    title: 'Any Classic Espresso Beverage (Hot or Iced)',
    description: 'Redeem for any Cortado, Cappuccino, Latte, Americano, or Iced Americano hand-crafted at the counter.',
    kinkooCost: 500,
    category: 'Beverage',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    stock: 999
  },
  {
    id: 'rew-2',
    title: 'Behind-The-Bar Coffee Making Experience',
    description: '1 full hands-on coffee-making workshop session. Step behind our bar, calibrate the grinder, and pull your own coffee.',
    kinkooCost: 600,
    category: 'Experience',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isExclusiveExperience: true,
    stock: 50
  },
  {
    id: 'rew-3',
    title: 'Spanish Latte (Iced) or Cold Coffee',
    description: 'Chilled signature cold coffee or sweet Spanish latte prepared with espresso and milk over ice.',
    kinkooCost: 550,
    category: 'Beverage',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    stock: 200
  },
  {
    id: 'rew-4',
    title: 'Fresh Strawberry Thickshake',
    description: 'Rich thickshake crafted with strawberries, chilled cream, and smooth ice cream.',
    kinkooCost: 550,
    category: 'Beverage',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    stock: 120
  },
  {
    id: 'rew-5',
    title: 'Artisanal Bomboloni or Fresh Brownie',
    description: 'Choose any freshly made Bomboloni (Vanilla, Chocolate, Strawberry, or Nutella) or rich chocolate Brownie.',
    kinkooCost: 500,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    stock: 60
  }
];
