const { createHash, randomInt } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { calculateLedgerBalance, validateMonthlyVisitAward, canAwardMonthlyVisit, validateRewardRedemption } = require('./loyaltyRules');

initializeApp();

const db = getFirestore();
const TOKEN_TTL_MS = 5 * 60 * 1000;
const VISIT_REWARD = 100;
const WEEKLY_GIFT = 100;
const DEFAULT_REWARDS = {
  'rew-1': { title: 'Any Classic Espresso Beverage (Hot or Iced)', kinkooCost: 500, isAvailable: true, stock: 999 },
  'rew-2': { title: 'Behind-The-Bar Coffee Making Experience', kinkooCost: 600, isAvailable: true, stock: 50 },
  'rew-3': { title: 'Spanish Latte (Iced) or Cold Coffee', kinkooCost: 550, isAvailable: true, stock: 200 },
  'rew-4': { title: 'Fresh Strawberry Thickshake', kinkooCost: 550, isAvailable: true, stock: 120 },
  'rew-5': { title: 'Artisanal Bomboloni or Fresh Brownie', kinkooCost: 500, isAvailable: true, stock: 60 }
};

const requireUser = (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  return request.auth;
};

const requireAdmin = async (request) => {
  const auth = requireUser(request);
  const adminSnapshot = await db.collection('admins').doc(auth.uid).get();
  if (!adminSnapshot.exists || adminSnapshot.data()?.active !== true) {
    throw new HttpsError('permission-denied', 'Authorized café staff only.');
  }
  return { auth, profile: adminSnapshot.data() };
};

const normalizeCode = (value) => {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Enter a visit pass.');
  const code = value.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'This is not a valid visit pass.');
  }
  return code;
};

const tokenDocumentId = (code) => createHash('sha256').update(code).digest('hex');
const BUSINESS_TIME_ZONE = 'Asia/Kolkata';
const businessDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, Number(value)]));
};
const currentMonth = () => {
  const { year, month } = businessDateParts();
  return `${year}-${String(month).padStart(2, '0')}`;
};
const businessMonth = (value) => {
  const date = value?.toDate?.() ?? (value instanceof Date ? value : new Date(value));
  if (Number.isNaN(date.getTime())) return null;
  const { year, month } = businessDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}`;
};
const monthStartTimestamp = () => {
  const { year, month } = businessDateParts();
  // India is UTC+05:30; local midnight on the first is the previous day at 18:30 UTC.
  return Timestamp.fromDate(new Date(Date.UTC(year, month - 1, 1) - (5.5 * 60 * 60 * 1000)));
};
const currentWeek = () => {
  const { year, month, day: date } = businessDateParts();
  const businessDate = new Date(Date.UTC(year, month - 1, date));
  const day = businessDate.getUTCDay() || 7;
  businessDate.setUTCDate(businessDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(businessDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((businessDate - yearStart) / 86400000) + 1) / 7);
  return `${businessDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};
const toIso = (value) => value?.toDate?.().toISOString() ?? (typeof value === 'string' ? value : null);

const readAccountBalance = async (transaction, userId) => {
  const accountRef = db.collection('kinkooAccounts').doc(userId);
  const accountSnapshot = await transaction.get(accountRef);
  if (accountSnapshot.exists) {
    const balance = accountSnapshot.data().balance;
    if (!Number.isSafeInteger(balance) || balance < 0) {
      throw new HttpsError('failed-precondition', 'Your Kinkoo account balance needs staff review.');
    }
    return { accountRef, balance };
  }
  const ledgerSnapshot = await transaction.get(db.collection('ledger').where('userId', '==', userId));
  const balance = calculateLedgerBalance(ledgerSnapshot.docs.map((entry) => entry.data()));
  return { accountRef, balance: Math.max(0, balance) };
};

const writeAccountBalance = (transaction, accountRef, userId, balance) => {
  transaction.set(accountRef, { userId, balance, updatedAt: FieldValue.serverTimestamp() });
};

