import { OfferItem } from '../types';

export const INITIAL_OFFERS: OfferItem[] = [
  {
    id: 'off-1',
    title: 'The Slow Morning Ritual',
    punchline: 'Complimentary single-origin batch brew with any breakfast croissant before 11:00 AM.',
    description: 'Start your day at a gentle pace. Enjoy a warm butter croissant paired with our daily rotating Ethiopian or Colombian drip coffee.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    kinkooRequired: 0,
    badge: 'Morning Special',
    status: 'active',
    terms: [
      'Valid Monday through Friday between 08:00 AM and 11:00 AM.',
      'Dine-in café experience only.',
      'Cannot be combined with other discount codes.'
    ],
    ctaText: 'View Morning Menu'
  },
  {
    id: 'off-2',
    title: 'Community Table Double Kinkoos',
    punchline: 'Earn 200 Kinkoos per verified visit on Community Table Wednesdays.',
    description: 'Sit at our communal pine table, share conversations with fellow neighbors, and receive double loyalty points on your physical visit.',
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=80',
    startDate: '2026-08-15',
    endDate: '2026-10-31',
    kinkooRequired: 0,
    badge: 'Loyalty Boost',
    status: 'active',
    terms: [
      'Valid every Wednesday during café opening hours.',
      'Requires standard staff QR visit verification.',
      'Limit 1 double-points visit per customer per Wednesday.'
    ],
    ctaText: 'Visit on Wednesday'
  },
  {
    id: 'off-3',
    title: 'Artisan Strawberry Shake & Cookie Pair',
    punchline: 'Claim for 750 Kinkoos (Save 150 Kinkoos)',
    description: 'Redeem our signature fresh strawberry cream shake paired with a warm chocolate-chunk sea salt cookie.',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    startDate: '2026-08-20',
    endDate: '2026-09-15',
    kinkooRequired: 750,
    badge: 'Kinkoo Special',
    status: 'active',
    terms: [
      'Requires minimum 500 active Kinkoo balance.',
      'Redeemable in person at the café beverage counter.',
      'Subject to daily fresh strawberry availability.'
    ],
    ctaText: 'Claim in Rewards'
  }
];
