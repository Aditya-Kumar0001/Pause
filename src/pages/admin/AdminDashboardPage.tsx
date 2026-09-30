import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';
import { visitTokenService } from '../../services/visitTokenService';
import {
  CommunityContact,
  FinanceTransaction,
  ExperienceSlot,
  MenuItem,
  PhysicalVisit,
  RedemptionRecord,
  RewardItem,
  UserProfile
} from '../../types';
import {
  LayoutDashboard,
  Hash,
  Coffee,
  Ticket,
  DollarSign,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Search,
  AlertOctagon,
  Users,
  CalendarDays
} from 'lucide-react';
import logoLightImg from '../../assets/logo-light.png';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';

type AdminTab = 'overview' | 'scanner' | 'rewards' | 'events' | 'menu' | 'finance' | 'community';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser, isAdmin, authLoading, logoutAdmin } = useAuth();
  const { showToast, refreshData } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Core Data States
  const [customers, setCustomers] = useState<UserProfile[]>(() => dataService.getCustomers());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => dataService.getMenuItems());
  const [rewards, setRewards] = useState<RewardItem[]>(() => dataService.getRewards());
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() => dataService.getFinanceTransactions());
  const [visitsHistory, setVisitsHistory] = useState<PhysicalVisit[]>([]);
  const [pointsInCirculation, setPointsInCirculation] = useState<number>(0);
  const [communityContacts, setCommunityContacts] = useState<CommunityContact[]>(() => dataService.getCommunityContacts());
  const [experienceSlots, setExperienceSlots] = useState<ExperienceSlot[]>(() => dataService.getExperienceSlots());

  // Interactive UI / Sync States
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Kinkoo Code Validation State (Counter Passkey)
  const [tokenInput, setTokenInput] = useState<string>('');
  const [scannedTokenResult, setScannedTokenResult] = useState<any>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCheckingVisit, setIsCheckingVisit] = useState<boolean>(false);
  const [isRecordingVisit, setIsRecordingVisit] = useState<boolean>(false);

  // Voucher Redemption Quick Code State
  const [voucherInput, setVoucherInput] = useState<string>('');

  // Modals & Edit States
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);

  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);

  const [newFinance, setNewFinance] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'revenue' as 'revenue' | 'expense',
    category: 'Beverages' as any,
    amount: 500,
    description: '',
    paymentMethod: 'UPI / Online' as any
  });
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState<boolean>(false);

  const [newExperience, setNewExperience] = useState({
    title: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM – 11:30 AM',
    durationMinutes: 90,
    capacity: 4,
    kinkooRequired: 600,
    isEligibleForFreeMonthly: false,
    description: ''
  });

  // Filter & Search States
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('ALL');

  // Deletion Confirmation & Reset States
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState<boolean>(false);

  // Sync data whenever tabs or actions change
  const reloadAdminData = () => {
    setCustomers(dataService.getCustomers());
    setMenuItems(dataService.getMenuItems());
    setRewards(dataService.getRewards());
    void visitTokenService.syncCatalog(dataService.getRewards(), dataService.getExperienceSlots()).catch((error) => {
      console.error('Could not sync local reward and experience catalog to SQLite.', error);
    });
    void visitTokenService.getRedemptions().then(setRedemptions).catch((error) => {
      console.error('Could not load SQLite redemptions.', error);
      setRedemptions([]);
    });
    setFinanceTransactions(dataService.getFinanceTransactions());
    void visitTokenService.getVisitsHistory().then(setVisitsHistory).catch(() => setVisitsHistory([]));
    void visitTokenService.getAdminKinkooSummary().then((summary: { pointsInCirculation: number }) => {
      setPointsInCirculation(summary.pointsInCirculation);
    }).catch(() => setPointsInCirculation(0));
    setCommunityContacts(dataService.getCommunityContacts());
    setExperienceSlots(dataService.getExperienceSlots());
    refreshData();
  };

  // Manual Refresh with spin indicator & cross-tab dispatch
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    reloadAdminData();
    window.dispatchEvent(new CustomEvent('pause_storage_update', { detail: { key: 'manual_refresh' } }));
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('All system records, ledger balances, and visits refreshed live!', 'success');
    }, 400);
  };

  // Auto-synchronize whenever localStorage or in-app events fire
  useEffect(() => {
    const handleStorageSync = () => reloadAdminData();
    window.addEventListener('pause_storage_update', handleStorageSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('pause_storage_update', handleStorageSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin-controls/login');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      void visitTokenService.getRewardCatalog().then((serverRewards) => {
        const combined = new Map(dataService.getRewards().map((reward) => [reward.id, reward]));
        serverRewards.forEach((reward) => combined.set(reward.id, { ...combined.get(reward.id), ...reward }));
        const catalog = [...combined.values()];
        dataService.cacheRewardCatalog(catalog);
        setRewards(catalog);
        return visitTokenService.syncCatalog(catalog, dataService.getExperienceSlots());
      }).catch((error) => {
        console.error('Could not load or sync the SQLite reward catalogue.', error);
      });
      void visitTokenService.getRedemptions().then(setRedemptions).catch((error) => {
        console.error('Could not load SQLite redemptions.', error);
      });
      void visitTokenService.getVisitsHistory().then(setVisitsHistory).catch((error: unknown) => {
        setScannerError(error instanceof Error ? error.message : 'Could not load verified visits.');
      });
      void visitTokenService.getAdminKinkooSummary().then((summary: { pointsInCirculation: number }) => {
        setPointsInCirculation(summary.pointsInCirculation);
      });
    }
  }, [isAdmin]);

  const handleLogout = () => {
    void logoutAdmin();
    navigate('/');
  };

  // =========================================================================
  // KINKOO CODE VALIDATION ACTIONS
  // =========================================================================
  const handleInspectToken = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isCheckingVisit || isRecordingVisit) return;
    setScannerError(null);
    setScannedTokenResult(null);

    const clean = tokenInput.trim();
    if (!clean) {
      setScannerError('Enter the six-digit visit code shown to the customer.');
      setActiveTab('scanner');
      return;
    }

    setIsCheckingVisit(true);
    try {
      const check = await visitTokenService.checkToken(clean);
      if (check.valid && check.token) {
        setScannedTokenResult(check.token);
      } else {
        setScannerError(check.error || 'Token validation failed.');
        if (check.token) {
          setScannedTokenResult(check.token);
        }
      }
      setActiveTab('scanner');
    } finally {
      setIsCheckingVisit(false);
    }
  };

  const handleMarkAsVisit = async () => {
    if (!scannedTokenResult || isRecordingVisit) return;
    setIsRecordingVisit(true);
    try {
      const res = await visitTokenService.markAsVerifiedVisit(
        scannedTokenResult.token,
        'Verified at Counter Terminal'
      );

      if (res.success) {
        const awarded = res.visit?.kinkoosAwarded || 0;
        showToast(`Visit verified for ${scannedTokenResult.userName}! +${awarded} Kinkoos awarded.`, 'success');
        dataService.logAction(
          currentUser.id,
          currentUser.name,
          'VERIFY_VISIT',
          'PhysicalVisit',
          res.visit?.id || '',
          undefined,
          JSON.stringify(res.visit),
          `Awarded ${awarded} Kinkoos to ${scannedTokenResult.userName}`
        );
        setTokenInput('');
        setScannedTokenResult(null);
        reloadAdminData();
      } else {
        setScannerError(res.error || 'Failed to record visit.');
      }
    } finally {
      setIsRecordingVisit(false);
    }
  };

  const handleFlagAsSpam = async () => {
    if (!scannedTokenResult) return;
    const res = await visitTokenService.flagAsSpam(
      scannedTokenResult.token
    );

    if (res.success) {
      showToast('Token flagged as spam. No Kinkoos awarded.', 'error');
      dataService.logAction(
        currentUser.id,
        currentUser.name,
        'FLAG_SPAM_VISIT',
        'VisitToken',
        scannedTokenResult.token,
        undefined,
        JSON.stringify({ status: 'flagged_spam' }),
        'Unauthorized scan attempt flagged'
      );
      setTokenInput('');
      setScannedTokenResult(null);
      reloadAdminData();
    } else {
      setScannerError(res.error || 'Could not flag this visit pass.');
    }
  };

  // =========================================================================
  // VOUCHER CODE CONSUMPTION
  // =========================================================================
  const handleConsumeVoucher = async (codeToConsume?: string) => {
    const targetCode = codeToConsume || voucherInput.trim();
    if (!targetCode) {
      showToast('Please enter a voucher code (e.g. RW-1234).', 'error');
      return;
    }

    const res = await visitTokenService.consumeRewardVoucher(targetCode);
    if (res.success) {
      showToast(`Voucher ${res.redemption?.code} marked as consumed! Item served.`, 'success');
      setVoucherInput('');
      reloadAdminData();
    } else {
      showToast(res.error || 'Invalid or already consumed voucher code.', 'error');
    }
  };

  // =========================================================================
  // FINANCE TRANSACTION
  // =========================================================================
  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const item: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      date: newFinance.date || new Date().toISOString().split('T')[0],
      type: newFinance.type,
      category: newFinance.category,
      amount: Number(newFinance.amount),
      description: newFinance.description || 'Café counter entry',
      paymentMethod: newFinance.paymentMethod
    };

    dataService.addFinanceTransaction(currentUser.id, currentUser.name, item);
    showToast('Finance transaction recorded!', 'success');
    setIsFinanceModalOpen(false);
    setNewFinance({
      date: new Date().toISOString().split('T')[0],
      type: 'revenue',
      category: 'Beverages',
      amount: 500,
      description: '',
      paymentMethod: 'UPI / Online'
    });
    reloadAdminData();
  };

  // Quick Action Toggles
  const handleToggleMenuAvailable = (item: MenuItem) => {
    const updated = { ...item, isAvailable: !item.isAvailable };
    dataService.saveMenuItem(currentUser.id, currentUser.name, updated);
    showToast(`${item.name} marked as ${updated.isAvailable ? 'Available' : 'Sold Out'}.`, 'info');
    reloadAdminData();
  };

  const handleToggleRewardAvailable = (reward: RewardItem) => {
    const updated = { ...reward, isAvailable: !reward.isAvailable };
    dataService.saveRewardItem(currentUser.id, currentUser.name, updated);
    showToast(`${reward.title} marked as ${updated.isAvailable ? 'Available' : 'Unavailable'}.`, 'info');
    reloadAdminData();
  };

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    const { type, id, name } = itemToDelete;

    if (type === 'menu') {
      dataService.deleteMenuItem(currentUser.id, currentUser.name, id);
      showToast(`Deleted menu item: ${name}`, 'info');
    } else if (type === 'reward') {
      dataService.deleteRewardItem(currentUser.id, currentUser.name, id);
      showToast(`Deleted reward item: ${name}`, 'info');
    } else if (type === 'finance') {
      dataService.deleteFinanceTransaction(currentUser.id, currentUser.name, id);
      showToast(`Voided transaction: ${name}`, 'info');
    } else if (type === 'experience') {
      dataService.deleteExperienceSlot(currentUser.id, currentUser.name, id);
      showToast(`Removed experience event: ${name}`, 'info');
    }

    setItemToDelete(null);
    reloadAdminData();
  };

  const handleAddExperience = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slot: ExperienceSlot = {
      ...newExperience,
      id: `exp-${Date.now()}`,
      bookedCount: 0,
      status: 'open',
      curriculum: []
    };
    dataService.saveExperienceSlot(currentUser.id, currentUser.name, slot);
    showToast('Experience event added to the customer schedule.', 'success');
    setNewExperience({
      title: '',
      subtitle: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM – 11:30 AM',
      durationMinutes: 90,
      capacity: 4,
      kinkooRequired: 600,
      isEligibleForFreeMonthly: false,
      description: ''
    });
    reloadAdminData();
  };

  const handleConfirmPurgeAllToZero = async () => {
    await dataService.purgeAllDataToZero(currentUser.id, currentUser.name);
    setIsPurgeModalOpen(false);
    reloadAdminData();
    showToast('All customer balances, transactions, visits, and bookings have been purged to ZERO.', 'info');
  };

  const handleConfirmResetToFactory = async () => {
    await dataService.resetToFactoryDefaults(currentUser.id, currentUser.name);
    setIsFactoryResetModalOpen(false);
    reloadAdminData();
    showToast('All café inventory, rewards, and demo accounts restored to factory defaults!', 'success');
  };

  // Calculations
  const totalRevenue = financeTransactions
    .filter((f) => f.type === 'revenue')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = financeTransactions
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const verifiedVisitsToday = visitsHistory.filter((v) => v.status === 'verified').length;
  const activeVouchersCount = redemptions.filter((r) => r.status === 'issued').length;

  const categories = ['ALL', 'Coffee', 'Slow Bar', 'Cold Coffee', 'Thickshakes & Non-Coffee', 'Bakery', 'Mojitos', 'Bites', 'Burgers', 'Wraps', 'Combos', 'Sweet Pause'];

  const filteredMenuItems = menuItems.filter((m) => {
    const matchCat = activeMenuCategory === 'ALL' || m.category === activeMenuCategory;
    const matchSearch =
      !menuSearchQuery.trim() ||
      m.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar-header">
            <img src={logoLightImg} alt="Pause" style={{ height: '36px', width: 'auto' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Pause Admin</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-parchment)', fontFamily: 'var(--font-mono)' }}>Fast Staff Gate</div>
            </div>
          </div>

          <nav className="admin-nav-list">
            <button
              className={`admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveTab('scanner')}
            >
              <Hash size={18} />
              <span>Kinkoo Validation</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'rewards' ? 'active' : ''}`}
              onClick={() => setActiveTab('rewards')}
            >
              <Ticket size={18} />
              <span>Rewards & Vouchers</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <CalendarDays size={18} />
              <span>Experience Events</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <Coffee size={18} />
              <span>Menu Items</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              <DollarSign size={18} />
              <span>Finance Ledger</span>
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <Users size={18} />
              <span>Community Contacts</span>
            </button>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: 'var(--color-parchment)', marginBottom: '0.4rem' }}>
            Staff: <strong>{currentUser.name}</strong>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn btn-cream btn-sm"
            style={{ width: '100%', marginBottom: '0.4rem', justifyContent: 'flex-start' }}
          >
            <ExternalLink size={14} /> View Café Site
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-sm"
            style={{ color: 'var(--color-crimson-spam)', width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={14} /> Lock & Exit
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main-content">
        <div className="admin-topbar">
          <div className="admin-title-group">
            <h1>
              {activeTab === 'overview' && 'Café Overview'}
              {activeTab === 'scanner' && 'Kinkoo Code Validation'}
              {activeTab === 'rewards' && 'Rewards Catalog & Customer Vouchers'}
              {activeTab === 'events' && 'Experience Events'}
              {activeTab === 'menu' && 'Menu Items Manager'}
              {activeTab === 'finance' && 'Finance Ledger'}
              {activeTab === 'community' && 'Community Contacts'}
            </h1>
            <p>
              {activeTab === 'overview' && 'Quick café metrics, recent visits, and instant management controls.'}
              {activeTab === 'scanner' && 'Validate the customer’s six-digit visit code at the counter (+100 Kinkoos) or verify vouchers.'}
              {activeTab === 'rewards' && 'Manage redemption items and consume customer reward vouchers.'}
              {activeTab === 'events' && 'Add or remove sessions shown on the customer Experience schedule.'}
              {activeTab === 'menu' && 'Manage beverages, dishes, prices, and stock availability.'}
              {activeTab === 'finance' && 'Record counter revenue, expenses, and track net café profit.'}
              {activeTab === 'community' && 'View people who joined the Pause Community from the café website.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              onClick={handleManualRefresh}
              className="btn btn-cream btn-sm"
              title="Synchronize all records and balances across browser tabs"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="btn btn-sm"
              style={{ backgroundColor: 'rgba(158, 42, 43, 0.12)', color: 'var(--color-crimson-spam)', border: '1px solid rgba(158, 42, 43, 0.3)' }}
              title="Zero Out All Data to 0"
            >
              <AlertOctagon size={14} /> Zero Out (0)
            </button>

            <button
              onClick={() => setIsFactoryResetModalOpen(true)}
              className="btn btn-sm"
              style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: 'var(--color-warm-amber)', border: '1px solid rgba(217, 119, 6, 0.3)' }}
              title="Reset to Factory Defaults"
            >
              <RotateCcw size={14} /> Factory Reset
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div>
            {/* 4 Core Metrics */}
            <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="admin-stat-card">
                <div className="stat-title">Points In Circulation</div>
                <div className="stat-value" style={{ color: 'var(--color-warm-amber)' }}>
                  {pointsInCirculation.toLocaleString()} K
                </div>
                <div className="stat-delta">Across {customers.length} registered guests</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Verified Physical Visits</div>
                <div className="stat-value" style={{ color: 'var(--color-sage)' }}>
                  {verifiedVisitsToday}
                </div>
                <div className="stat-delta">Counter verified visits</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Pending Vouchers</div>
                <div className="stat-value" style={{ color: 'var(--color-terracotta)' }}>
                  {activeVouchersCount}
                </div>
                <div className="stat-delta">Unconsumed reward vouchers</div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Net Café Profit</div>
                <div
                  className="stat-value"
                  style={{ color: netProfit >= 0 ? 'var(--color-sage)' : 'var(--color-crimson-spam)' }}
                >
                  {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                </div>
                <div className="stat-delta">Revenue: ₹{totalRevenue.toLocaleString()}</div>
              </div>
            </div>

            {/* Quick Actions & Validation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-xl)' }}>
              {/* Quick Code Validator Box */}
              <div className="card-parchment">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <Hash size={20} style={{ color: 'var(--color-espresso)' }} />
                  <h3 className="heading-md">Visit Code & Voucher Validator</h3>
                </div>
                <p className="body-small" style={{ marginBottom: 'var(--space-md)' }}>
                  Guest at the counter? Enter their six-digit visit code here or open the full validation terminal.
                </p>

                <form onSubmit={handleInspectToken} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    autoComplete="off"
                    className="form-input"
                    placeholder="Enter six-digit visit code"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '0.1em' }}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isCheckingVisit || isRecordingVisit}>
                    {isCheckingVisit ? 'Checking...' : 'Validate Code'}
                  </button>
                </form>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="btn btn-cream btn-sm"
                    style={{ flex: 1 }}
                  >
                    <ShieldCheck size={14} /> Full Scanner Terminal
                  </button>
                  <button
                    onClick={() => setIsFinanceModalOpen(true)}
                    className="btn btn-cream btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Plus size={14} /> Record Counter Sale
                  </button>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="card-parchment">
                <h3 className="heading-md" style={{ marginBottom: 'var(--space-md)' }}>
                  Quick Staff Shortcuts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="btn btn-terracotta btn-full"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Hash size={16} />
                    <span>Open Kinkoo Validation Terminal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className="btn btn-primary btn-full"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Ticket size={16} />
                    <span>Consume Customer Voucher</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="btn btn-cream btn-full"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Coffee size={16} />
                    <span>Manage Menu Items & Stock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Visits & Recent Finance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
              {/* Recent Physical Visits */}
              <div className="card-parchment">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <h3 className="heading-md">Recent Verified Visits</h3>
                  <button onClick={() => setActiveTab('scanner')} className="btn btn-sm btn-cream" style={{ fontSize: '0.75rem' }}>
                    View All
                  </button>
                </div>
                {visitsHistory.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Guest</th>
                          <th>Passkey</th>
                          <th>Status</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitsHistory.slice(0, 5).map((v) => (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 600 }}>{v.userName}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{v.tokenUsed}</td>
                            <td><StatusBadge status={v.status} /></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(v.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="body-small" style={{ color: 'var(--text-muted)' }}>No visits recorded yet today.</p>
                )}
              </div>

              {/* Recent Finance Transactions */}
              <div className="card-parchment">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <h3 className="heading-md">Recent Counter Sales & Expenses</h3>
                  <button onClick={() => setActiveTab('finance')} className="btn btn-sm btn-cream" style={{ fontSize: '0.75rem' }}>
                    View All
                  </button>
                </div>
                {financeTransactions.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Method</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financeTransactions.slice(0, 5).map((f) => (
                          <tr key={f.id}>
                            <td style={{ fontSize: '0.8rem' }}>{f.date}</td>
                            <td>{f.description}</td>
                            <td style={{ fontSize: '0.8rem' }}>{f.paymentMethod}</td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: f.type === 'revenue' ? 'var(--color-sage)' : 'var(--color-crimson-spam)'
                              }}
                            >
                              {f.type === 'revenue' ? '+' : '-'}₹{f.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="body-small" style={{ color: 'var(--text-muted)' }}>No transactions recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: KINKOO VALIDATION */}
        {/* ================================================================= */}
        {activeTab === 'scanner' && (
          <div>
            <div className="scanner-terminal-card" style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <ShieldCheck size={26} style={{ color: 'var(--color-sage)' }} />
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--color-espresso)' }}>
                    Physical Visit Code Validator
                  </h3>
                  <p className="body-small">
                    Customer presents their six-digit code on their phone. It expires after five minutes; enter it here to verify and grant +100 Kinkoos.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInspectToken} className="scanner-input-group">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="off"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', letterSpacing: '0.15em' }}
                  placeholder="Enter six-digit visit code"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <button type="submit" className="btn btn-primary btn-lg" disabled={isCheckingVisit || isRecordingVisit}>
                  {isCheckingVisit ? 'Checking...' : 'Validate Visit Code'}
                </button>
              </form>

              {scannerError && (
                <div
                  style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(158, 42, 43, 0.1)',
                    border: '1px solid var(--color-crimson-spam)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-crimson-spam)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: 'var(--space-lg)'
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{scannerError}</span>
                </div>
              )}

              {scannedTokenResult && (
                <div className="token-verification-result">
                  <div className="token-result-header">
                    <div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Guest Name
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-espresso)', fontWeight: 700 }}>
                        {scannedTokenResult.userName}
                      </div>
                    </div>
                    <StatusBadge status={scannedTokenResult.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', margin: 'var(--space-md) 0', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Token Code: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{scannedTokenResult.token}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Expires At: </span>
                      <span>{new Date(scannedTokenResult.expiresAt).toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Award Value: </span>
                      <strong style={{ color: 'var(--color-warm-amber)' }}>+100 Kinkoos</strong>
                    </div>
                  </div>

                  {scannedTokenResult.status === 'active' && (
                    <div className="scanner-actions">
                      <button onClick={handleMarkAsVisit} disabled={isRecordingVisit} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                        <CheckCircle2 size={18} />
                        <span>{isRecordingVisit ? 'ADDING KINKOOS...' : 'MARK AS VISIT (+100 Kinkoos)'}</span>
                      </button>
                      <button
                        onClick={handleFlagAsSpam}
                        disabled={isRecordingVisit}
                        className="btn btn-secondary btn-lg"
                        style={{ color: 'var(--color-crimson-spam)', borderColor: 'var(--color-crimson-spam)' }}
                      >
                        <AlertTriangle size={18} />
                        <span>FLAG AS SPAM</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visit Log Table */}
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-md)' }}>
              Complete Physical Visits Audit Log
            </h3>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Visit ID</th>
                    <th>Customer</th>
                    <th>Token Used</th>
                    <th>Status</th>
                    <th>Points</th>
                    <th>Verified By Staff</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {visitsHistory.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{v.id}</td>
                      <td style={{ fontWeight: 600 }}>{v.userName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{v.tokenUsed}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-sage)' }}>
                        +{v.kinkoosAwarded} K
                      </td>
                      <td>{v.verifiedByAdminName}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(v.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {visitsHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No physical visits recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: REWARDS & VOUCHERS */}
        {/* ================================================================= */}
        {activeTab === 'rewards' && (
          <div>
            {/* Quick Voucher Consumption Card */}
            <div className="card-parchment" style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <Ticket size={22} style={{ color: 'var(--color-terracotta)' }} />
                <h3 className="heading-md">Customer Voucher Quick Redemption</h3>
              </div>
              <p className="body-small" style={{ marginBottom: 'var(--space-md)' }}>
                Customer presenting a reward voucher code? Enter the 7-character code (e.g. RW-8492) to verify and consume it immediately.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: '500px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RW-8492"
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                />
                <button onClick={() => handleConsumeVoucher()} className="btn btn-primary">
                  Consume Voucher
                </button>
              </div>
            </div>

            {/* Claimed Vouchers Table */}
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-md)' }}>
              Active Customer Vouchers
            </h3>
            <div className="admin-table-container" style={{ marginBottom: 'var(--space-xl)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Voucher Code</th>
                    <th>Customer Name</th>
                    <th>Reward Claimed</th>
                    <th>Points Spent</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.code}</td>
                      <td style={{ fontWeight: 600 }}>{r.userName}</td>
                      <td>{r.rewardTitle}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.kinkooCost} K</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'issued' ? (
                          <button
                            onClick={() => handleConsumeVoucher(r.code)}
                            className="btn btn-primary btn-sm"
                          >
                            Consume & Serve
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Served</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {redemptions.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                        No vouchers claimed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Rewards Catalog */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="heading-md">Rewards Catalog Items</h3>
              <button
                onClick={() => {
                  setEditingReward({
                    id: `rw-${Date.now()}`,
                    title: 'New Reward Item',
                    description: 'Description of the item or experience.',
                    kinkooCost: 350,
                    category: 'Beverage',
                    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
                    isAvailable: true
                  });
                  setIsRewardModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Add Reward Item
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title & Category</th>
                    <th>Points Cost</th>
                    <th>Availability</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((rw) => (
                    <tr key={rw.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rw.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rw.category}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-warm-amber)' }}>
                        {rw.kinkooCost} Kinkoos
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleRewardAvailable(rw)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Click to toggle Available / Unavailable"
                        >
                          <StatusBadge status={rw.isAvailable ? 'available' : 'unavailable'} />
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingReward(rw);
                            setIsRewardModalOpen(true);
                          }}
                          className="btn btn-cream btn-sm"
                          style={{ marginRight: '6px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'reward', id: rw.id, name: rw.title })}
                          className="btn btn-cream btn-sm"
                          style={{ color: 'var(--color-crimson-spam)' }}
                          title="Delete Reward"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* EXPERIENCE EVENTS */}
        {/* ================================================================= */}
        {activeTab === 'events' && (
          <div>
            <div className="card-parchment" style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <CalendarDays size={21} style={{ color: 'var(--color-terracotta)' }} />
                <h2 className="heading-md">Add an Experience Event</h2>
              </div>
              <form onSubmit={handleAddExperience}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-title">Event title</label>
                    <input id="experience-title" className="form-input" required maxLength={100} value={newExperience.title} onChange={(event) => setNewExperience({ ...newExperience, title: event.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-subtitle">Subtitle</label>
                    <input id="experience-subtitle" className="form-input" maxLength={120} value={newExperience.subtitle} onChange={(event) => setNewExperience({ ...newExperience, subtitle: event.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-date">Date</label>
                    <input id="experience-date" className="form-input" type="date" required value={newExperience.date} onChange={(event) => setNewExperience({ ...newExperience, date: event.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-time">Time</label>
                    <input id="experience-time" className="form-input" required placeholder="10:00 AM – 11:30 AM" value={newExperience.time} onChange={(event) => setNewExperience({ ...newExperience, time: event.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-duration">Duration (minutes)</label>
                    <input id="experience-duration" className="form-input" type="number" min={1} required value={newExperience.durationMinutes} onChange={(event) => setNewExperience({ ...newExperience, durationMinutes: Number(event.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-capacity">Seat capacity</label>
                    <input id="experience-capacity" className="form-input" type="number" min={1} required value={newExperience.capacity} onChange={(event) => setNewExperience({ ...newExperience, capacity: Number(event.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="experience-cost">Kinkoos required</label>
                    <input id="experience-cost" className="form-input" type="number" min={0} required value={newExperience.kinkooRequired} onChange={(event) => setNewExperience({ ...newExperience, kinkooRequired: Number(event.target.value) })} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-lg)', color: 'var(--color-espresso)', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={newExperience.isEligibleForFreeMonthly} onChange={(event) => setNewExperience({ ...newExperience, isEligibleForFreeMonthly: event.target.checked })} />
                    Eligible for monthly visit reward
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="experience-description">Description</label>
                  <textarea id="experience-description" className="form-textarea" rows={3} required maxLength={1000} value={newExperience.description} onChange={(event) => setNewExperience({ ...newExperience, description: event.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary"><Plus size={15} /> Add Event</button>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <h2 className="heading-md">Customer Experience Schedule</h2>
              <span className="body-small">{experienceSlots.length} event{experienceSlots.length === 1 ? '' : 's'}</span>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date & Time</th>
                    <th>Seats</th>
                    <th>Kinkoos</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...experienceSlots].sort((first, second) => first.date.localeCompare(second.date)).map((slot) => (
                    <tr key={slot.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{slot.title}</div>
                        {slot.subtitle && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{slot.subtitle}</div>}
                      </td>
                      <td>{new Date(`${slot.date}T00:00:00`).toLocaleDateString()}<br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{slot.time} · {slot.durationMinutes} min</span></td>
                      <td>{slot.bookedCount} / {slot.capacity}</td>
                      <td>{slot.kinkooRequired} K</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" onClick={() => setItemToDelete({ type: 'experience', id: slot.id, name: slot.title })} className="btn btn-cream btn-sm" style={{ color: 'var(--color-crimson-spam)' }} aria-label={`Remove ${slot.title}`} title="Remove event">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {experienceSlots.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No experience events scheduled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MENU ITEMS */}
        {/* ================================================================= */}
        {activeTab === 'menu' && (
          <div>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-brown-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search drinks, dishes, ingredients..."
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  setEditingMenuItem({
                    id: `menu-${Date.now()}`,
                    name: 'New Café Special',
                    price: 180,
                    kinkooValue: 400,
                    category: 'Coffee',
                    description: 'Crafted with premium beans and milk.',
                    isAvailable: true,
                    isFeatured: false,
                    sortOrder: menuItems.length + 1
                  });
                  setIsMenuModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Add Menu Item
              </button>
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: 'var(--space-md)' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveMenuCategory(cat)}
                  className={`btn btn-sm ${activeMenuCategory === cat ? 'btn-primary' : 'btn-cream'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Name & Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Kinkoo Value</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenuItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description.slice(0, 60)}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{item.category}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{item.price}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.kinkooValue ? `${item.kinkooValue} K` : '—'}</td>
                      <td>
                        <button
                          onClick={() => handleToggleMenuAvailable(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Click to toggle Available / Sold Out"
                        >
                          <StatusBadge status={item.isAvailable ? 'available' : 'sold_out'} />
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingMenuItem(item);
                            setIsMenuModalOpen(true);
                          }}
                          className="btn btn-cream btn-sm"
                          style={{ marginRight: '6px' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'menu', id: item.id, name: item.name })}
                          className="btn btn-cream btn-sm"
                          style={{ color: 'var(--color-crimson-spam)' }}
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No menu items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: FINANCE LEDGER */}
        {/* ================================================================= */}
        {activeTab === 'finance' && (
          <div>
            <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="admin-stat-card">
                <div className="stat-title">Total Revenue</div>
                <div className="stat-value" style={{ color: 'var(--color-sage)' }}>₹{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-title">Total Expenses</div>
                <div className="stat-value" style={{ color: 'var(--color-crimson-spam)' }}>₹{totalExpenses.toLocaleString()}</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-title">Net Café Profit</div>
                <div className="stat-value" style={{ color: netProfit >= 0 ? 'var(--color-sage)' : 'var(--color-crimson-spam)' }}>
                  {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="heading-md">Finance Transaction Log</h3>
              <button onClick={() => setIsFinanceModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} /> Add Transaction
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financeTransactions.map((f) => (
                    <tr key={f.id}>
                      <td>{f.date}</td>
                      <td><StatusBadge status={f.type} /></td>
                      <td>{f.category}</td>
                      <td>{f.description}</td>
                      <td>{f.paymentMethod}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: f.type === 'revenue' ? 'var(--color-sage)' : 'var(--color-crimson-spam)' }}>
                        {f.type === 'revenue' ? '+' : '-'}₹{f.amount.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setItemToDelete({ type: 'finance', id: f.id, name: `${f.description || f.category} (₹${f.amount})` })}
                          className="btn btn-cream btn-sm"
                          style={{ color: 'var(--color-crimson-spam)' }}
                          title="Void / Delete Transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {financeTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No financial transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: COMMUNITY CONTACTS */}
        {/* ================================================================= */}
        {activeTab === 'community' && (
          <div>
            <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="admin-stat-card">
                <div className="stat-title">Community Members</div>
                <div className="stat-value" style={{ color: 'var(--color-warm-amber)' }}>{communityContacts.length}</div>
                <div className="stat-delta">People connected through the website</div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <h3 className="heading-md">Pause Community Signups</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Contact details collected from the community page.
              </p>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {communityContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td style={{ fontWeight: 600 }}>{contact.name}</td>
                      <td>{contact.email}</td>
                      <td>{contact.phone || 'Not provided'}</td>
                      <td>{new Date(contact.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {communityContacts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No community contacts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODALS */}
      {/* ================================================================= */}

      {/* MODAL: MENU ITEM EDIT */}
      <Modal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        title={editingMenuItem?.name ? 'Edit Menu Item' : 'New Menu Item'}
      >
        {editingMenuItem && (
          <form onSubmit={(e) => {
            e.preventDefault();
            dataService.saveMenuItem(currentUser.id, currentUser.name, editingMenuItem);
            showToast('Menu item saved!', 'success');
            setIsMenuModalOpen(false);
            reloadAdminData();
          }}>
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={editingMenuItem.name}
                onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={editingMenuItem.price}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kinkoo Redemption Value</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingMenuItem.kinkooValue}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, kinkooValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={editingMenuItem.category}
                onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value as any })}
              >
                <option value="Coffee">Coffee</option>
                <option value="Slow Bar">Slow Bar</option>
                <option value="Cold Coffee">Cold Coffee</option>
                <option value="Thickshakes & Non-Coffee">Thickshakes & Non-Coffee</option>
                <option value="Bakery">Bakery</option>
                <option value="Mojitos">Mojitos</option>
                <option value="Bites">Bites</option>
                <option value="Burgers">Burgers</option>
                <option value="Wraps">Wraps</option>
                <option value="Combos">Combos</option>
                <option value="Sweet Pause">Sweet Pause</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Tasting Notes</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={editingMenuItem.description || ''}
                onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingMenuItem.isAvailable}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isAvailable: e.target.checked })}
                />
                <span>Available in Stock</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingMenuItem.isFeatured}
                  onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isFeatured: e.target.checked })}
                />
                <span>Featured on Homepage</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Save Menu Item
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: REWARD EDIT */}
      <Modal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        title={editingReward?.title ? 'Edit Reward' : 'New Reward'}
      >
        {editingReward && (
          <form onSubmit={(e) => {
            e.preventDefault();
            dataService.saveRewardItem(currentUser.id, currentUser.name, editingReward);
            showToast('Reward item saved!', 'success');
            setIsRewardModalOpen(false);
            reloadAdminData();
          }}>
            <div className="form-group">
              <label className="form-label">Reward Title</label>
              <input
                type="text"
                required
                className="form-input"
                value={editingReward.title}
                onChange={(e) => setEditingReward({ ...editingReward, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Kinkoo Cost</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={editingReward.kinkooCost}
                  onChange={(e) => setEditingReward({ ...editingReward, kinkooCost: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingReward.category || 'Beverage'}
                  onChange={(e) => setEditingReward({ ...editingReward, category: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={editingReward.description}
                onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editingReward.isAvailable}
                  onChange={(e) => setEditingReward({ ...editingReward, isAvailable: e.target.checked })}
                />
                <span>Available for Redemption</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Save Reward
            </button>
          </form>
        )}
      </Modal>

      {/* MODAL: FINANCE TRANSACTION */}
      <Modal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        title="Record Financial Transaction"
      >
        <form onSubmit={handleAddFinance}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={newFinance.type}
                onChange={(e) => setNewFinance({ ...newFinance, type: e.target.value as any })}
              >
                <option value="revenue">Revenue (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                required
                className="form-input"
                value={newFinance.amount}
                onChange={(e) => setNewFinance({ ...newFinance, amount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={newFinance.date}
                onChange={(e) => setNewFinance({ ...newFinance, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={newFinance.paymentMethod}
                onChange={(e) => setNewFinance({ ...newFinance, paymentMethod: e.target.value as any })}
              >
                <option value="UPI / Online">UPI / Online</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={newFinance.category}
              onChange={(e) => setNewFinance({ ...newFinance, category: e.target.value as any })}
            >
              <option value="Beverages">Beverages</option>
              <option value="Coffee Beans">Coffee Beans</option>
              <option value="Workshops">Workshops</option>
              <option value="Bakery & Sides">Bakery & Sides</option>
              <option value="Equipment & Maintenance">Equipment & Maintenance</option>
              <option value="Packaging & Supplies">Packaging & Supplies</option>
              <option value="Utilities & Rent">Utilities & Rent</option>
              <option value="Staff & Wages">Staff & Wages</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Counter sales / Bean shipment"
              value={newFinance.description}
              onChange={(e) => setNewFinance({ ...newFinance, description: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            Save Entry
          </button>
        </form>
      </Modal>

      {/* MODAL: CONFIRM DELETION */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Confirm Record Deletion"
        subtitle={`Permanently remove ${itemToDelete?.name}?`}
      >
        <div style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          This operation will immediately remove this entry from the café database.
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button onClick={() => setItemToDelete(null)} className="btn btn-secondary btn-full">
            Cancel
          </button>
          <button
            onClick={handleConfirmDeleteItem}
            className="btn btn-full"
            style={{ backgroundColor: 'var(--color-crimson-spam)', color: '#fff', fontWeight: 600 }}
          >
            Confirm Delete
          </button>
        </div>
      </Modal>

      {/* MODAL: CONFIRM ZERO OUT (PURGE ALL TO 0) */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Zero Out All Operational Data"
        subtitle="Bring all customer balances, visits, vouchers, and ledger to 0"
      >
        <div
          style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(158, 42, 43, 0.1)',
            border: '1px solid var(--color-crimson-spam)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-crimson-spam)', fontWeight: 700, marginBottom: '0.4rem' }}>
            <AlertOctagon size={18} />
            <span>Clean Slate Reset</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
            This will reset all customer Kinkoo balances to 0, clear all central ledger transactions, wipe all physical visit scans and passkeys, and reset financial logs to 0.
            Menu items and rewards catalog remain intact.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button onClick={() => setIsPurgeModalOpen(false)} className="btn btn-secondary btn-full">
            Cancel
          </button>
          <button
            onClick={handleConfirmPurgeAllToZero}
            className="btn btn-full"
            style={{ backgroundColor: 'var(--color-crimson-spam)', color: '#fff', fontWeight: 700 }}
          >
            Confirm Zero Out
          </button>
        </div>
      </Modal>

      {/* MODAL: CONFIRM FACTORY RESET */}
      <Modal
        isOpen={isFactoryResetModalOpen}
        onClose={() => setIsFactoryResetModalOpen(false)}
        title="Reset System to Factory Defaults"
        subtitle="Restore original curated Pause starter database"
      >
        <div
          style={{
            padding: 'var(--space-md)',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid var(--color-warm-amber)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warm-amber)', fontWeight: 700, marginBottom: '0.4rem' }}>
            <RotateCcw size={18} />
            <span>Factory Reset</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
            This will restore all default coffee items, rewards catalog, starter experiences, offers, and sample member accounts to their factory state.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button onClick={() => setIsFactoryResetModalOpen(false)} className="btn btn-secondary btn-full">
            Cancel
          </button>
          <button
            onClick={handleConfirmResetToFactory}
            className="btn btn-primary btn-full"
          >
            Reset to Factory
          </button>
        </div>
      </Modal>
    </div>
  );
};