exports.createVisitToken = onCall(async (request) => {
  const auth = requireUser(request);
  const code = String(randomInt(100000, 1000000));
  const tokenId = tokenDocumentId(code);
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + TOKEN_TTL_MS);
  const userName = typeof auth.token.name === 'string' ? auth.token.name : '';
  const visitsRef = db.collection('visits');
  const newTokenRef = visitsRef.doc(tokenId);

  await db.runTransaction(async (transaction) => {
    transaction.create(newTokenRef, {
      recordType: 'visit_pass',
      tokenId,
      userId: auth.uid,
      userName,
      status: 'active',
      createdAt: now,
      expiresAt
    });
  });

  return {
    token: code,
    userId: auth.uid,
    userName,
    createdAt: now.toDate().toISOString(),
    expiresAt: expiresAt.toDate().toISOString(),
    status: 'active'
  };
});

exports.inspectVisitToken = onCall(async (request) => {
  await requireAdmin(request);
  const code = normalizeCode(request.data?.token);
  const tokenRef = db.collection('visits').doc(tokenDocumentId(code));
  const inspection = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(tokenRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Visit pass not found.');
    const token = snapshot.data();
    if (token.recordType !== 'visit_pass') {
      return { error: 'This visit pass has already been processed.' };
    }
    if (token.status !== 'active') {
      return { error: token.status === 'verified' || token.status === 'used'
        ? 'This visit pass has already been processed.'
        : 'Visit pass is inactive.' };
    }
    if (!token.expiresAt || typeof token.expiresAt.toMillis !== 'function') {
      return { error: 'This visit pass has an invalid expiration and cannot be used.' };
    }
    const expiresAtMs = token.expiresAt.toMillis();
    const nowMs = Date.now();
    if (nowMs >= expiresAtMs) {
      transaction.update(tokenRef, { status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      return { error: 'Visit pass expired.' };
    }
    return { token };
  });
  if (inspection.error) throw new HttpsError('failed-precondition', inspection.error);
  const token = inspection.token;

  return {
    token: code,
    userId: token.userId,
    userName: token.userName,
    createdAt: toIso(token.createdAt),
    expiresAt: toIso(token.expiresAt),
    status: token.status
  };
});

exports.verifyVisitToken = onCall(async (request) => {
  const { auth, profile } = await requireAdmin(request);
  const code = normalizeCode(request.data?.token);
  const note = typeof request.data?.notes === 'string' ? request.data.notes.slice(0, 500) : '';
  const tokenId = tokenDocumentId(code);
  const visitRef = db.collection('visits').doc(tokenId);
  const transactionRef = db.collection('ledger').doc(`visit_${tokenId}`);
  const monthKey = currentMonth();

  const visit = await db.runTransaction(async (transaction) => {
    const tokenSnapshot = await transaction.get(visitRef);
    if (!tokenSnapshot.exists) throw new HttpsError('not-found', 'Visit pass not found.');
    const token = tokenSnapshot.data();
    const existingAward = await transaction.get(transactionRef);
    const account = await readAccountBalance(transaction, token.userId);
    const monthlyCountRef = db.collection('kinkooMonthlyVisits').doc(`${token.userId}_${monthKey}`);
    const monthlyCountSnapshot = await transaction.get(monthlyCountRef);

    const monthVisitsQuery = db.collection('visits')
      .where('userId', '==', token.userId)
      .where('timestamp', '>=', monthStartTimestamp());
    const monthVisitsSnapshot = monthlyCountSnapshot.exists ? null : await transaction.get(monthVisitsQuery);
    const monthlyCount = monthlyCountSnapshot.exists ? monthlyCountSnapshot.data() : {};
    const monthlyVerifiedVisits = monthlyCountSnapshot.exists
      ? (Number.isSafeInteger(monthlyCount.verifiedVisits) && monthlyCount.verifiedVisits >= 0 ? monthlyCount.verifiedVisits : 0)
      : monthVisitsSnapshot.docs.filter((document) => document.data().status === 'verified').length;
    // Older counters treated every verified visit as an awarded visit because the
    // prior implementation stopped visits after six. Keep that value as the
    // migration fallback until the first new-format counter write.
    const monthlyAwardedValue = monthlyCount.awardedVisits ?? monthlyCount.verifiedVisits;
    const monthlyAwardedVisits = monthlyCountSnapshot.exists
      ? (Number.isSafeInteger(monthlyAwardedValue) && monthlyAwardedValue >= 0 ? monthlyAwardedValue : 0)
      : monthlyVerifiedVisits;

    if (token.recordType !== 'visit_pass' || existingAward.exists || token.status !== 'active') {
      throw new HttpsError('already-exists', 'This visit pass has already been processed.');
    }
    if (!token.expiresAt || typeof token.expiresAt.toMillis !== 'function') {
      throw new HttpsError('failed-precondition', 'This visit pass has an invalid expiration and cannot be used.');
    }
    const expiresAtMs = token.expiresAt.toMillis();
    const nowMs = Date.now();
    if (nowMs >= expiresAtMs) {
      transaction.update(visitRef, { status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      return { error: 'Visit pass expired. Ask the customer to generate a new one.' };
    }
    const monthlyAwardError = validateMonthlyVisitAward(monthlyAwardedVisits);
    if (monthlyAwardError) throw new HttpsError('failed-precondition', monthlyAwardError);

    const awardVisit = canAwardMonthlyVisit(monthlyAwardedVisits);
    const awardedKinkoos = awardVisit ? VISIT_REWARD : 0;

    const now = FieldValue.serverTimestamp();
    const responseTimestamp = new Date().toISOString();
    const visitData = {
      userId: token.userId,
      userName: token.userName,
      tokenId,
      timestamp: now,
      status: 'verified',
      kinkoosAwarded: awardedKinkoos,
      verifiedByAdminId: auth.uid,
      verifiedByAdminName: profile.displayName || auth.token.name || auth.token.email || 'Café Staff',
      notes: note
    };
    const transactionData = {
      userId: token.userId,
      userName: token.userName,
      amount: awardedKinkoos,
      type: 'VISIT_REWARD',
      description: 'Physical Café Visit Verification',
      referenceId: tokenId,
      timestamp: now,
      createdBy: auth.uid
    };

    transaction.update(visitRef, {
      recordType: 'verified_visit',
      tokenId,
      status: 'verified',
      timestamp: now,
      kinkoosAwarded: VISIT_REWARD,
      verifiedByAdminName: profile.displayName || auth.token.name || auth.token.email || 'CafÃ© Staff',
      verifiedAt: now,
      verifiedByAdminId: auth.uid,
      notes: note,
      updatedAt: now
    });
    if (awardVisit) {
      transaction.create(transactionRef, transactionData);
      writeAccountBalance(transaction, account.accountRef, token.userId, account.balance + VISIT_REWARD);
    }
    transaction.set(monthlyCountRef, {
      userId: token.userId,
      month: monthKey,
      verifiedVisits: monthlyVerifiedVisits + 1,
      awardedVisits: monthlyAwardedVisits + (awardVisit ? 1 : 0),
      updatedAt: now
    });

    return { ...visitData, id: tokenId, timestamp: responseTimestamp };
  });
  if (visit.error) throw new HttpsError('failed-precondition', visit.error);

  return {
    success: true,
    visit: {
      ...visit,
      timestamp: new Date().toISOString(),
      verifiedByAdminName: profile.displayName || auth.token.name || auth.token.email || 'Café Staff'
    }
  };
});

exports.flagVisitToken = onCall(async (request) => {
  const { auth } = await requireAdmin(request);
  const code = normalizeCode(request.data?.token);
  const tokenId = tokenDocumentId(code);
  const tokenRef = db.collection('visits').doc(tokenId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(tokenRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Visit pass not found.');
    if (snapshot.data().recordType !== 'visit_pass' || snapshot.data().status !== 'active') {
      throw new HttpsError('failed-precondition', 'Only active visit passes can be flagged.');
    }
    transaction.update(tokenRef, {
      status: 'flagged_spam',
      verifiedByAdminId: auth.uid,
      notes: 'Flagged by café staff',
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return { success: true };
});

exports.getMyKinkooData = onCall(async (request) => {
  const auth = requireUser(request);
  const [visitsSnapshot, transactionsSnapshot, accountSnapshot] = await Promise.all([
    db.collection('visits').where('userId', '==', auth.uid).orderBy('timestamp', 'desc').get(),
    db.collection('ledger').where('userId', '==', auth.uid).orderBy('timestamp', 'desc').get(),
    db.collection('kinkooAccounts').doc(auth.uid).get()
  ]);
  const monthKey = currentMonth();
  const weekKey = currentWeek();
  const transactions = transactionsSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
    timestamp: toIso(document.data().timestamp)
  }));
  const currentMonthVisits = visitsSnapshot.docs
    .map((document) => document.data())
    .filter((visit) => visit.status === 'verified' && businessMonth(visit.timestamp) === monthKey).length;
  const ledgerBalance = calculateLedgerBalance(transactions);
  const storedBalance = accountSnapshot.data()?.balance;
  const currentBalance = Number.isSafeInteger(storedBalance) && storedBalance >= 0 ? storedBalance : ledgerBalance;
  const lifetimeEarned = transactions.reduce((total, transaction) => total + Math.max(0, Number(transaction.amount) || 0), 0);
  const lifetimeSpent = transactions.reduce((total, transaction) => total + Math.max(0, -(Number(transaction.amount) || 0)), 0);

  return {
    balance: {
      currentBalance,
      lifetimeEarned,
      lifetimeSpent,
      monthlyVisits: currentMonthVisits,
      monthlyVisitsTarget: 6,
      hasEarnedMonthlyExperience: currentMonthVisits >= 6,
      claimedWeeklyGiftThisWeek: transactions.some((transaction) =>
        transaction.type === 'WEEKLY_GIFT' && transaction.referenceId === weekKey
      )
    },
    visits: visitsSnapshot.docs
      .filter((document) => document.data().recordType !== 'visit_pass')
      .map((document) => ({ id: document.id, ...document.data(), timestamp: toIso(document.data().timestamp) })),
    transactions
  };
});

exports.listVisitsForAdmin = onCall(async (request) => {
  await requireAdmin(request);
  const snapshot = await db.collection('visits').orderBy('timestamp', 'desc').limit(500).get();
  return {
    visits: snapshot.docs.filter((document) => document.data().recordType !== 'visit_pass').map((document) => {
      const visit = document.data();
      return {
        id: document.id,
        userId: visit.userId,
        userName: visit.userName,
        tokenUsed: visit.tokenId,
        timestamp: toIso(visit.timestamp),
        status: visit.status,
        kinkoosAwarded: visit.kinkoosAwarded,
        verifiedByAdminId: visit.verifiedByAdminId,
        verifiedByAdminName: visit.verifiedByAdminName,
        notes: visit.notes
      };
    })
  };
});

exports.purgeKinkooData = onCall(async (request) => {
  await requireAdmin(request);
  const collectionNames = [
    'visits',
    'ledger',
    'redemptions',
    'kinkooAccounts',
    'kinkooMonthlyVisits',
    'kinkooRewardClaims'
  ];
  for (const collectionName of collectionNames) {
    const collectionRef = db.collection(collectionName);
    let snapshot = await collectionRef.limit(450).get();
    while (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((document) => batch.delete(document.ref));
      await batch.commit();
      snapshot = await collectionRef.limit(450).get();
    }
  }
  return { success: true };
});

exports.claimWeeklyKinkoos = onCall(async (request) => {
  const auth = requireUser(request);
  const week = currentWeek();
  const claimRef = db.collection('ledger').doc(`weekly_${auth.uid}_${week}`);
  const result = await db.runTransaction(async (transaction) => {
    const claimSnapshot = await transaction.get(claimRef);
    if (claimSnapshot.exists) return { success: false, alreadyClaimed: true };
    const account = await readAccountBalance(transaction, auth.uid);
    transaction.create(claimRef, {
      userId: auth.uid,
      userName: auth.token.name || auth.token.email || 'Pause Member',
      amount: WEEKLY_GIFT,
      type: 'WEEKLY_GIFT',
      description: `Weekly Free Kinkoos Gift (${week})`,
      referenceId: week,
      timestamp: FieldValue.serverTimestamp(),
      createdBy: 'Weekly Gift System'
    });
    writeAccountBalance(transaction, account.accountRef, auth.uid, account.balance + WEEKLY_GIFT);
    return { success: true, amount: WEEKLY_GIFT, balance: account.balance + WEEKLY_GIFT };
  });
  return result.success ? result : { ...result, error: "You've already claimed this week's Kinkoos." };
});

exports.redeemKinkooReward = onCall(async (request) => {
  const auth = requireUser(request);
  const rewardId = typeof request.data?.rewardId === 'string' ? request.data.rewardId.trim() : '';
  if (!rewardId) throw new HttpsError('invalid-argument', 'Choose a reward to redeem.');

  const rewardRef = db.collection('rewards').doc(rewardId);
  const redemptionRef = db.collection('redemptions').doc();
  const rewardClaimRef = db.collection('kinkooRewardClaims')
    .doc(createHash('sha256').update(`${auth.uid}:${rewardId}`).digest('hex'));
  const nowMs = Date.now();
  const code = `RW-${randomInt(100000, 1000000)}`;
  const createdAt = Timestamp.fromMillis(nowMs);
  const expiresAt = Timestamp.fromMillis(nowMs + 10 * 86400000);
  const userName = typeof auth.token.name === 'string'
    ? auth.token.name
    : (typeof auth.token.email === 'string' ? auth.token.email.split('@')[0] : 'Pause Member');

  return db.runTransaction(async (transaction) => {
    const [rewardSnapshot, account, redemptionsSnapshot, rewardClaimSnapshot] = await Promise.all([
      transaction.get(rewardRef),
      readAccountBalance(transaction, auth.uid),
      transaction.get(db.collection('redemptions').where('userId', '==', auth.uid)),
      transaction.get(rewardClaimRef)
    ]);
    const reward = rewardSnapshot.exists ? rewardSnapshot.data() : DEFAULT_REWARDS[rewardId];
    if (!reward) throw new HttpsError('not-found', 'Reward item not found.');
    const cost = reward.kinkooCost;
    const balance = account.balance;
    const redemptionError = validateRewardRedemption({ balance, cost, isAvailable: reward.isAvailable, stock: reward.stock });
    if (redemptionError) throw new HttpsError('failed-precondition', redemptionError);

    const activeRedemption = redemptionsSnapshot.docs.some((entry) => {
      const data = entry.data();
      const expiry = data.expiresAt?.toMillis?.() ?? Date.parse(data.expiresAt || '');
      return data.rewardId === rewardId
        && !['verified_consumed', 'cancelled', 'expired'].includes(data.status)
        && expiry > nowMs;
    });
    if (activeRedemption) throw new HttpsError('already-exists', 'You already have an active voucher for this reward.');
    const priorExpiry = rewardClaimSnapshot.data()?.expiresAt?.toMillis?.() ?? 0;
    if (rewardClaimSnapshot.exists && priorExpiry > nowMs) {
      throw new HttpsError('already-exists', 'You already have an active voucher for this reward.');
    }

    const ledgerRef = db.collection('ledger').doc(`redemption_${redemptionRef.id}`);
    const redemption = {
      id: redemptionRef.id,
      code,
      rewardId,
      rewardTitle: String(reward.title || 'Pause Reward'),
      kinkooCost: cost,
      userId: auth.uid,
      userName,
      status: 'issued',
      createdAt,
      expiresAt
    };
    transaction.create(ledgerRef, {
      userId: auth.uid,
      userName,
      amount: -cost,
      type: 'REDEMPTION',
      description: `Redeemed: ${redemption.rewardTitle}`,
      referenceId: redemptionRef.id,
      timestamp: createdAt,
      createdBy: 'Rewards System'
    });
    writeAccountBalance(transaction, account.accountRef, auth.uid, balance - cost);
    transaction.create(redemptionRef, redemption);
    transaction.set(rewardClaimRef, { userId: auth.uid, rewardId, redemptionId: redemptionRef.id, expiresAt });
    if (rewardSnapshot.exists && reward.stock !== undefined) transaction.update(rewardRef, { stock: reward.stock - 1 });
    else if (!rewardSnapshot.exists) transaction.create(rewardRef, { ...reward, stock: reward.stock - 1 });

    return {
      success: true,
      balance: balance - cost,
      redemption: {
        ...redemption,
        createdAt: createdAt.toDate().toISOString(),
        expiresAt: expiresAt.toDate().toISOString()
      }
    };
  });
});

exports.consumeKinkooReward = onCall(async (request) => {
  const { auth, profile } = await requireAdmin(request);
  const code = typeof request.data?.code === 'string' ? request.data.code.trim().toUpperCase() : '';
  if (!/^RW-\d{4,6}$/.test(code)) throw new HttpsError('invalid-argument', 'Enter a valid reward voucher code.');
  const matches = await db.collection('redemptions').where('code', '==', code).limit(1).get();
  if (matches.empty) throw new HttpsError('not-found', 'Invalid redemption voucher code.');
  const redemptionRef = matches.docs[0].ref;

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(redemptionRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Invalid redemption voucher code.');
    const redemption = snapshot.data();
    if (redemption.status !== 'issued') throw new HttpsError('failed-precondition', `This voucher is ${redemption.status}.`);
    const expiresAt = redemption.expiresAt?.toMillis?.() ?? Date.parse(redemption.expiresAt || '');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      transaction.update(redemptionRef, { status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      return { success: false, error: 'This reward voucher has expired.' };
    }
    const rewardClaimRef = db.collection('kinkooRewardClaims')
      .doc(createHash('sha256').update(`${redemption.userId}:${redemption.rewardId}`).digest('hex'));
    const claimSnapshot = await transaction.get(rewardClaimRef);
    transaction.update(redemptionRef, {
      status: 'verified_consumed',
      consumedAt: FieldValue.serverTimestamp(),
      consumedByAdminId: auth.uid,
      consumedByAdminName: profile.displayName || auth.token.name || 'Cafe Staff',
      updatedAt: FieldValue.serverTimestamp()
    });
    if (claimSnapshot.exists && claimSnapshot.data().redemptionId === snapshot.id) {
      transaction.update(rewardClaimRef, { expiresAt: Timestamp.fromMillis(Date.now()) });
    }
    return { success: true, redemption: { ...redemption, status: 'verified_consumed', consumedByAdminId: auth.uid } };
  });
});

exports.getAdminKinkooSummary = onCall(async (request) => {
  await requireAdmin(request);
  const snapshot = await db.collection('ledger').get();
  return {
    pointsInCirculation: Math.max(0, snapshot.docs.reduce((total, document) => total + (Number(document.data().amount) || 0), 0)),
    memberAccounts: new Set(snapshot.docs.map((document) => document.data().userId).filter(Boolean)).size
  };
});
