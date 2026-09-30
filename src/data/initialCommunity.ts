import { CommunityEvent, CommunityPost } from '../types';

export const INITIAL_COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: 'comm-1',
    title: 'Sunday Morning Blind Cupping & Tasting',
    date: '2026-09-06',
    time: '09:30 AM – 11:00 AM',
    location: 'Pause Communal Table',
    description: 'Join our head roaster for a sensory cupping session comparing five unique regional harvests. Taste, score, and discuss notes of stone fruit, bergamot, and chocolate.',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
    capacity: 12,
    rsvpCount: 8,
    isMembersOnly: false,
    status: 'upcoming'
  },
  {
    id: 'comm-2',
    title: 'Writers & Sketchers Quiet Hours',
    date: '2026-09-10',
    time: '05:00 PM – 07:30 PM',
    location: 'The Library Nook at Pause',
    description: 'A distraction-free evening for journaling, novel drafting, and ink illustration. Gentle ambient jazz, soft parchment lighting, and bottomless batch brew.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    capacity: 15,
    rsvpCount: 12,
    isMembersOnly: true,
    status: 'upcoming'
  },
  {
    id: 'comm-3',
    title: 'Latte Art Throwdown: Community Edition',
    date: '2026-09-24',
    time: '06:00 PM – 08:30 PM',
    location: 'Main Bar',
    description: 'Friendly, welcoming pour battle for regular guests and aspiring home baristas. 3 rounds of hearts, tulips, and free pours. Winner takes 1,000 Kinkoos!',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    capacity: 25,
    rsvpCount: 19,
    isMembersOnly: false,
    status: 'upcoming'
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Barista Elena',
    title: 'Why we still weigh every single espresso dose to 0.1g',
    content: 'In an era of speed and instant gratification, we choose the deliberate path. When you step up to our counter, every variable from bean mass to water contact time is treated with quiet respect.',
    date: '2026-08-20',
    likes: 42
  },
  {
    id: 'post-2',
    author: 'Pause Journal',
    title: 'The European café tradition: Why lingering is encouraged',
    content: 'In Vienna, Turin, and Paris, a cup of coffee buys you an afternoon with a book, a conversation with a stranger, or simply the luxury of watching the rain against the window. We built Pause on this exact premise.',
    date: '2026-08-14',
    likes: 67
  }
];
