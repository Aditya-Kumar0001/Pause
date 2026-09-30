import { ExperienceSlot } from '../types';

export const INITIAL_EXPERIENCE_SLOTS: ExperienceSlot[] = [
  {
    id: 'exp-1',
    title: 'The Art of the Pull: Espresso & Extraction Craft',
    subtitle: 'Behind-the-bar hands-on espresso workshop',
    date: '2026-09-05',
    time: '10:00 AM – 11:30 AM',
    durationMinutes: 90,
    capacity: 4,
    bookedCount: 2,
    kinkooRequired: 600,
    isEligibleForFreeMonthly: true,
    status: 'open',
    description: 'Step behind our espresso bar during calm morning hours. Dial in the grinder, calibrate extraction weight, steam glossy microfoam, and pour your own cortado or flat white under one-on-one barista guidance.',
    curriculum: [
      'Understanding bean origin, roast profiles, and degassing',
      'Dialing in the commercial grinder: grind size, dose, and channeling',
      'Portafilter distribution, tamping pressure, and extraction timing',
      'Milk steaming physics: vortex formation and microfoam texturing',
      'Latte art foundation: the heart and the rosetta',
      'Tasting and sensory evaluation of your own pulls'
    ]
  },
  {
    id: 'exp-2',
    title: 'Manual Alchemy: Pour-Over & Filter Geometries',
    subtitle: 'V60, Aeropress & Chemex hand-brew lab',
    date: '2026-09-12',
    time: '04:00 PM – 05:30 PM',
    durationMinutes: 90,
    capacity: 6,
    bookedCount: 3,
    kinkooRequired: 600,
    isEligibleForFreeMonthly: true,
    status: 'open',
    description: 'Explore the nuances of water temperature, pour speed, and filter geometry. Brew three distinct single origins using the V60, Aeropress, and Kalita Wave.',
    curriculum: [
      'Water chemistry basics and brew ratio calculations (1:15 to 1:17)',
      'The blooming stage: degassing and saturation dynamics',
      'Kettle control: concentric circular pours vs center pulses',
      'Comparative cupping: tasting how brewing variables alter acidity and sweetness',
      'Take home your custom brew guide and 100g sample beans'
    ]
  },
  {
    id: 'exp-3',
    title: 'Cold Brew & Botanical Infusions Laboratory',
    subtitle: 'Slow extraction, nitro, and herb pairings',
    date: '2026-09-19',
    time: '11:00 AM – 12:30 PM',
    durationMinutes: 90,
    capacity: 4,
    bookedCount: 1,
    kinkooRequired: 600,
    isEligibleForFreeMonthly: true,
    status: 'open',
    description: 'A masterclass in slow cold extractions. Learn how to steep coffee without heat, balance botanical syrups, and craft signature café mocktails.',
    curriculum: [
      'Immersion cold brew vs slow drip Dutch coffee towers',
      'Crafting simple syrups: cardamom, orange peel, and toasted rosemary',
      'Balancing tonic and sparkling effervescence with espresso floats',
      'Blending and bottling your own signature 250ml cold brew concentrate'
    ]
  }
];
