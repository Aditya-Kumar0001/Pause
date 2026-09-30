import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  CommunityContact,
  CommunityEvent,
  CommunityPost,
  ExperienceBooking,
  ExperienceSlot,
  KinkooBalanceState,
  KinkooTransaction,
  MenuItem,
  OfferItem,
  PhysicalVisit,
  RedemptionRecord,
  RewardItem,
  SiteSettings,
  VisitToken
} from '../types';
import { visitTokenService } from '../services/visitTokenService';
import { dataService, PublicSiteContent } from '../services/dataService';
import { db as firestoreDb } from '../firebase/firestore';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'kinkoo';
}

interface AppContextType {
  balanceState: KinkooBalanceState;
  transactions: KinkooTransaction[];
  userVisits: PhysicalVisit[];
  userRedemptions: RedemptionRecord[];
  menuItems: MenuItem[];
  rewards: RewardItem[];
  offers: OfferItem[];
  experienceSlots: ExperienceSlot[];
  communityEvents: CommunityEvent[];
  communityPosts: CommunityPost[];
  settings: SiteSettings;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  refreshData: () => void;
  claimWeeklyGift: () => Promise<{ success: boolean; amount?: number; balance?: number; error?: string; alreadyClaimed?: boolean }>;
  generateVisitToken: () => Promise<VisitToken | null>;
  claimReward: (rewardId: string) => Promise<{ success: boolean; balance?: number; redemption?: RedemptionRecord; error?: string }>;
  bookExperience: (
    slotId: string,
    phone: string,
    useMonthlyReward: boolean
  ) => Promise<{ success: boolean; booking?: ExperienceBooking; slot?: ExperienceSlot; balance?: number; error?: string }>;
  rsvpCommunityEvent: (eventId: string) => { success: boolean; error?: string };
  joinCommunity: (contact: Omit<CommunityContact, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, firebaseUser, isAdmin } = useAuth();
  const customerUid = firebaseUser?.uid;
  const memberUserId = firebaseUser?.uid ?? currentUser.id;
  const memberUserName = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || currentUser.name;
  const emptyBalance: KinkooBalanceState = {
    currentBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    monthlyVisits: 0,
    monthlyVisitsTarget: 6,
    hasEarnedMonthlyExperience: false,
    claimedWeeklyGiftThisWeek: false
  };

  const [balanceState, setBalanceState] = useState<KinkooBalanceState>(emptyBalance);
  const [transactions, setTransactions] = useState<KinkooTransaction[]>([]);
  const [userVisits, setUserVisits] = useState<PhysicalVisit[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<RedemptionRecord[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => dataService.getMenuItems());
  const [rewards, setRewards] = useState<RewardItem[]>(() => dataService.getRewards());
  const [offers, setOffers] = useState<OfferItem[]>(() => dataService.getOffers());
  const [experienceSlots, setExperienceSlots] = useState<ExperienceSlot[]>(() => dataService.getExperienceSlots());
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(() => dataService.getCommunityEvents());
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => dataService.getCommunityPosts());
  const [settings, setSettings] = useState<SiteSettings>(() => dataService.getSettings());

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requireCustomerSignIn = useCallback((): boolean => {
    if (firebaseUser) return true;
    showToast('Sign in to use Kinkoos and member features.', 'info');
    window.dispatchEvent(new CustomEvent('pause_require_signin'));
    return false;
  }, [firebaseUser, showToast]);

