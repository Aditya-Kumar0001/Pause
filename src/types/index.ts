export type UserRole = 'customer' | 'admin' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isFlaggedSpam?: boolean;
}

export type TransactionType =
  | 'VISIT_REWARD'
  | 'WEEKLY_GIFT'
  | 'REDEMPTION'
  | 'ADMIN_ADJUSTMENT'
  | 'REVERSAL'
  | 'BONUS'
  | 'EXPIRATION';

export interface KinkooTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number; // positive = earned, negative = spent
  type: TransactionType;
  description: string;
  referenceId?: string; // e.g. visitId, redemptionId, or admin note
  timestamp: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface KinkooBalanceState {
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  monthlyVisits: number;
  monthlyVisitsTarget: number; // 6
  hasEarnedMonthlyExperience: boolean;
  claimedWeeklyGiftThisWeek: boolean;
}

export type VisitTokenStatus = 'active' | 'used' | 'verified' | 'expired' | 'flagged_spam';

export interface VisitToken {
  token: string;
  userId: string;
  userName: string;
  createdAt: string;
  expiresAt: string;
  status: VisitTokenStatus;
  validationMode?: 'local_fallback';
  verifiedAt?: string;
  verifiedByAdminId?: string;
  notes?: string;
}

export type VisitStatus = 'verified' | 'flagged' | 'reversed' | 'expired' | 'duplicate';

export interface PhysicalVisit {
  id: string;
  userId: string;
  userName: string;
  tokenUsed: string;
  timestamp: string;
  status: VisitStatus;
  kinkoosAwarded: number;
  verifiedByAdminId: string;
  verifiedByAdminName: string;
  notes?: string;
}

export interface WeeklyClaimRecord {
  id: string;
  userId: string;
  weekIdentifier: string; // e.g. "2026-W35"
  amount: number;
  timestamp: string;
}

export type MenuCategoryType =
  | 'Coffee'
  | 'Slow Bar'
  | 'Thickshakes & Non-Coffee'
  | 'Bakery'
  | 'Cold Coffee'
  | 'Mojitos'
  | 'Bites'
  | 'Burgers'
  | 'Wraps'
  | 'Combos'
  | 'Sweet Pause'
  | 'Other';

export interface MenuItemOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceDisplay?: string; // e.g. "Single Shot — ₹89 / Double Shot — ₹119" or "₹199 onwards"
  options?: MenuItemOption[];
  note?: string; // e.g. "Ask your barista about today's selection." or "AVAILABLE BY PRE-ORDER AFTER LUNCH DAY"
  kinkooValue: number; // Kinkoos needed to redeem or 0 if not redeemable
  category: MenuCategoryType;
  image?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryTags?: string[];
  sortOrder: number;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  kinkooCost: number;
  category: string;
  image: string;
  isAvailable: boolean;
  stock?: number;
  isExclusiveExperience?: boolean;
}

export type RedemptionStatus = 'issued' | 'verified_consumed' | 'cancelled' | 'expired';

export interface RedemptionRecord {
  id: string;
  code: string; // short unique code e.g. "RW-8492"
  rewardId: string;
  rewardTitle: string;
  kinkooCost: number;
  userId: string;
  userName: string;
  status: RedemptionStatus;
  createdAt: string;
  consumedAt?: string;
  consumedByAdminId?: string;
  expiresAt: string;
}

export interface ExperienceSlot {
  id: string;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM - 11:30 AM"
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  kinkooRequired: number; // e.g. 600
  isEligibleForFreeMonthly: boolean;
  status: 'open' | 'fully_booked' | 'completed' | 'cancelled';
  description: string;
  curriculum: string[];
}

export interface ExperienceBooking {
  id: string;
  slotId: string;
  slotTitle: string;
  slotDate: string;
  slotTime: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  kinkooSpent: number;
  isMonthlyRewardRedemption: boolean;
  status: 'confirmed' | 'cancelled' | 'attended';
  createdAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  punchline: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  kinkooRequired: number;
  badge: string;
  status: 'active' | 'scheduled' | 'expired' | 'archived';
  terms: string[];
  ctaText: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  capacity: number;
  rsvpCount: number;
  isMembersOnly: boolean;
  status: 'upcoming' | 'sold_out' | 'completed' | 'cancelled';
}

export interface CommunityPost {
  id: string;
  author: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  likes: number;
}

export interface CommunityContact {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export type FinanceType = 'revenue' | 'expense';
export type FinanceCategory =
  | 'Beverages'
  | 'Coffee Beans'
  | 'Workshops'
  | 'Bakery & Sides'
  | 'Equipment & Maintenance'
  | 'Packaging & Supplies'
  | 'Utilities & Rent'
  | 'Staff & Wages'
  | 'Marketing'
  | 'Other';

export interface FinanceTransaction {
  id: string;
  date: string;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  description: string;
  paymentMethod: 'Cash' | 'Card' | 'UPI / Online' | 'Bank Transfer';
  reference?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  googleMapsUrl?: string;
  googleMapsEmbedUrl?: string;
  openingHours: {
    weekdays: string;
    weekends: string;
    holidayHours: string;
  };
  heroPunchlines: string[];
  minimumRedemptionBalance: number; // 500
  visitKinkooReward: number; // 100
  weeklyGiftKinkoo: number; // 100
  monthlyVisitRewardThreshold: number; // 6
  experienceKinkooCost: number; // 600
  announcementBar: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
  };
}
