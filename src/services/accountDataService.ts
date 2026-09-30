import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { visitTokenService } from './visitTokenService';

export interface AccountActivityRecord {
  id: string;
  [field: string]: unknown;
}

export interface CustomerAccountData {
  phone: string;
  ledger: AccountActivityRecord[];
  visits: AccountActivityRecord[];
  rewards: AccountActivityRecord[];
  redemptions: AccountActivityRecord[];
  readErrorCodes: string[];
}

const readCustomerVisits = async (uid: string): Promise<AccountActivityRecord[]> => {
  if (!db) throw new Error('Firebase is not configured.');
  const result = await getDocs(query(collection(db, 'visits'), where('userId', '==', uid)));
  return result.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
};

export const accountDataService = {
  async getCustomerAccountData(uid: string): Promise<CustomerAccountData> {
    if (!db) throw new Error('Firebase is not configured.');
    const firestore = db;
    const readErrors: string[] = [];
    const safeRead = async <T,>(operation: () => Promise<T>, fallback: T, label: string): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        const requestStatus = (error as { status?: number })?.status;
        const code = (error as { code?: string })?.code || (requestStatus ? `api-${requestStatus}` : label);
        if (!readErrors.includes(code)) readErrors.push(code);
        return fallback;
      }
    };

    const [profile, visits, kinkooData] = await Promise.all([
      safeRead(() => getDoc(doc(firestore, 'users', uid)), null, 'profile-read'),
      safeRead(() => readCustomerVisits(uid), [], 'visits-read'),
      safeRead(() => visitTokenService.getMyKinkooData(uid, ''), null, 'sqlite-api')
    ]);

    return {
      phone: String(profile?.data()?.phone || ''),
      ledger: (kinkooData?.transactions || []).map((record) => ({ ...record })),
      visits,
      rewards: [],
      redemptions: (kinkooData?.redemptions || []).map((record) => ({ ...record })),
      readErrorCodes: readErrors
    };
  }
};
