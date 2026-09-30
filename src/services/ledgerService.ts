import {
  KinkooTransaction,
  KinkooBalanceState,
  TransactionType,
  WeeklyClaimRecord
} from '../types';
import { storageService } from './storageService';
import { visitTokenService } from './visitTokenService';

const LEDGER_KEY = 'pause_kinkoo_ledger';
const WEEKLY_CLAIMS_KEY = 'pause_weekly_claims';
const MONTHLY_VISITS_KEY = 'pause_monthly_visits';

// Helper to get current ISO Week identifier (e.g. "2026-W35")
export function getCurrentWeekIdentifier(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getCurrentMonthIdentifier(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const INITIAL_TRANSACTIONS: KinkooTransaction[] = [
  {
    id: 'tx-init-1',
    userId: 'usr-default-1',
    userName: 'Arjun Mehta',
    amount: 100,
    type: 'VISIT_REWARD',
    description: 'Physical Café Visit Verification',
    referenceId: 'vis-init-01',
    timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
    createdBy: 'Barista Elena'
  },
  {
    id: 'tx-init-2',
    userId: 'usr-default-1',
    userName: 'Arjun Mehta',
    amount: 100,
    type: 'VISIT_REWARD',
    description: 'Physical Café Visit Verification',
    referenceId: 'vis-init-02',
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdBy: 'Barista Elena'
  },
  {
    id: 'tx-init-3',
    userId: 'usr-default-1',
    userName: 'Arjun Mehta',
    amount: 100,
    type: 'VISIT_REWARD',
    description: 'Physical Café Visit Verification',
    referenceId: 'vis-init-03',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdBy: 'Barista Elena'
  },
  {
    id: 'tx-init-4',
    userId: 'usr-default-1',
    userName: 'Arjun Mehta',
    amount: 100,
    type: 'VISIT_REWARD',
    description: 'Physical Café Visit Verification',
    referenceId: 'vis-init-04',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdBy: 'Barista Elena'
  },
  {
    id: 'tx-init-5',
    userId: 'usr-default-1',
    userName: 'Arjun Mehta',
    amount: 20,
    type: 'BONUS',
    description: 'Welcome to Pause Community Bonus',
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdBy: 'System'
  }
];

class LedgerService {
  private getLedger(): KinkooTransaction[] {
    return storageService.getItem<KinkooTransaction[]>(LEDGER_KEY, INITIAL_TRANSACTIONS);
  }

  private saveLedger(ledger: KinkooTransaction[]): void {
    storageService.setItem(LEDGER_KEY, ledger);
  }

  getAllTransactions(): KinkooTransaction[] {
    return this.getLedger().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getUserTransactions(userId: string): KinkooTransaction[] {
    return this.getAllTransactions().filter((tx) => tx.userId === userId);
  }

  getUserBalanceState(userId: string): KinkooBalanceState {
    const userTx = this.getUserTransactions(userId);
    let currentBalance = 0;
    let lifetimeEarned = 0;
    let lifetimeSpent = 0;

    for (const tx of userTx) {
      if (tx.amount > 0) {
        currentBalance += tx.amount;
        lifetimeEarned += tx.amount;
      } else {
        currentBalance += tx.amount; // tx.amount is negative
        lifetimeSpent += Math.abs(tx.amount);
      }
    }

    // Monthly verified visits (independent of spending)
    const monthlyVisitsMap = storageService.getItem<Record<string, Record<string, number>>>(MONTHLY_VISITS_KEY, {
      'usr-default-1': {
        [getCurrentMonthIdentifier()]: 4
      }
    });

    const currentMonthKey = getCurrentMonthIdentifier();
    const monthlyVisits = monthlyVisitsMap[userId]?.[currentMonthKey] || 0;
    const monthlyVisitsTarget = 6;
    const hasEarnedMonthlyExperience = monthlyVisits >= monthlyVisitsTarget;

    // Check weekly claim status
    const weeklyClaims = storageService.getItem<WeeklyClaimRecord[]>(WEEKLY_CLAIMS_KEY, []);
    const currentWeekKey = getCurrentWeekIdentifier();
    const claimedWeeklyGiftThisWeek = weeklyClaims.some(
      (c) => c.userId === userId && c.weekIdentifier === currentWeekKey
    );

    return {
      currentBalance: Math.max(0, Math.trunc(currentBalance)),
      lifetimeEarned,
      lifetimeSpent,
      monthlyVisits,
      monthlyVisitsTarget,
      hasEarnedMonthlyExperience,
      claimedWeeklyGiftThisWeek
    };
  }

  /**
   * Append an atomic transaction to the ledger
   */
  recordTransaction(
    userId: string,
    userName: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    createdBy = 'System',
    metadata?: Record<string, any>
  ): { success: boolean; transaction?: KinkooTransaction; error?: string } {
    if (!userId || userId === 'guest') {
      return { success: false, error: 'Sign in to use your Kinkoos account.' };
    }
    if (!Number.isSafeInteger(amount) || amount === 0) {
      return { success: false, error: 'Kinkoo transactions must be a non-zero whole number.' };
    }

    if (type === 'VISIT_REWARD' && referenceId) {
      const existingVisitAward = this.getUserTransactions(userId).find(
        (transaction) => transaction.type === 'VISIT_REWARD' && transaction.referenceId === referenceId
      );
      if (existingVisitAward) {
        return { success: true, transaction: existingVisitAward };
      }
    }

    // If deducting, verify user balance first
    if (amount < 0) {
      const balance = this.getUserBalanceState(userId);
      if (balance.currentBalance < Math.abs(amount)) {
        return {
          success: false,
          error: `Insufficient Kinkoo balance. Available: ${balance.currentBalance}, required: ${Math.abs(amount)}`
        };
      }
    }

    const tx: KinkooTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      userName,
      amount,
      type,
      description,
      referenceId,
      timestamp: new Date().toISOString(),
      createdBy,
      metadata
    };

    const ledger = this.getLedger();
    ledger.push(tx);
    this.saveLedger(ledger);
    return { success: true, transaction: tx };
  }

  /**
   * Claim weekly 100 free Kinkoos with deterministic check
   */
  claimWeeklyGift(userId: string, userName: string): Promise<{ success: boolean; amount?: number; error?: string; alreadyClaimed?: boolean }> {
    if (!userId || userId === 'guest') {
      return Promise.resolve({ success: false, error: 'Sign in to claim your weekly Kinkoos.' });
    }
    void userName;
    return visitTokenService.claimWeeklyKinkoos(userId, userName);
  }

  /**
   * Increments verified physical visit count for a user in the current month
   */
  incrementMonthlyVisits(userId: string): number {
    const monthlyVisitsMap = storageService.getItem<Record<string, Record<string, number>>>(MONTHLY_VISITS_KEY, {});
    const currentMonthKey = getCurrentMonthIdentifier();

    if (!monthlyVisitsMap[userId]) {
      monthlyVisitsMap[userId] = {};
    }
    const currentCount = monthlyVisitsMap[userId][currentMonthKey] || 0;
    monthlyVisitsMap[userId][currentMonthKey] = currentCount + 1;

    storageService.setItem(MONTHLY_VISITS_KEY, monthlyVisitsMap);
    return currentCount + 1;
  }

  /**
   * Purge all ledger transactions, weekly claims, and monthly visits to ZERO.
   */
  purgeLedger(): void {
    storageService.setItem(LEDGER_KEY, []);
    storageService.setItem(WEEKLY_CLAIMS_KEY, []);
    storageService.setItem(MONTHLY_VISITS_KEY, {});
  }

  /**
   * Restore initial default starter transactions for demonstration.
   */
  resetToFactoryTransactions(): void {
    storageService.setItem(LEDGER_KEY, INITIAL_TRANSACTIONS);
    storageService.setItem(WEEKLY_CLAIMS_KEY, []);
    storageService.setItem(MONTHLY_VISITS_KEY, {
      'usr-default-1': {
        [getCurrentMonthIdentifier()]: 4
      }
    });
  }
}

export const ledgerService = new LedgerService();
