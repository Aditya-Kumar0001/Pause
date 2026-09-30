import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { CalendarDays, Coffee, Gift, LogOut, RefreshCw, Ticket, UserRound } from 'lucide-react';
import { AccountActivityRecord, accountDataService, CustomerAccountData } from '../services/accountDataService';

const emptyAccountData: CustomerAccountData = {
  phone: '',
  ledger: [],
  visits: [],
  rewards: [],
  redemptions: [],
  readErrorCodes: []
};

const activityTime = (record: AccountActivityRecord): number => {
  const value = record.timestamp ?? record.createdAt;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  const parsed = value ? new Date(String(value)).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatActivityTime = (record: AccountActivityRecord): string => {
  const time = activityTime(record);
  return time ? new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
};

const recordLabel = (record: AccountActivityRecord): string => {
  const label = String(record.description || record.rewardTitle || record.title || record.name || record.type || 'Account activity');
  return record.code ? `${label} | Code: ${String(record.code)}` : label;
};

const recordStatus = (record: AccountActivityRecord): string => {
  const status = String(record.status || '');
  const expiry = record.expiresAt ? new Date(String(record.expiresAt)).getTime() : Number.NaN;
  return status === 'issued' && Number.isFinite(expiry) && expiry <= Date.now() ? 'expired' : status;
};

const latestRecords = (records: AccountActivityRecord[]): AccountActivityRecord[] =>
  [...records].sort((first, second) => activityTime(second) - activityTime(first));

export const AccountPage: React.FC = () => {
  const { firebaseUser, signOut } = useAuth();
  const { balanceState } = useApp();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [accountData, setAccountData] = useState<CustomerAccountData>(emptyAccountData);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    let isCurrent = true;
    setIsLoadingData(true);
    setDataError('');
    accountDataService.getCustomerAccountData(firebaseUser.uid)
      .then((data) => {
        if (isCurrent) {
          setAccountData(data);
        }
      })
      .catch((loadError: unknown) => {
        const code = (loadError as { code?: string })?.code;
        if (!isCurrent) return;
        if (code === 'permission-denied') {
          setDataError('Firebase blocked access to your account or visit records. Check the Firestore access rules, then retry.');
        } else if (code === 'unavailable' || code === 'network-request-failed') {
          setDataError('Account activity service is temporarily unreachable. Check the connection and retry.');
        } else {
          setDataError('Account activity could not be loaded. Check the local SQLite service and Firebase sign-in, then retry.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingData(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [firebaseUser, reloadKey]);

  useEffect(() => {
    const refreshAccountData = () => setReloadKey((key) => key + 1);
    window.addEventListener('pause_account_data_refresh', refreshAccountData);
    return () => window.removeEventListener('pause_account_data_refresh', refreshAccountData);
  }, []);

  if (!firebaseUser) return null;

  const createdAt = firebaseUser.metadata.creationTime
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const ledgerRecords = accountData.ledger;
  const visitRecords = accountData.visits;
  const rewardRecords = accountData.ledger.filter((record) => Number(record.amount) > 0);
  const redemptionRecords = accountData.redemptions;
  const readError = dataError || (accountData.readErrorCodes.length > 0
    ? accountData.readErrorCodes.includes('permission-denied')
      ? 'Some Firestore activity could not be read. Existing account records are still shown; deploy the current firestore.rules to enable the remaining records.'
      : 'Some Firestore activity could not be read. Existing account records are still shown.'
    : '');

  const renderRecords = (records: AccountActivityRecord[], emptyMessage: string) => {
    if (isLoadingData && records.length === 0) return <p>Loading account activity...</p>;
    if (records.length === 0) return <p>{emptyMessage}</p>;

    return (
      <ul className="account-activity-list">
        {latestRecords(records).map((record) => (
          <li key={record.id}>
            <span>{recordLabel(record)}</span>
            <span className="account-activity-meta">
              {record.amount !== undefined ? `${Number(record.amount) > 0 ? '+' : ''}${record.amount} K` : ''}
              {record.status ? ` ${recordStatus(record).replace(/_/g, ' ')}` : ''}
              {formatActivityTime(record) ? ` · ${formatActivityTime(record)}` : ''}
              {record.code && record.expiresAt
                ? ` · Expires ${new Date(String(record.expiresAt)).toLocaleDateString()}`
                : ''}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError('');
    const result = await signOut();
    setIsSigningOut(false);
    if (result.success) navigate('/', { replace: true });
    else setError(result.error || 'We could not sign you out. Please try again.');
  };

  return (
    <section className="account-page section">
      <div className="container account-content">
        <div className="account-heading">
          <span className="section-tag">Your Pause</span>
          <h1 className="heading-xl">Account</h1>
        </div>

        <div className="account-profile">
          {firebaseUser.photoURL ? (
            <img className="account-avatar" src={firebaseUser.photoURL} alt="" />
          ) : (
            <div className="account-avatar account-avatar-placeholder" aria-hidden="true"><UserRound size={26} /></div>
          )}
          <div className="account-profile-details">
            <h2>{firebaseUser.displayName || 'Pause Guest'}</h2>
            <p>{firebaseUser.email}</p>
            {(accountData.phone || firebaseUser.phoneNumber) && <p>{accountData.phone || firebaseUser.phoneNumber}</p>}
            {createdAt && <p className="account-created"><CalendarDays size={14} /> Member since {createdAt}</p>}
          </div>
          <button type="button" className="btn btn-secondary account-logout" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut size={16} /> {isSigningOut ? 'Signing out...' : 'Log Out'}
          </button>
        </div>

        {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}

        {readError && (
          <div className="account-data-error" role="alert">
            <p>{readError}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadKey((key) => key + 1)} disabled={isLoadingData}>
              <RefreshCw size={15} /> {isLoadingData ? 'Loading...' : 'Retry'}
            </button>
          </div>
        )}

        <div className="account-sections" aria-label="Account activity">
          <section className="account-section">
            <div className="account-section-title"><Coffee size={18} /><h2>Kinkoos balance</h2></div>
            <p className="account-balance-value">{balanceState.currentBalance} Kinkoos</p>
            {renderRecords(ledgerRecords, 'No Kinkoos transactions have been recorded yet.')}
          </section>
          <section className="account-section">
            <div className="account-section-title"><CalendarDays size={18} /><h2>Visit history</h2></div>
            {renderRecords(visitRecords, 'No visits have been recorded yet.')}
          </section>
          <section className="account-section">
            <div className="account-section-title"><Gift size={18} /><h2>Rewards</h2></div>
            {renderRecords(rewardRecords, 'No rewards have been recorded yet.')}
          </section>
          <section className="account-section">
            <div className="account-section-title"><Ticket size={18} /><h2>Redemptions</h2></div>
            {renderRecords(redemptionRecords, 'No rewards have been redeemed yet.')}
          </section>
        </div>
      </div>
    </section>
  );
};