  const refreshData = useCallback(async () => {
    let remoteRewards: RewardItem[] | null = null;
    if (firebaseUser) {
      try {
        const [memberData, catalog] = await Promise.all([
          visitTokenService.getMyKinkooData(memberUserId, memberUserName),
          visitTokenService.getRewardCatalog().catch((error) => {
            console.error('Could not load the SQLite reward catalogue.', error);
            return null;
          })
        ]);
        remoteRewards = catalog;
        if (firebaseUser.uid === memberUserId) {
          setBalanceState(memberData.balance);
          setTransactions(memberData.transactions);
          setUserVisits(memberData.visits);
          setUserRedemptions(memberData.redemptions);
        }
      } catch (error) {
        console.error('Could not load server Kinkoo data:', error);
        setUserRedemptions([]);
      }
    } else {
      setBalanceState(emptyBalance);
      setTransactions([]);
      setUserVisits([]);
    }
    if (!firebaseUser) setUserRedemptions([]);
    setMenuItems(dataService.getMenuItems());
    if (remoteRewards) {
      const localRewardDetails = new Map(dataService.getRewards().map((reward) => [reward.id, reward]));
      const mergedRewards = remoteRewards.map((reward) => ({ ...localRewardDetails.get(reward.id), ...reward }));
      setRewards(mergedRewards);
    } else {
      setRewards(dataService.getRewards());
    }
    setOffers(dataService.getOffers());
    setExperienceSlots(dataService.getExperienceSlots());
    setCommunityEvents(dataService.getCommunityEvents());
    setCommunityPosts(dataService.getCommunityPosts());
    setSettings(dataService.getSettings());
  }, [firebaseUser, memberUserId, memberUserName]);

  useEffect(() => {
    refreshData();
  }, [currentUser.id, refreshData]);

