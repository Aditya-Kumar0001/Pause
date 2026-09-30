import {
  AuditLog,
  CommunityContact,
  CommunityEvent,
  CommunityPost,
  ExperienceBooking,
  ExperienceSlot,
  FinanceTransaction,
  MenuItem,
  OfferItem,
  RedemptionRecord,
  RewardItem,
  SiteSettings,
  UserProfile
} from '../types';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { INITIAL_MENU_ITEMS } from '../data/initialMenu';
import { INITIAL_EXPERIENCE_SLOTS } from '../data/initialExperiences';
import { INITIAL_OFFERS } from '../data/initialOffers';
import { INITIAL_REWARDS } from '../data/initialRewards';
import { INITIAL_COMMUNITY_EVENTS, INITIAL_COMMUNITY_POSTS } from '../data/initialCommunity';
import { INITIAL_SETTINGS } from '../data/initialSettings';
import { storageService } from './storageService';
import { ledgerService } from './ledgerService';
import { visitTokenService } from './visitTokenService';

// Storage Keys (v2 for accurate official menu)
const MENU_KEY = 'pause_menu_items_v2';
const REWARDS_KEY = 'pause_rewards_catalog_v2';
const REDEMPTIONS_KEY = 'pause_redemptions_history_v2';
const EXPERIENCE_SLOTS_KEY = 'pause_experience_slots_v2';
const EXPERIENCE_BOOKINGS_KEY = 'pause_experience_bookings_v2';
const OFFERS_KEY = 'pause_offers_list_v2';
const COMMUNITY_EVENTS_KEY = 'pause_community_events_v2';
const COMMUNITY_POSTS_KEY = 'pause_community_posts_v2';
const COMMUNITY_CONTACTS_KEY = 'pause_community_contacts_v1';
const FINANCE_KEY = 'pause_finance_transactions_v2';
const AUDIT_LOGS_KEY = 'pause_audit_logs_v2';
const SETTINGS_KEY = 'pause_site_settings_v2';
const CUSTOMERS_KEY = 'pause_customer_profiles_v2';

export interface PublicSiteContent {
  menuItems: MenuItem[];
  rewards: RewardItem[];
  experienceSlots: ExperienceSlot[];
  offers: OfferItem[];
  communityEvents: CommunityEvent[];
  communityPosts: CommunityPost[];
  settings: SiteSettings;
}

const INITIAL_FINANCE: FinanceTransaction[] = [
  {
    id: 'fin-1',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    type: 'revenue',
    category: 'Beverages',
    amount: 14500,
    description: 'Daily espresso bar & specialty beverages sales',
    paymentMethod: 'UPI / Online'
  },
  {
    id: 'fin-2',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    type: 'revenue',
    category: 'Workshops',
    amount: 3600,
    description: 'Manual brew workshop booking seats',
    paymentMethod: 'Card'
  },
  {
    id: 'fin-3',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    type: 'expense',
    category: 'Coffee Beans',
    amount: 8500,
    description: 'Single origin green coffee bags from Coorg estate',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: 'fin-4',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    type: 'expense',
    category: 'Packaging & Supplies',
    amount: 2400,
    description: 'Recycled parchment cups and kraft paper sleeves',
    paymentMethod: 'Card'
  }
];

