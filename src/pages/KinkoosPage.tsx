import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { VisitQRModal } from '../components/kinkoos/VisitQRModal';
import { GiftCardUnwrap } from '../components/kinkoos/GiftCardUnwrap';
import { RewardCard } from '../components/kinkoos/RewardCard';
import { RewardClaimModal } from '../components/kinkoos/RewardClaimModal';
import { LedgerHistory } from '../components/kinkoos/LedgerHistory';
import { RedemptionRecord, RewardItem } from '../types';
import { Hash, ArrowRight, Ticket, User, ShieldCheck } from 'lucide-react';

export const KinkoosPage: React.FC = () => {
  const { balanceState, transactions, rewards, userRedemptions } = useApp();
  const { currentUser, firebaseUser, authLoading } = useAuth();

  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'vouchers' | 'ledger' | 'profile'>('rewards');

  const handleClaim = (reward: RewardItem) => {
    setSelectedReward(reward);
    setIsClaimModalOpen(true);
  };

  const visitsNeeded = Math.max(0, balanceState.monthlyVisitsTarget - balanceState.monthlyVisits);

  if (authLoading) {
    return <div className="auth-state" role="status">Checking your account...</div>;
  }

  if (!firebaseUser) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: '680px', textAlign: 'center' }}>
          <span className="section-tag">Pause Membership</span>
          <h1 className="heading-xl">Sign in to access Kinkoos</h1>
          <p className="body-regular" style={{ margin: 'var(--space-md) 0 var(--space-xl)' }}>
            Your balance, visit passes, rewards, and redemptions are available to signed-in members only.
          </p>
          <Link to="/signin" state={{ from: '/kinkoos' }} className="btn btn-primary">
            Sign In or Create Account
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="section-header text-center">
          <span className="section-tag">|| Rewarding Presence</span>
          <h1 className="display-hero" style={{ marginBottom: 'var(--space-xs)' }}>
            Kinkoos & Member Account
          </h1>
          <p className="subheading-editorial" style={{ maxWidth: '640px', margin: '0 auto' }}>
            "We reward physical presence and deliberate pauses. 1 Verified Visit = 100 Kinkoos • 6 Monthly Visits = 1 Free Coffee Experience."
          </p>
        </div>

        {/* Big Kinkoo Account Dashboard Card */}
        <div className="kinkoos-account-header">
          <div className="kinkoos-header-grid">
            <div>
              <div className="tag-label" style={{ color: 'var(--color-parchment)' }}>
                Active Member Balance
              </div>
              <div className="kinkoo-balance-display">
                {balanceState.currentBalance}
                <span className="unit">Kinkoos</span>
              </div>

              {/* Monthly Visits Progress */}
              <div style={{ maxWidth: '440px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-parchment)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                  <span>Monthly Pauses Completed</span>
                  <span style={{ fontWeight: 700 }}>
                    {balanceState.monthlyVisits} / 6 Verified Visits
                  </span>
                </div>
                <div className="progress-container" style={{ backgroundColor: 'rgba(244, 237, 227, 0.2)' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (balanceState.monthlyVisits / 6) * 100)}%`,
                      backgroundColor: 'var(--color-parchment)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-parchment)', marginTop: '0.4rem' }}>
                  {balanceState.hasEarnedMonthlyExperience ? (
                    <span style={{ color: 'var(--color-warm-amber)', fontWeight: 700 }}>
                      ★ 1 Complimentary Behind-the-Bar session unlocked this month!
                    </span>
                  ) : (
                    <span>
                      {visitsNeeded} more verified visit{visitsNeeded === 1 ? '' : 's'} needed for a free coffee-making session (or redeem 600 Kinkoos).
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visit Now Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', minWidth: '280px' }}>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="btn btn-terracotta btn-lg"
                style={{ justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Hash size={20} />
                  <span>Record a Pause (Visit Code)</span>
                </span>
                <ArrowRight size={16} />
              </button>

              <div
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'rgba(244, 237, 227, 0.08)',
                  border: '1px solid rgba(244, 237, 227, 0.15)',
                  fontSize: '0.8rem',
                  color: 'var(--color-parchment)'
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                  Physical Presence Required
                </div>
                Show the expiring single-use six-digit code to your barista at the café counter to record your visit and receive 100 Kinkoos.
              </div>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="kinkoo-stats-strip">
            <div className="kinkoo-stat-box">
              <div className="kinkoo-stat-label">Lifetime Earned</div>
              <div className="kinkoo-stat-value">+{balanceState.lifetimeEarned} K</div>
            </div>
            <div className="kinkoo-stat-box">
              <div className="kinkoo-stat-label">Lifetime Spent</div>
              <div className="kinkoo-stat-value">-{balanceState.lifetimeSpent} K</div>
            </div>
            <div className="kinkoo-stat-box">
              <div className="kinkoo-stat-label">Member Account</div>
              <div className="kinkoo-stat-value" style={{ fontSize: '0.95rem' }}>{currentUser.name}</div>
            </div>
          </div>
        </div>

        {/* Weekly Gift Card Section */}
        <div style={{ margin: 'var(--space-3xl) 0' }}>
          <GiftCardUnwrap />
        </div>

        {/* Account Tabs */}
        <div className="editorial-tabs" style={{ marginTop: 'var(--space-4xl)' }}>
          <button
            className={`editorial-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Reward Catalogue
          </button>
          <button
            className={`editorial-tab-btn ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
          >
            My Vouchers ({userRedemptions.length})
          </button>
          <button
            className={`editorial-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            Transaction Ledger ({transactions.length})
          </button>
          <button
            className={`editorial-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Member Profile
          </button>
        </div>

        {/* Tab 1: Reward Catalogue */}
        {activeTab === 'rewards' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <h3 className="heading-lg">Available Café Rewards</h3>
                <p className="body-small">
                  Note: A minimum account balance of 500 Kinkoos is required for eligible redemptions.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
              {rewards.map((reward: RewardItem) => (
                <RewardCard key={reward.id} reward={reward} onClaim={handleClaim} />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Active User Vouchers */}
        {activeTab === 'vouchers' && (
          <div>
            <h3 className="heading-lg" style={{ marginBottom: 'var(--space-md)' }}>
              Your Issued Reward Vouchers
            </h3>
            {userRedemptions.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                {userRedemptions.map((red: RedemptionRecord) => (
                  <div key={red.id} className="card-paper-bordered">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                      <span className="tag-label">Voucher Passcode</span>
                      <span className={`badge ${red.status === 'verified_consumed' || red.status === 'expired' || Date.parse(red.expiresAt) <= Date.now() ? 'badge-dark' : 'badge-success'}`}>
                        {red.status === 'verified_consumed' ? 'Consumed' : red.status === 'expired' || Date.parse(red.expiresAt) <= Date.now() ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-espresso)', margin: '0.25rem 0' }}>
                      {red.code}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-espresso)', marginBottom: '0.4rem' }}>
                      {red.rewardTitle}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Claimed: {new Date(red.createdAt).toLocaleDateString()} • Expires: {new Date(red.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Ticket size={40} style={{ margin: '0 auto var(--space-md) auto', color: 'var(--color-brown-muted)', opacity: 0.6 }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-espresso)' }}>
                  Nothing to claim just yet.
                </h4>
                <p className="body-small">Redeem rewards from the catalogue above when your balance reaches 500 Kinkoos.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Ledger History */}
        {activeTab === 'ledger' && (
          <div>
            <h3 className="heading-lg" style={{ marginBottom: 'var(--space-md)' }}>
              Auditable Transaction Ledger
            </h3>
            <LedgerHistory transactions={transactions} />
          </div>
        )}

        {/* Tab 4: Member Profile */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '640px' }}>
            <div className="card-paper-bordered">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-ink-rule)' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: 'var(--color-espresso)', color: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)' }}>
                  <User size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--color-espresso)' }}>
                    {currentUser.name}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {currentUser.email} • Member ID: {currentUser.id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-ink-rule)', paddingBottom: '0.4rem' }}>
                  <span className="tag-label">Member Tier</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-espresso)' }}>Active Café Regular</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-ink-rule)', paddingBottom: '0.4rem' }}>
                  <span className="tag-label">Physical Visits Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{balanceState.lifetimeEarned / 100} Verified Visits</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-ink-rule)', paddingBottom: '0.4rem' }}>
                  <span className="tag-label">Account Security</span>
                  <span style={{ color: 'var(--color-sage)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> Server Validated
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visit code modal */}
        <VisitQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />

        {/* Reward Claim Confirmation Modal */}
        <RewardClaimModal
          reward={selectedReward}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
        />
      </div>
    </div>
  );
};