  useEffect(() => {
    const publicContentKeys = new Set([
      'pause_menu_items_v2',
      'pause_rewards_catalog_v2',
      'pause_experience_slots_v2',
      'pause_offers_list_v2',
      'pause_community_events_v2',
      'pause_community_posts_v2',
      'pause_site_settings_v2'
    ]);
    let publishTimer: ReturnType<typeof setTimeout> | undefined;
    const handleUpdate = (event: Event) => {
      refreshData();
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!isAdmin || !key || !publicContentKeys.has(key)) return;

      if (publishTimer) clearTimeout(publishTimer);
      publishTimer = setTimeout(() => {
        void dataService.syncPublicSiteContent().catch((error) => {
          console.error('Could not publish admin site content to Firestore.', error);
        });
      }, 200);
    };

    window.addEventListener('pause_storage_update', handleUpdate);
    return () => {
      window.removeEventListener('pause_storage_update', handleUpdate);
      if (publishTimer) clearTimeout(publishTimer);
    };
  }, [isAdmin, refreshData]);

  useEffect(() => {
    if (!firestoreDb) return;
    const unsubscribe = onSnapshot(doc(firestoreDb, 'site_content', 'public'), (snapshot) => {
      if (!snapshot.exists()) {
        if (isAdmin) {
          void dataService.syncPublicSiteContent().catch((error) => {
            console.error('Could not initialize shared site content in Firestore.', error);
          });
        }
        return;
      }

      const content = snapshot.data() as Partial<PublicSiteContent>;
      dataService.cachePublicSiteContent(content);
      if (content.menuItems) setMenuItems(content.menuItems);
      if (content.rewards) setRewards(content.rewards);
      if (content.offers) setOffers(content.offers);
      if (content.experienceSlots) setExperienceSlots(content.experienceSlots);
      if (content.communityEvents) setCommunityEvents(content.communityEvents);
      if (content.communityPosts) setCommunityPosts(content.communityPosts);
      if (content.settings) setSettings(content.settings);
    }, (error) => {
      console.error('Could not watch shared site content in Firestore.', error);
    });

    return unsubscribe;
  }, [isAdmin]);

  useEffect(() => {
    if (!customerUid || !firestoreDb) return;
    let isInitialSnapshot = true;
    const visitsQuery = query(collection(firestoreDb, 'visits'), where('userId', '==', customerUid));
    const unsubscribe = onSnapshot(visitsQuery, (snapshot) => {
      if (isInitialSnapshot) {
        isInitialSnapshot = false;
        return;
      }

      const newVisits = snapshot.docChanges()
        .filter((change) => change.type === 'added' && change.doc.data().status === 'verified');
      if (newVisits.length === 0) return;

      const latestVisit = newVisits[newVisits.length - 1].doc.data();
      const awarded = Number(latestVisit.kinkoosAwarded) || 0;
      showToast(
        awarded > 0
          ? `Visit verified! ${awarded} Kinkoos have been added to your balance.`
          : 'Visit verified! Your monthly Kinkoos visit limit has been reached.',
        'success'
      );
      void refreshData();
      window.dispatchEvent(new Event('pause_account_data_refresh'));
    }, (error) => {
      console.error('Could not watch customer visit updates.', error);
    });

    return unsubscribe;
  }, [customerUid, refreshData, showToast]);

  const claimWeeklyGift = async () => {
    if (!requireCustomerSignIn()) {
      return { success: false, error: 'Sign in to claim your weekly Kinkoos.' };
    }
    const res = await visitTokenService.claimWeeklyKinkoos(memberUserId, memberUserName);
    if (res.success) {
      if (Number.isSafeInteger(res.balance)) {
        setBalanceState((current) => ({ ...current, currentBalance: res.balance!, claimedWeeklyGiftThisWeek: true }));
      }
      showToast(`+${res.amount} Kinkoos claimed! Added to your ledger.`, 'kinkoo');
      void refreshData();
    } else {
      showToast(res.error || 'Could not claim gift.', 'error');
    }
    return res;
  };

  const generateVisitToken = async () => {
    if (!requireCustomerSignIn()) return null;
    const token = await visitTokenService.generateVisitToken(memberUserId, memberUserName);
    refreshData();
    return token;
  };

  const claimReward = async (rewardId: string) => {
    if (!requireCustomerSignIn()) {
      return { success: false, error: 'Sign in to redeem rewards.' };
    }
    const res = await visitTokenService.redeemReward(rewardId);
    if (res.success) {
      if (Number.isSafeInteger(res.balance)) {
        setBalanceState((current) => ({ ...current, currentBalance: res.balance! }));
      }
      if (res.redemption) {
        setUserRedemptions((current) => [
          res.redemption!,
          ...current.filter((redemption) => redemption.id !== res.redemption!.id)
        ]);
        window.dispatchEvent(new Event('pause_account_data_refresh'));
      }
      showToast(`Reward claimed! Code: ${res.redemption?.code}. Present at the café counter.`, 'success');
      void refreshData();
    } else {
      showToast(res.error || 'Failed to claim reward.', 'error');
    }
    return res;
  };

  const bookExperience = async (slotId: string, phone: string, useMonthlyReward: boolean) => {
    if (!requireCustomerSignIn()) {
      return { success: false, error: 'Sign in to reserve an experience.' };
    }
    const res = await visitTokenService.bookExperience(slotId, phone, useMonthlyReward);
    if (res.success) {
      if (Number.isSafeInteger(res.balance)) {
        setBalanceState((current) => ({ ...current, currentBalance: res.balance! }));
      }
      if (res.slot) {
        dataService.cacheExperienceSlot(res.slot);
        setExperienceSlots(dataService.getExperienceSlots());
      }
      showToast('Experience session reserved! Check your confirmation details.', 'success');
      void refreshData();
    } else {
      showToast(res.error || 'Booking failed.', 'error');
    }
    return res;
  };

  const rsvpCommunityEvent = (eventId: string) => {
    if (!requireCustomerSignIn()) {
      return { success: false, error: 'Sign in to RSVP to community events.' };
    }
    const res = dataService.rsvpCommunityEvent(eventId, firebaseUser?.uid || 'guest');
    if (res.success) {
      showToast('RSVP confirmed for this community event!', 'success');
      refreshData();
    } else {
      showToast(res.error || 'Could not RSVP.', 'error');
    }
    return res;
  };

  const joinCommunity = async (contact: Omit<CommunityContact, 'id' | 'createdAt'>) => {
    if (!requireCustomerSignIn()) {
      return { success: false, error: 'Sign in to join the Pause Community.' };
    }
    const res = await dataService.addCommunityContact({
      ...contact,
      userId: firebaseUser?.uid,
      id: `community-contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString()
    });
    if (res.success) {
      showToast('Welcome to the Pause Community.', 'success');
    }
    return res;
  };

  return (
    <AppContext.Provider
      value={{
        balanceState,
        transactions,
        userVisits,
        userRedemptions,
        menuItems,
        rewards,
        offers,
        experienceSlots,
        communityEvents,
        communityPosts,
        settings,
        toasts,
        showToast,
        removeToast,
        refreshData,
        claimWeeklyGift,
        generateVisitToken,
        claimReward,
        bookExperience,
        rsvpCommunityEvent,
        joinCommunity
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