const INITIAL_CUSTOMERS: UserProfile[] = [
  {
    id: 'usr-default-1',
    name: 'Arjun Mehta',
    email: 'arjun@pausecraft.com',
    phone: '+91 98450 12345',
    role: 'customer',
    createdAt: '2026-07-01T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'usr-cust-2',
    name: 'Maya Rao',
    email: 'maya.rao@designst.io',
    phone: '+91 99001 22334',
    role: 'customer',
    createdAt: '2026-07-15T14:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'usr-cust-3',
    name: 'Vikram Sengupta',
    email: 'vikram.s@architects.co',
    phone: '+91 98822 55441',
    role: 'customer',
    createdAt: '2026-08-01T09:15:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  }
];

class DataService {
  getPublicSiteContent(): PublicSiteContent {
    return {
      menuItems: this.getMenuItems(),
      rewards: this.getRewards(),
      experienceSlots: this.getExperienceSlots(),
      offers: this.getOffers(),
      communityEvents: this.getCommunityEvents(),
      communityPosts: this.getCommunityPosts(),
      settings: this.getSettings()
    };
  }

  async syncPublicSiteContent(): Promise<void> {
    if (!db) throw new Error('Firebase is not configured.');
    const content = JSON.parse(JSON.stringify(this.getPublicSiteContent())) as PublicSiteContent;
    await setDoc(doc(db, 'site_content', 'public'), content);
  }

  cachePublicSiteContent(content: Partial<PublicSiteContent>): void {
    const cache = <T,>(key: string, value: T | undefined) => {
      if (value === undefined) return;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Could not cache shared site content for ${key}.`, error);
      }
    };

    cache(MENU_KEY, content.menuItems);
    cache(REWARDS_KEY, content.rewards);
    cache(EXPERIENCE_SLOTS_KEY, content.experienceSlots);
    cache(OFFERS_KEY, content.offers);
    cache(COMMUNITY_EVENTS_KEY, content.communityEvents);
    cache(COMMUNITY_POSTS_KEY, content.communityPosts);
    cache(SETTINGS_KEY, content.settings);
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  getAuditLogs(): AuditLog[] {
    return storageService
      .getItem<AuditLog[]>(AUDIT_LOGS_KEY, [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  logAction(
    adminId: string,
    adminName: string,
    action: string,
    entity: string,
    entityId: string,
    previousValue?: string,
    newValue?: string,
    reason?: string
  ): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      adminId,
      adminName,
      action,
      entity,
      entityId,
      previousValue,
      newValue,
      reason,
      timestamp: new Date().toISOString()
    };
    const logs = this.getAuditLogs();
    logs.push(log);
    storageService.setItem(AUDIT_LOGS_KEY, logs);
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  getCustomers(): UserProfile[] {
    return storageService.getItem<UserProfile[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
  }

  updateCustomer(adminId: string, adminName: string, customerId: string, updates: Partial<UserProfile>, reason?: string): void {
    const list = this.getCustomers();
    const index = list.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      const prev = JSON.stringify(list[index]);
      list[index] = { ...list[index], ...updates };
      storageService.setItem(CUSTOMERS_KEY, list);
      this.logAction(adminId, adminName, 'UPDATE_CUSTOMER', 'Customer', customerId, prev, JSON.stringify(list[index]), reason);
    }
  }

  // ==========================================
  // MENU
  // ==========================================
  getMenuItems(): MenuItem[] {
    return storageService.getItem<MenuItem[]>(MENU_KEY, INITIAL_MENU_ITEMS);
  }

  saveMenuItem(adminId: string, adminName: string, item: MenuItem): void {
    const items = this.getMenuItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      const prev = JSON.stringify(items[index]);
      items[index] = item;
      this.logAction(adminId, adminName, 'UPDATE_MENU_ITEM', 'MenuItem', item.id, prev, JSON.stringify(item));
    } else {
      items.push(item);
      this.logAction(adminId, adminName, 'CREATE_MENU_ITEM', 'MenuItem', item.id, undefined, JSON.stringify(item));
    }
    storageService.setItem(MENU_KEY, items);
  }

  deleteMenuItem(adminId: string, adminName: string, itemId: string): void {
    const items = this.getMenuItems();
    const index = items.findIndex((i) => i.id === itemId);
    if (index !== -1) {
      const prev = JSON.stringify(items[index]);
      items.splice(index, 1);
      storageService.setItem(MENU_KEY, items);
      this.logAction(adminId, adminName, 'DELETE_MENU_ITEM', 'MenuItem', itemId, prev, undefined);
    }
  }

  // ==========================================
  // REWARDS & REDEMPTIONS
  // ==========================================
  getRewards(): RewardItem[] {
    return storageService.getItem<RewardItem[]>(REWARDS_KEY, INITIAL_REWARDS);
  }

  cacheRewardCatalog(rewards: RewardItem[]): void {
    try {
      localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
    } catch (error) {
      console.error('Could not cache the local reward catalogue.', error);
    }
  }

  saveRewardItem(adminId: string, adminName: string, reward: RewardItem): void {
    const rewards = this.getRewards();
    const index = rewards.findIndex((r) => r.id === reward.id);
    if (index !== -1) {
      const prev = JSON.stringify(rewards[index]);
      rewards[index] = reward;
      this.logAction(adminId, adminName, 'UPDATE_REWARD', 'Reward', reward.id, prev, JSON.stringify(reward));
    } else {
      rewards.push(reward);
      this.logAction(adminId, adminName, 'CREATE_REWARD', 'Reward', reward.id, undefined, JSON.stringify(reward));
    }
    storageService.setItem(REWARDS_KEY, rewards);
  }

  deleteRewardItem(adminId: string, adminName: string, rewardId: string): void {
    const rewards = this.getRewards();
    const index = rewards.findIndex((r) => r.id === rewardId);
    if (index !== -1) {
      const prev = JSON.stringify(rewards[index]);
      rewards.splice(index, 1);
      storageService.setItem(REWARDS_KEY, rewards);
      this.logAction(adminId, adminName, 'DELETE_REWARD', 'Reward', rewardId, prev, undefined);
    }
  }

  getRedemptions(): RedemptionRecord[] {
    return storageService
      .getItem<RedemptionRecord[]>(REDEMPTIONS_KEY, [])
      .map((record) => {
        if (record.status !== 'verified_consumed' && record.status !== 'cancelled' && new Date(record.expiresAt).getTime() < Date.now()) {
          return { ...record, status: 'expired' as const };
        }
        return record;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Redeem reward with strict business rules:
   * 1. Minimum 500 Kinkoo balance rule
   * 2. Atomic deduction from ledger
   * 3. Voucher generation with expiry
   */
  claimReward(
    userId: string,
    userName: string,
    rewardId: string
  ): Promise<{ success: boolean; redemption?: RedemptionRecord; error?: string }> {
    void userName;
    if (!userId || userId === 'guest') {
      return Promise.resolve({ success: false, error: 'Sign in to redeem rewards.' });
    }
    return visitTokenService.redeemReward(rewardId);
  }

  consumeRedemptionVoucher(
    adminId: string,
    adminName: string,
    voucherCode: string
  ): Promise<{ success: boolean; redemption?: RedemptionRecord; error?: string }> {
    void adminId;
    void adminName;
    return visitTokenService.consumeRewardVoucher(voucherCode);
  }

  // ==========================================
  // EXPERIENCES
  // ==========================================
  getExperienceSlots(): ExperienceSlot[] {
    return storageService.getItem<ExperienceSlot[]>(EXPERIENCE_SLOTS_KEY, INITIAL_EXPERIENCE_SLOTS);
  }

  cacheExperienceSlot(slot: ExperienceSlot): void {
    const slots = this.getExperienceSlots();
    const index = slots.findIndex((item) => item.id === slot.id);
    if (index >= 0) slots[index] = slot;
    else slots.push(slot);
    storageService.setItem(EXPERIENCE_SLOTS_KEY, slots);
  }

  saveExperienceSlot(adminId: string, adminName: string, slot: ExperienceSlot): void {
    const slots = this.getExperienceSlots();
    const index = slots.findIndex((s) => s.id === slot.id);
    if (index !== -1) {
      const prev = JSON.stringify(slots[index]);
      slots[index] = slot;
      this.logAction(adminId, adminName, 'UPDATE_EXPERIENCE_SLOT', 'ExperienceSlot', slot.id, prev, JSON.stringify(slot));
    } else {
      slots.push(slot);
      this.logAction(adminId, adminName, 'CREATE_EXPERIENCE_SLOT', 'ExperienceSlot', slot.id, undefined, JSON.stringify(slot));
    }
    storageService.setItem(EXPERIENCE_SLOTS_KEY, slots);
  }

  deleteExperienceSlot(adminId: string, adminName: string, slotId: string): void {
    const slots = this.getExperienceSlots();
    const index = slots.findIndex((s) => s.id === slotId);
    if (index !== -1) {
      const prev = JSON.stringify(slots[index]);
      slots.splice(index, 1);
      storageService.setItem(EXPERIENCE_SLOTS_KEY, slots);
      this.logAction(adminId, adminName, 'DELETE_EXPERIENCE_SLOT', 'ExperienceSlot', slotId, prev, undefined);
    }
  }

  cancelExperienceBooking(
    adminId: string,
    adminName: string,
    bookingId: string,
    refundKinkoos = true
  ): Promise<{ success: boolean; error?: string }> {
    void adminId;
    void adminName;
    return visitTokenService.cancelExperienceBooking(bookingId, refundKinkoos);
  }

  getExperienceBookings(): ExperienceBooking[] {
    return storageService
      .getItem<ExperienceBooking[]>(EXPERIENCE_BOOKINGS_KEY, [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  bookExperienceSlot(
    userId: string,
    userName: string,
    userEmail: string,
    userPhone: string,
    slotId: string,
    useMonthlyVisitReward: boolean
  ): Promise<{ success: boolean; booking?: ExperienceBooking; error?: string }> {
    if (!userId || userId === 'guest') {
      return Promise.resolve({ success: false, error: 'Sign in to reserve an experience.' });
    }
    void userName;
    void userEmail;
    return visitTokenService.bookExperience(slotId, userPhone, useMonthlyVisitReward);
  }

  // ==========================================
  // OFFERS
  // ==========================================
  getOffers(): OfferItem[] {
    return storageService.getItem<OfferItem[]>(OFFERS_KEY, INITIAL_OFFERS);
  }

  saveOffer(adminId: string, adminName: string, offer: OfferItem): void {
    const offers = this.getOffers();
    const index = offers.findIndex((o) => o.id === offer.id);
    if (index !== -1) {
      const prev = JSON.stringify(offers[index]);
      offers[index] = offer;
      this.logAction(adminId, adminName, 'UPDATE_OFFER', 'Offer', offer.id, prev, JSON.stringify(offer));
    } else {
      offers.push(offer);
      this.logAction(adminId, adminName, 'CREATE_OFFER', 'Offer', offer.id, undefined, JSON.stringify(offer));
    }
    storageService.setItem(OFFERS_KEY, offers);
  }

  deleteOffer(adminId: string, adminName: string, offerId: string): void {
    const offers = this.getOffers();
    const index = offers.findIndex((o) => o.id === offerId);
    if (index !== -1) {
      const prev = JSON.stringify(offers[index]);
      offers.splice(index, 1);
      storageService.setItem(OFFERS_KEY, offers);
      this.logAction(adminId, adminName, 'DELETE_OFFER', 'Offer', offerId, prev, undefined);
    }
  }

  // ==========================================
  // COMMUNITY
  // ==========================================
  getCommunityEvents(): CommunityEvent[] {
    return storageService.getItem<CommunityEvent[]>(COMMUNITY_EVENTS_KEY, INITIAL_COMMUNITY_EVENTS);
  }

  saveCommunityEvent(adminId: string, adminName: string, event: CommunityEvent): void {
    const events = this.getCommunityEvents();
    const index = events.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      const prev = JSON.stringify(events[index]);
      events[index] = event;
      this.logAction(adminId, adminName, 'UPDATE_COMMUNITY_EVENT', 'CommunityEvent', event.id, prev, JSON.stringify(event));
    } else {
      events.push(event);
      this.logAction(adminId, adminName, 'CREATE_COMMUNITY_EVENT', 'CommunityEvent', event.id, undefined, JSON.stringify(event));
    }
    storageService.setItem(COMMUNITY_EVENTS_KEY, events);
  }

  deleteCommunityEvent(adminId: string, adminName: string, eventId: string): void {
    const events = this.getCommunityEvents();
    const index = events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      const prev = JSON.stringify(events[index]);
      events.splice(index, 1);
      storageService.setItem(COMMUNITY_EVENTS_KEY, events);
      this.logAction(adminId, adminName, 'DELETE_COMMUNITY_EVENT', 'CommunityEvent', eventId, prev, undefined);
    }
  }

  getCommunityPosts(): CommunityPost[] {
    return storageService.getItem<CommunityPost[]>(COMMUNITY_POSTS_KEY, INITIAL_COMMUNITY_POSTS);
  }

  saveCommunityPost(adminId: string, adminName: string, post: CommunityPost): void {
    const posts = this.getCommunityPosts();
    const index = posts.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      const prev = JSON.stringify(posts[index]);
      posts[index] = post;
      this.logAction(adminId, adminName, 'UPDATE_COMMUNITY_POST', 'CommunityPost', post.id, prev, JSON.stringify(post));
    } else {
      posts.push(post);
      this.logAction(adminId, adminName, 'CREATE_COMMUNITY_POST', 'CommunityPost', post.id, undefined, JSON.stringify(post));
    }
    storageService.setItem(COMMUNITY_POSTS_KEY, posts);
  }

  deleteCommunityPost(adminId: string, adminName: string, postId: string): void {
    const posts = this.getCommunityPosts();
    const index = posts.findIndex((p) => p.id === postId);
    if (index !== -1) {
      const prev = JSON.stringify(posts[index]);
      posts.splice(index, 1);
      storageService.setItem(COMMUNITY_POSTS_KEY, posts);
      this.logAction(adminId, adminName, 'DELETE_COMMUNITY_POST', 'CommunityPost', postId, prev, undefined);
    }
  }

  getCommunityContacts(): CommunityContact[] {
    return storageService
      .getItem<CommunityContact[]>(COMMUNITY_CONTACTS_KEY, [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addCommunityContact(contact: CommunityContact): Promise<{ success: boolean; error?: string }> {
    if (!contact.userId || contact.userId === 'guest') {
      return { success: false, error: 'Sign in to join the Pause Community.' };
    }

    const contacts = this.getCommunityContacts();
    const email = contact.email.trim().toLowerCase();

    if (contacts.some((existingContact) => existingContact.email.toLowerCase() === email)) {
      return { success: false, error: 'This email is already part of the Pause Community.' };
    }

    const nextContact = { ...contact, id: contact.id || `community-contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, email, createdAt: contact.createdAt || new Date().toISOString() };
    if (db) {
      try {
        await setDoc(doc(db, 'community_members', nextContact.id), {
          ...nextContact,
          source: 'community_page',
          status: 'new',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Could not save community membership request to Firestore.', error);
        const code = (error as { code?: string })?.code;
        const message = code === 'permission-denied'
          ? 'Firebase denied this request. Deploy the updated Firestore rules for community_members, then try again.'
          : code === 'unavailable' || code === 'network-request-failed'
            ? 'Firebase is unavailable. Check your connection and try again.'
            : `Could not save to Firebase${code ? ` (${code})` : ''}. Please try again.`;
        return { success: false, error: message };
      }
    } else {
      return { success: false, error: 'Firebase is not configured for this app.' };
    }

    contacts.unshift(nextContact);
    storageService.setItem(COMMUNITY_CONTACTS_KEY, contacts);
    return { success: true };
  }

  rsvpCommunityEvent(eventId: string, userId: string): { success: boolean; error?: string } {
    if (!userId || userId === 'guest') {
      return { success: false, error: 'Sign in to RSVP to community events.' };
    }

    const events = this.getCommunityEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return { success: false, error: 'Event not found' };
    if (event.rsvpCount >= event.capacity) return { success: false, error: 'Event at full capacity' };

    event.rsvpCount += 1;
    storageService.setItem(COMMUNITY_EVENTS_KEY, events);
    return { success: true };
  }

  // ==========================================
  // FINANCE
  // ==========================================
  getFinanceTransactions(): FinanceTransaction[] {
    return storageService
      .getItem<FinanceTransaction[]>(FINANCE_KEY, INITIAL_FINANCE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addFinanceTransaction(adminId: string, adminName: string, transaction: FinanceTransaction): void {
    const transactions = this.getFinanceTransactions();
    transactions.push(transaction);
    storageService.setItem(FINANCE_KEY, transactions);
    this.logAction(
      adminId,
      adminName,
      'ADD_FINANCE_TRANSACTION',
      'Finance',
      transaction.id,
      undefined,
      JSON.stringify(transaction)
    );
  }

  deleteFinanceTransaction(adminId: string, adminName: string, transactionId: string): void {
    const transactions = this.getFinanceTransactions();
    const index = transactions.findIndex((t) => t.id === transactionId);
    if (index !== -1) {
      const prev = JSON.stringify(transactions[index]);
      transactions.splice(index, 1);
      storageService.setItem(FINANCE_KEY, transactions);
      this.logAction(
        adminId,
        adminName,
        'DELETE_FINANCE_TRANSACTION',
        'Finance',
        transactionId,
        prev,
        undefined,
        'Transaction voided by staff'
      );
    }
  }

  // ==========================================
  // SITE SETTINGS
  // ==========================================
  getSettings(): SiteSettings {
    const settings = storageService.getItem<SiteSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    if (settings.heroPunchlines) {
      settings.heroPunchlines = settings.heroPunchlines.map((p) =>
        p.replace(/^\[.*?—\s*/, '').replace(/\]$/, '').trim()
      );
    }
    if (settings.phone && settings.phone.includes('[CAFE PHONE')) {
      settings.phone = INITIAL_SETTINGS.phone;
    }
    if (settings.instagram && (settings.instagram.includes('@pausecoffee') || settings.instagram.includes('[INSTAGRAM'))) {
      settings.instagram = INITIAL_SETTINGS.instagram;
    }
    if (!settings.address || settings.address.includes('[CAFE ADDRESS') || settings.address === 'Pause Coffee & Eatery, Chennai') {
      settings.address = INITIAL_SETTINGS.address;
    }
    if (!settings.googleMapsUrl) {
      settings.googleMapsUrl = INITIAL_SETTINGS.googleMapsUrl;
    }
    if (!settings.googleMapsEmbedUrl) {
      settings.googleMapsEmbedUrl = INITIAL_SETTINGS.googleMapsEmbedUrl;
    }
    return settings;
  }

  updateSettings(adminId: string, adminName: string, newSettings: SiteSettings): void {
    const prev = JSON.stringify(this.getSettings());
    storageService.setItem(SETTINGS_KEY, newSettings);
    this.logAction(adminId, adminName, 'UPDATE_SETTINGS', 'Settings', 'global', prev, JSON.stringify(newSettings));
  }

  // ==========================================
  // ZERO-OUT & FACTORY RESET (100% TRACEABLE)
  // ==========================================
  async purgeAllDataToZero(adminId: string, adminName: string): Promise<void> {
    // 1. Purge financial transactions
    storageService.setItem(FINANCE_KEY, []);
    // 2. Purge vouchers & redemptions
    storageService.setItem(REDEMPTIONS_KEY, []);
    // 3. Purge bookings and reset slot booked counts to 0
    storageService.setItem(EXPERIENCE_BOOKINGS_KEY, []);
    const slots = this.getExperienceSlots().map((s) => ({
      ...s,
      bookedCount: 0,
      status: 'open' as const
    }));
    storageService.setItem(EXPERIENCE_SLOTS_KEY, slots);
    // 4. Purge ledger, weekly claims, and monthly visits to 0
    ledgerService.purgeLedger();
    // 5. Purge visit tokens and visit history to 0
    await visitTokenService.purgeVisitsAndTokens();
    // 6. Reset community RSVPs to 0
    const events = this.getCommunityEvents().map((e) => ({
      ...e,
      rsvpCount: 0
    }));
    storageService.setItem(COMMUNITY_EVENTS_KEY, events);
    // 7. Fresh traceable audit log marking the zero-out operation
    const purgeAuditLog: AuditLog = {
      id: `audit-purge-${Date.now()}`,
      adminId,
      adminName,
      action: 'PURGE_ALL_DATA_TO_ZERO',
      entity: 'System',
      entityId: 'global',
      reason: 'Complete operational zero-out performed by authorized staff. All points, visits, bookings, and ledger entries reset to zero.',
      timestamp: new Date().toISOString()
    };
    storageService.setItem(AUDIT_LOGS_KEY, [purgeAuditLog]);
  }

  async resetToFactoryDefaults(adminId: string, adminName: string): Promise<void> {
    storageService.setItem(MENU_KEY, INITIAL_MENU_ITEMS);
    storageService.setItem(REWARDS_KEY, INITIAL_REWARDS);
    storageService.setItem(REDEMPTIONS_KEY, []);
    storageService.setItem(EXPERIENCE_SLOTS_KEY, INITIAL_EXPERIENCE_SLOTS);
    storageService.setItem(EXPERIENCE_BOOKINGS_KEY, []);
    storageService.setItem(OFFERS_KEY, INITIAL_OFFERS);
    storageService.setItem(COMMUNITY_EVENTS_KEY, INITIAL_COMMUNITY_EVENTS);
    storageService.setItem(COMMUNITY_POSTS_KEY, INITIAL_COMMUNITY_POSTS);
    storageService.setItem(FINANCE_KEY, INITIAL_FINANCE);
    storageService.setItem(SETTINGS_KEY, INITIAL_SETTINGS);
    storageService.setItem(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    ledgerService.resetToFactoryTransactions();
    await visitTokenService.resetToFactoryVisits();

    const resetAuditLog: AuditLog = {
      id: `audit-factory-${Date.now()}`,
      adminId,
      adminName,
      action: 'RESET_TO_FACTORY_DEFAULTS',
      entity: 'System',
      entityId: 'global',
      reason: 'System restored to official factory starter defaults.',
      timestamp: new Date().toISOString()
    };
    storageService.setItem(AUDIT_LOGS_KEY, [resetAuditLog]);
  }
}

export const dataService = new DataService();
