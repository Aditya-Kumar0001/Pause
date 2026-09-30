import { KinkooBalanceState, KinkooTransaction, PhysicalVisit, RedemptionRecord, RewardItem, VisitToken, ExperienceSlot, ExperienceBooking } from '../types';
import { kinkooApi } from './localKinkooApi';

class VisitTokenService {
  async getMyKinkooData(_userId: string, _userName: string): Promise<{
    balance: KinkooBalanceState;
    transactions: KinkooTransaction[];
    visits: PhysicalVisit[];
    redemptions: RedemptionRecord[];
  }> {
    return kinkooApi('/me');
  }

  async claimWeeklyKinkoos(_userId: string, _userName: string): Promise<{ success: boolean; amount?: number; balance?: number; error?: string; alreadyClaimed?: boolean }> {
    try {
      return await kinkooApi('/weekly-claim', {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not claim this week’s Kinkoos.';
      return { success: false, alreadyClaimed: message.includes('already claimed'), error: message };
    }
  }

  async redeemReward(rewardId: string): Promise<{ success: boolean; balance?: number; redemption?: RedemptionRecord; error?: string }> {
    try {
      return await kinkooApi('/redeem', { rewardId });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to redeem this reward.' };
    }
  }

  async consumeRewardVoucher(code: string): Promise<{ success: boolean; redemption?: RedemptionRecord; error?: string }> {
    try {
      return await kinkooApi('/reward/consume', { code });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not validate this voucher.' };
    }
  }

  async generateVisitToken(_userId: string, _userName: string): Promise<VisitToken> {
    return kinkooApi('/visit-token', {});
  }

  async checkToken(token: string): Promise<{ valid: boolean; token?: VisitToken; error?: string }> {
    if (!/^\d{6}$/.test(token.trim())) return { valid: false, error: 'Enter a valid six-digit visit code.' };
    try {
      const result = await kinkooApi<VisitToken>('/visit/inspect', { token: token.trim() });
      return { valid: true, token: result };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Visit token validation failed.' };
    }
  }

  async markAsVerifiedVisit(token: string, notes: string): Promise<{ success: boolean; visit?: PhysicalVisit; error?: string }> {
    try {
      return await kinkooApi('/visit/verify', { token, notes });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not verify the visit.' };
    }
  }

  async flagAsSpam(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await kinkooApi('/visit/flag', { token });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not flag this token.' };
    }
  }

  async getVisitsHistory(): Promise<PhysicalVisit[]> {
    return (await kinkooApi<{ visits: PhysicalVisit[] }>('/admin/visits')).visits;
  }

  async getAdminKinkooSummary(): Promise<{ pointsInCirculation: number }> {
    return kinkooApi('/admin/summary');
  }

  async getRedemptions(): Promise<RedemptionRecord[]> {
    return (await kinkooApi<{ redemptions: RedemptionRecord[] }>('/redemptions')).redemptions;
  }

  async getRewardCatalog(): Promise<RewardItem[]> {
    return (await kinkooApi<{ rewards: RewardItem[] }>('/catalog')).rewards;
  }

  async syncCatalog(rewards: RewardItem[], experienceSlots: ExperienceSlot[]): Promise<void> {
    await kinkooApi('/catalog/sync', { rewards, experienceSlots });
  }

  async bookExperience(slotId: string, phone: string, useMonthlyReward: boolean): Promise<{
    success: boolean; booking?: ExperienceBooking; slot?: ExperienceSlot; balance?: number; error?: string
  }> {
    try {
      return await kinkooApi('/experience/book', { slotId, phone, useMonthlyReward });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Booking failed.' };
    }
  }

  async cancelExperienceBooking(bookingId: string, refundKinkoos = true): Promise<{ success: boolean; error?: string }> {
    try {
      return await kinkooApi('/experience/cancel', { bookingId, refundKinkoos });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not cancel this booking.' };
    }
  }

  async purgeVisitsAndTokens(): Promise<void> {
    await kinkooApi('/admin/purge', {});
  }

  async resetToFactoryVisits(): Promise<void> {
    await this.purgeVisitsAndTokens();
  }
}

export const visitTokenService = new VisitTokenService();
