import { MenuItem } from '../types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // =========================================================================
  // 1. COFFEE
  // =========================================================================
  {
    id: 'm-coffee-1',
    name: 'Espresso',
    price: 89,
    priceDisplay: 'Single Shot ₹89 / Double Shot ₹119',
    options: [
      { name: 'Single Shot', price: 89 },
      { name: 'Double Shot', price: 119 }
    ],
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    id: 'm-coffee-2',
    name: 'Cortado',
    price: 120,
    priceDisplay: '₹120',
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 2
  },
  {
    id: 'm-coffee-3',
    name: 'Americano',
    price: 130,
    priceDisplay: '₹130',
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 3
  },
  {
    id: 'm-coffee-4',
    name: 'Iced Americano',
    price: 140,
    priceDisplay: '₹140',
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 4
  },
  {
    id: 'm-coffee-5',
    name: 'Cappuccino',
    price: 170,
    priceDisplay: '₹170',
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 5
  },
  {
    id: 'm-coffee-6',
    name: 'Latte',
    price: 180,
    priceDisplay: '₹180',
    kinkooValue: 500,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 6
  },
  {
    id: 'm-coffee-7',
    name: 'Mocha',
    price: 200,
    priceDisplay: '₹200',
    kinkooValue: 550,
    category: 'Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 7
  },

  // =========================================================================
  // 2. SLOW BAR
  // =========================================================================
  {
    id: 'm-slow-1',
    name: 'Hand-Brewed Coffee (V60 / AeroPress)',
    price: 199,
    priceDisplay: '₹199 onwards',
    note: "Ask your barista about today's selection.",
    options: [
      { name: 'V60 Pour-Over', price: 199 },
      { name: 'AeroPress', price: 199 }
    ],
    kinkooValue: 600,
    category: 'Slow Bar',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 8
  },

  // =========================================================================
  // 3. THICKSHAKES & NON-COFFEE
  // =========================================================================
  {
    id: 'm-shake-1',
    name: 'Chocolate Thickshake',
    price: 190,
    priceDisplay: '₹190',
    kinkooValue: 550,
    category: 'Thickshakes & Non-Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 9
  },
  {
    id: 'm-shake-2',
    name: 'Strawberry Thickshake',
    price: 190,
    priceDisplay: '₹190',
    kinkooValue: 550,
    category: 'Thickshakes & Non-Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 10
  },
  {
    id: 'm-shake-3',
    name: 'Oreo Thickshake',
    price: 200,
    priceDisplay: '₹200',
    kinkooValue: 550,
    category: 'Thickshakes & Non-Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 11
  },
  {
    id: 'm-shake-4',
    name: 'Brownie Thickshake',
    price: 220,
    priceDisplay: '₹220',
    kinkooValue: 600,
    category: 'Thickshakes & Non-Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 12
  },
  {
    id: 'm-shake-5',
    name: 'Hot Chocolate',
    price: 240,
    priceDisplay: '₹240',
    kinkooValue: 600,
    category: 'Thickshakes & Non-Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 13
  },

  // =========================================================================
  // 4. BAKERY
  // =========================================================================
  {
    id: 'm-bake-1',
    name: 'Brownie',
    price: 120,
    priceDisplay: '₹120',
    kinkooValue: 500,
    category: 'Bakery',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 14
  },

  // =========================================================================
  // 5. COLD COFFEE
  // =========================================================================
  {
    id: 'm-cold-1',
    name: 'Spanish Latte (Iced)',
    price: 200,
    priceDisplay: '₹200',
    kinkooValue: 550,
    category: 'Cold Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 15
  },
  {
    id: 'm-cold-2',
    name: 'Iced Mocha',
    price: 220,
    priceDisplay: '₹220',
    kinkooValue: 600,
    category: 'Cold Coffee',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 16
  },
  {
    id: 'm-cold-3',
    name: 'Cold Coffee',
    price: 180,
    priceDisplay: '₹180',
    kinkooValue: 500,
    category: 'Cold Coffee',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 17
  },

  // =========================================================================
  // 6. MOJITOS
  // =========================================================================
  {
    id: 'm-moj-1',
    name: 'Blue Curacao Mojito',
    price: 99,
    priceDisplay: '₹99',
    kinkooValue: 500,
    category: 'Mojitos',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 18
  },
  {
    id: 'm-moj-2',
    name: 'Lime & Mint Mojito',
    price: 99,
    priceDisplay: '₹99',
    kinkooValue: 500,
    category: 'Mojitos',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 19
  },

  // =========================================================================
  // 7. BITES
  // =========================================================================
  {
    id: 'm-bite-1',
    name: 'Cheese Loaded Fries',
    price: 160,
    priceDisplay: '₹160',
    kinkooValue: 500,
    category: 'Bites',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 20
  },
  {
    id: 'm-bite-2',
    name: 'Chicken Loaded Fries (Nashville / Korean)',
    price: 220,
    priceDisplay: 'Nashville ₹220 / Korean ₹230',
    options: [
      { name: 'Nashville', price: 220 },
      { name: 'Korean', price: 230 }
    ],
    kinkooValue: 600,
    category: 'Bites',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 21
  },
  {
    id: 'm-bite-3',
    name: 'Chicken Wings',
    price: 150,
    priceDisplay: '₹150',
    kinkooValue: 500,
    category: 'Bites',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 22
  },

  // =========================================================================
  // 8. BURGERS
  // =========================================================================
  {
    id: 'm-burg-1',
    name: 'Chicken Burger',
    price: 240,
    priceDisplay: '₹240',
    kinkooValue: 650,
    category: 'Burgers',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 23
  },
  {
    id: 'm-burg-2',
    name: 'Paneer Burger',
    price: 200,
    priceDisplay: '₹200',
    kinkooValue: 550,
    category: 'Burgers',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 24
  },

  // =========================================================================
  // 9. WRAPS
  // =========================================================================
  {
    id: 'm-wrap-1',
    name: 'Chicken Wrap',
    price: 200,
    priceDisplay: '₹200',
    kinkooValue: 550,
    category: 'Wraps',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 25
  },
  {
    id: 'm-wrap-2',
    name: 'Paneer Wrap',
    price: 180,
    priceDisplay: '₹180',
    kinkooValue: 500,
    category: 'Wraps',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 26
  },

  // =========================================================================
  // 10. COMBOS
  // =========================================================================
  {
    id: 'm-combo-1',
    name: 'Chicken Burger + Mojito Combo',
    price: 249,
    priceDisplay: '₹249',
    note: 'BURGER + MOJITO',
    kinkooValue: 650,
    category: 'Combos',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 27
  },
  {
    id: 'm-combo-2',
    name: 'Paneer Burger + Mojito Combo',
    price: 229,
    priceDisplay: '₹229',
    note: 'BURGER + MOJITO',
    kinkooValue: 600,
    category: 'Combos',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 28
  },
  {
    id: 'm-combo-3',
    name: 'Chicken Wrap + Mojito Combo',
    price: 249,
    priceDisplay: '₹249',
    note: 'WRAP + MOJITO',
    kinkooValue: 650,
    category: 'Combos',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 29
  },
  {
    id: 'm-combo-4',
    name: 'Paneer Wrap + Mojito Combo',
    price: 229,
    priceDisplay: '₹229',
    note: 'WRAP + MOJITO',
    kinkooValue: 600,
    category: 'Combos',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 30
  },

  // =========================================================================
  // 11. SWEET PAUSE
  // =========================================================================
  {
    id: 'm-sweet-1',
    name: 'Vanilla Bomboloni',
    price: 160,
    priceDisplay: '₹160',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 500,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 31
  },
  {
    id: 'm-sweet-2',
    name: 'Chocolate Bomboloni',
    price: 180,
    priceDisplay: '₹180',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 500,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 32
  },
  {
    id: 'm-sweet-3',
    name: 'Strawberry Bomboloni',
    price: 190,
    priceDisplay: '₹190',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 500,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 33
  },
  {
    id: 'm-sweet-4',
    name: 'Nutella Bomboloni',
    price: 190,
    priceDisplay: '₹190',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 500,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 34
  },
  {
    id: 'm-sweet-5',
    name: 'Tiramisu (60 g)',
    price: 100,
    priceDisplay: '₹100',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 500,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: true,
    sortOrder: 35
  },
  {
    id: 'm-sweet-6',
    name: 'Coconut Mousse',
    price: 220,
    priceDisplay: '₹220',
    note: 'AVAILABLE BY PRE-ORDER AFTER LUNCH DAY',
    kinkooValue: 550,
    category: 'Sweet Pause',
    isAvailable: true,
    isFeatured: false,
    sortOrder: 36
  }
];
