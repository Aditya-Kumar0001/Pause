import { SiteSettings } from '../types';

export const INITIAL_SETTINGS: SiteSettings = {
  brandName: 'Pause Coffee & Eatery',
  tagline: 'Take a Moment. Have a Coffee. Pause.',
  address: '25JM+HFP, 19, Valluvar Salai, K P Nagar, Andavar Nagar, Chidambaram Nagar, Ramapuram, Chennai, Tamil Nadu 600089',
  phone: '+91 80560 63347',
  email: 'hello@pausecoffee.co',
  instagram: 'https://www.instagram.com/pause.chennai?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==',
  googleMapsUrl: 'https://www.google.com/maps/place/Pause/@13.0312118,80.1833563,18.6z/data=!4m6!3m5!1s0x3a5261001bcfded7:0x9688462fab2ab15b!8m2!3d13.0314803!4d80.1836163!16s%2Fg%2F11zgm5f36g',
  googleMapsEmbedUrl: 'https://maps.google.com/maps?q=13.0314803,80.1836163&hl=en&z=17&output=embed',
  openingHours: {
    weekdays: '08:00 AM – 10:30 PM',
    weekends: '08:30 AM – 11:30 PM',
    holidayHours: '09:00 AM – 10:00 PM'
  },
  heroPunchlines: [
    'A place where you stop for a while.',
    'Slow down. Taste the craft behind the bean.',
    'More than coffee. A quiet pause in a rushing world.',
    'Behind the counter or at the table: Pause with us.'
  ],
  minimumRedemptionBalance: 500,
  visitKinkooReward: 100,
  weeklyGiftKinkoo: 100,
  monthlyVisitRewardThreshold: 6,
  experienceKinkooCost: 600,
  announcementBar: {
    enabled: true,
    text: 'Claim your weekly 100 free Kinkoos in the loyalty portal.',
    linkUrl: '/kinkoos'
  }
};
