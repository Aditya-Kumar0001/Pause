import { createHash, createPublicKey, randomInt, randomUUID, verify as verifySignature } from 'node:crypto';
import { openKinkooDatabase, inTransaction } from './sqliteStore.js';

const TOKEN_TTL_MS = 5 * 60 * 1000;
const WEEKLY_GIFT = 100;
const VISIT_REWARD = 100;
const MONTHLY_VISIT_LIMIT = 6;
const MINIMUM_REDEMPTION_BALANCE = 500;
let certificateCache;
let database;
const adminAuthorizationCache = new Map();
const ADMIN_AUTH_CACHE_TTL_MS = 30_000;
const SKIP_LEGACY_IMPORT_PATHS = new Set([
  '/api/kinkoo/visit-token',
  '/api/kinkoo/catalog',
  '/api/kinkoo/visit/inspect',
  '/api/kinkoo/visit/verify',
  '/api/kinkoo/visit/flag',
  '/api/kinkoo/reward/consume',
  '/api/kinkoo/catalog/sync',
  '/api/kinkoo/redemptions',
  '/api/kinkoo/admin/visits',
  '/api/kinkoo/admin/summary',
  '/api/kinkoo/admin/purge'
]);

const nowIso = () => new Date().toISOString();
const tokenHash = (value) => createHash('sha256').update(value).digest('hex');
const monthInBusinessZone = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit'
}).format(date);

function currentIsoWeek() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, Number(value)]));
  const date = new Date(Date.UTC(values.year, values.month - 1, values.day));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - firstDay) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function decodeFirestoreValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return null;
}

function decodeFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

function encodeFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isSafeInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFirestoreFields(value) } };
  return { stringValue: String(value) };
}

function encodeFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => {
    if (['timestamp', 'verifiedAt'].includes(key) && typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
      return [key, { timestampValue: new Date(value).toISOString() }];
    }
    return [key, encodeFirestoreValue(value)];
  }));
}

async function getFirebaseCertificates() {
  if (certificateCache && certificateCache.expiresAt > Date.now()) return certificateCache.certificates;
  const response = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error('Firebase sign-in verification is temporarily unavailable.');
  const result = await response.json();
  const certificates = new Map((result.keys || []).map((jwk) => [jwk.kid, createPublicKey({ key: jwk, format: 'jwk' })]));
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  certificateCache = { certificates, expiresAt: Date.now() + maxAge * 1000 };
  return certificates;
}

async function verifyFirebaseToken(token, projectId) {
  if (!projectId) throw new Error('Firebase project ID is not configured on the SQLite API server.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Sign in again to continue.');
  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Sign in again to continue.');
  }
  if (header.alg !== 'RS256' || !header.kid || claims.aud !== projectId
    || claims.iss !== `https://securetoken.google.com/${projectId}`
    || typeof claims.sub !== 'string' || claims.sub.length === 0
    || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000
    || !Number.isFinite(claims.iat) || claims.iat > Date.now() / 1000 + 60) {
    throw new Error('Sign in again to continue.');
  }
  const key = (await getFirebaseCertificates()).get(header.kid);
  if (!key || !verifySignature('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, Buffer.from(parts[2], 'base64url'))) {
    throw new Error('Sign in again to continue.');
  }
  return claims;
}

async function firestoreRequest(projectId, idToken, pathname, options = {}) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || `Firestore request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function readLegacyCollection(projectId, idToken, collectionId, userId) {
  const response = await firestoreRequest(projectId, idToken, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: userId } } }
      }
    })
  });
  return response.map((item) => item.document).filter(Boolean).map((document) => ({
    id: document.name.split('/').at(-1),
    ...decodeFirestoreFields(document.fields)
  }));
}

async function readLegacyBalance(projectId, idToken, userId) {
  try {
    const response = await firestoreRequest(projectId, idToken, `/kinkooAccounts/${encodeURIComponent(userId)}`);
    return decodeFirestoreFields(response.fields).balance;
  } catch {
    return 0;
  }
}

function ensureAccount(db, userId) {
  const now = nowIso();
  db.prepare(`INSERT OR IGNORE INTO accounts(user_id, balance, created_at, updated_at) VALUES (?, 0, ?, ?)`)
    .run(userId, now, now);
  return db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(userId);
}

function addLedgerEntry(db, entry) {
  db.prepare(`INSERT INTO ledger(id, user_id, user_name, amount, type, description, reference_id, timestamp, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(entry.id, entry.userId, entry.userName, entry.amount, entry.type, entry.description,
      entry.referenceId || null, entry.timestamp, entry.createdBy);
  db.prepare(`UPDATE accounts SET balance = balance + ?,
    lifetime_earned = lifetime_earned + ?, lifetime_spent = lifetime_spent + ?, updated_at = ? WHERE user_id = ?`)
    .run(entry.amount, Math.max(0, entry.amount), Math.max(0, -entry.amount), entry.timestamp, entry.userId);
}

async function importLegacyLoyalty(db, projectId, idToken, userId) {
  if (db.prepare('SELECT 1 FROM legacy_imports WHERE user_id=?').get(userId)) return;
  const [oldLedger, oldVisits, oldRedemptions, oldBalance] = await Promise.all([
    readLegacyCollection(projectId, idToken, 'ledger', userId),
    readLegacyCollection(projectId, idToken, 'visits', userId),
    readLegacyCollection(projectId, idToken, 'redemptions', userId),
    readLegacyBalance(projectId, idToken, userId)
  ]);

  inTransaction(db, () => {
    if (db.prepare('SELECT 1 FROM legacy_imports WHERE user_id=?').get(userId)) return;
    ensureAccount(db, userId);
    const insertLedger = db.prepare(`INSERT OR IGNORE INTO ledger
      (id,user_id,user_name,amount,type,description,reference_id,timestamp,created_by)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    for (const row of oldLedger) {
      if (!Number.isSafeInteger(row.amount)) continue;
      insertLedger.run(row.id, userId, String(row.userName || ''), row.amount, String(row.type || 'BONUS'),
        String(row.description || 'Imported Kinkoo transaction'), String(row.referenceId || row.id),
        String(row.timestamp || nowIso()), String(row.createdBy || 'Legacy import'));
    }

    const insertVisit = db.prepare(`INSERT OR IGNORE INTO visit_tokens
      (token_hash,user_id,user_name,status,created_at,expires_at,verified_at,verified_by_admin_id,
       verified_by_admin_name,kinkoos_awarded,notes) VALUES (?,?,?,'verified',?,?,?,?,?,?,?)`);
    const verified = oldVisits.filter((row) => row.status === 'verified' && row.recordType !== 'visit_pass');
    for (const visit of verified) {
      const id = String(visit.tokenId || visit.id);
      const hash = /^[a-f\d]{64}$/i.test(id) ? id : tokenHash(id);
      const timestamp = String(visit.timestamp || nowIso());
      insertVisit.run(hash, userId, String(visit.userName || ''), timestamp, timestamp, timestamp,
        String(visit.verifiedByAdminId || ''), String(visit.verifiedByAdminName || ''),
        Number.isSafeInteger(visit.kinkoosAwarded) ? visit.kinkoosAwarded : 0, String(visit.notes || ''));
    }

    const insertRedemption = db.prepare(`INSERT OR IGNORE INTO redemptions
      (id,code,reward_id,reward_title,kinkoo_cost,user_id,user_name,status,created_at,expires_at,
       consumed_at,consumed_by_admin_id,consumed_by_admin_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const row of oldRedemptions) {
      if (!row.id || !row.code || !row.rewardId || !Number.isSafeInteger(row.kinkooCost)) continue;
      insertRedemption.run(row.id, String(row.code), String(row.rewardId), String(row.rewardTitle || ''), row.kinkooCost,
        userId, String(row.userName || ''), String(row.status || 'issued'), String(row.createdAt || nowIso()),
        String(row.expiresAt || nowIso()), row.consumedAt || null, row.consumedByAdminId || null,
        row.consumedByAdminName || null);
    }

    const totals = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS balance,
      COALESCE(SUM(CASE WHEN amount>0 THEN amount ELSE 0 END),0) AS earned,
      COALESCE(SUM(CASE WHEN amount<0 THEN -amount ELSE 0 END),0) AS spent FROM ledger WHERE user_id=?`).get(userId);
    const balance = totals.count ? Math.max(0, totals.balance) : (Number.isSafeInteger(oldBalance) ? Math.max(0, oldBalance) : 0);
    db.prepare(`UPDATE accounts SET balance=?,lifetime_earned=?,lifetime_spent=?,updated_at=? WHERE user_id=?`)
      .run(balance, totals.earned, totals.spent, nowIso(), userId);

    const currentMonth = monthInBusinessZone();
    const monthVisits = verified.filter((visit) => {
      const time = new Date(visit.timestamp || '');
      return !Number.isNaN(time.getTime()) && monthInBusinessZone(time) === currentMonth;
    });
    if (monthVisits.length) {
      db.prepare(`INSERT OR REPLACE INTO monthly_visits(user_id,month_key,verified_visits,awarded_visits)
        VALUES (?,?,?,?)`).run(userId, currentMonth, monthVisits.length,
        Math.min(MONTHLY_VISIT_LIMIT, monthVisits.filter((visit) => Number(visit.kinkoosAwarded) > 0).length));
    }
    db.prepare('INSERT INTO legacy_imports(user_id,imported_at) VALUES (?,?)').run(userId, nowIso());
  });
}

async function requireAdmin(projectId, idToken, user) {
  const cacheKey = `${projectId}:${user.sub}`;
  const cached = adminAuthorizationCache.get(cacheKey);
  if (cached && (cached.pending || cached.expiresAt > Date.now())) {
    const displayName = await cached.promise;
    if (database) queuePendingVisitSyncs(projectId, idToken, database);
    return displayName;
  }
  if (cached) adminAuthorizationCache.delete(cacheKey);

  const entry = { pending: true, expiresAt: 0, promise: null };
  entry.promise = readAdminAuthorization(projectId, idToken, user);
  adminAuthorizationCache.set(cacheKey, entry);
  try {
    const displayName = await entry.promise;
    entry.pending = false;
    entry.expiresAt = Date.now() + ADMIN_AUTH_CACHE_TTL_MS;
    if (database) queuePendingVisitSyncs(projectId, idToken, database);
    return displayName;
  } catch (error) {
    if (adminAuthorizationCache.get(cacheKey) === entry) adminAuthorizationCache.delete(cacheKey);
    throw error;
  }
}

async function readAdminAuthorization(projectId, idToken, user) {
  try {
    const document = await firestoreRequest(projectId, idToken, `/admins/${encodeURIComponent(user.sub)}`);
    const admin = decodeFirestoreFields(document.fields);
    if (admin.active !== true) throw new Error('This admin account is inactive in Firestore.');
    if (admin.role !== 'admin') throw new Error('The Firestore admin record must have role set to "admin".');
    return String(admin.displayName || user.name || user.email || 'Café Staff');
  } catch (error) {
    if (error.message === 'This admin account is inactive in Firestore.'
      || error.message === 'The Firestore admin record must have role set to "admin".') throw error;
    if (error.status === 404) throw new Error('No Firestore admin record was found for this signed-in account.');
    if (error.status === 403) throw new Error('Firestore denied access to this admin record. Check the admins/{uid} read rule.');
    throw new Error('Could not read this account admin authorization from Firestore. Check the Firebase project settings and server logs.');
  }
}

function requireString(value, message) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(message);
  return value.trim();
}

async function readBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 64 * 1024) throw new Error('Request is too large.');
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Request body must be valid JSON.'); }
}

function send(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

function getBalanceState(db, userId) {
  const account = ensureAccount(db, userId);
  const currentMonth = monthInBusinessZone();
  const visits = db.prepare('SELECT * FROM monthly_visits WHERE user_id = ? AND month_key = ?').get(userId, currentMonth);
  const week = currentIsoWeek();
  const claimed = Boolean(db.prepare(`SELECT 1 FROM ledger WHERE user_id = ? AND type = 'WEEKLY_GIFT' AND reference_id = ?`)
    .get(userId, week));
  const verifiedVisits = visits?.verified_visits || 0;
  return {
    currentBalance: account.balance,
    lifetimeEarned: account.lifetime_earned,
    lifetimeSpent: account.lifetime_spent,
    monthlyVisits: verifiedVisits,
    monthlyVisitsTarget: MONTHLY_VISIT_LIMIT,
    hasEarnedMonthlyExperience: verifiedVisits >= MONTHLY_VISIT_LIMIT,
    claimedWeeklyGiftThisWeek: claimed
  };
}

function mapVisit(row) {
  return {
    id: row.token_hash,
    userId: row.user_id,
    userName: row.user_name,
    tokenUsed: row.token_hash,
    timestamp: row.verified_at,
    status: row.status,
    kinkoosAwarded: row.kinkoos_awarded,
    verifiedByAdminId: row.verified_by_admin_id,
    verifiedByAdminName: row.verified_by_admin_name,
    notes: row.notes
  };
}

async function syncVerifiedVisitToFirebase(projectId, idToken, row) {
  const documentPath = `/visits/${encodeURIComponent(`visit_${row.token_hash}`)}`;
  const visit = {
    recordType: 'verified_visit',
    userId: row.user_id,
    userName: row.user_name,
    tokenId: row.token_hash,
    timestamp: row.verified_at,
    status: 'verified',
    kinkoosAwarded: row.kinkoos_awarded,
    verifiedByAdminId: row.verified_by_admin_id,
    verifiedByAdminName: row.verified_by_admin_name,
    verifiedAt: row.verified_at,
    notes: row.notes || ''
  };
  try {
    await firestoreRequest(projectId, idToken, `${documentPath}?currentDocument.exists=false`, {
      method: 'PATCH',
      // The visit record is create-only in Firestore rules. Never overwrite a prior record.
      body: JSON.stringify({ fields: encodeFirestoreFields(visit) })
    });
  } catch (error) {
    if (error.status !== 409 && error.status !== 400) throw error;
    const existing = await firestoreRequest(projectId, idToken, documentPath);
    const fields = decodeFirestoreFields(existing.fields);
    if (fields.tokenId !== row.token_hash || fields.userId !== row.user_id) throw error;
  }
  database.prepare('UPDATE firebase_visit_outbox SET synced_at = ? WHERE token_hash = ?').run(nowIso(), row.token_hash);
}

const pendingVisitSyncs = new Map();

function queueVerifiedVisitSync(projectId, idToken, row) {
  const key = `${projectId}:${row.token_hash}`;
  if (pendingVisitSyncs.has(key)) return;

  const syncTask = (async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await syncVerifiedVisitToFirebase(projectId, idToken, row);
        return;
      } catch (error) {
        if (attempt === 2) {
          console.error('Firebase visit sync is still pending:', error.message);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  })().finally(() => pendingVisitSyncs.delete(key));

  pendingVisitSyncs.set(key, syncTask);
}

function queuePendingVisitSyncs(projectId, idToken, db) {
  const rows = db.prepare(`SELECT visits.* FROM visit_tokens AS visits
    INNER JOIN firebase_visit_outbox AS pending ON pending.token_hash = visits.token_hash
    WHERE pending.synced_at IS NULL`).all();
  rows.forEach((row) => queueVerifiedVisitSync(projectId, idToken, row));
}

function syncCatalog(db, requestBody) {
  const rewards = Array.isArray(requestBody.rewards) ? requestBody.rewards : [];
  const slots = Array.isArray(requestBody.experienceSlots) ? requestBody.experienceSlots : [];
  inTransaction(db, () => {
    const activeIds = new Set();
    for (const reward of rewards) {
      if (!reward || typeof reward.id !== 'string' || !Number.isSafeInteger(reward.kinkooCost) || reward.kinkooCost <= 0) continue;
      activeIds.add(reward.id);
      const existing = db.prepare('SELECT stock FROM rewards WHERE id = ?').get(reward.id);
      const stock = existing?.stock ?? (Number.isSafeInteger(reward.stock) ? reward.stock : null);
      db.prepare(`INSERT INTO rewards(id, title, kinkoo_cost, is_available, stock, payload)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title, kinkoo_cost=excluded.kinkoo_cost,
          is_available=excluded.is_available, payload=excluded.payload`)
        .run(reward.id, String(reward.title || 'Pause Reward'), reward.kinkooCost, reward.isAvailable ? 1 : 0,
          stock, JSON.stringify({ ...reward, stock }));
    }
    for (const row of db.prepare('SELECT id FROM rewards').all()) {
      if (!activeIds.has(row.id)) db.prepare('UPDATE rewards SET is_available = 0 WHERE id = ?').run(row.id);
    }

    for (const slot of slots) {
      if (!slot || typeof slot.id !== 'string' || !Number.isSafeInteger(slot.capacity)) continue;
      const existing = db.prepare('SELECT booked_count FROM experience_slots WHERE id = ?').get(slot.id);
      const bookedCount = existing?.booked_count ?? (Number.isSafeInteger(slot.bookedCount) ? slot.bookedCount : 0);
      const status = bookedCount >= slot.capacity ? 'fully_booked' : String(slot.status || 'open');
      db.prepare(`INSERT INTO experience_slots(id, capacity, booked_count, status, payload)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET capacity=excluded.capacity, status=excluded.status, payload=excluded.payload`)
        .run(slot.id, slot.capacity, bookedCount, status, JSON.stringify({ ...slot, bookedCount, status }));
    }
  });
}

export function createKinkooApi({ projectId, databasePath } = {}) {
  const activeProjectId = projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const getDatabase = () => database || (database = openKinkooDatabase(databasePath));

  return async function handleKinkooApi(request, response) {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname !== '/api/kinkoo' && !url.pathname.startsWith('/api/kinkoo/')) return false;
    try {
      if (request.method === 'GET' && url.pathname === '/api/kinkoo/health') {
        send(response, 200, { ok: true, storage: 'sqlite' });
        return true;
      }
      const authorization = request.headers.authorization || '';
      const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!idToken) throw Object.assign(new Error('Sign in to continue.'), { status: 401 });
      const user = await verifyFirebaseToken(idToken, activeProjectId);
      const db = getDatabase();
      const path = url.pathname;
      if (!SKIP_LEGACY_IMPORT_PATHS.has(path)) {
        await importLegacyLoyalty(db, activeProjectId, idToken, user.sub);
      }
      const body = request.method === 'GET' ? {} : await readBody(request);
      const userName = String(user.name || user.email?.split('@')[0] || 'Pause Member');

      if (request.method === 'GET' && path === '/api/kinkoo/me') {
        db.prepare("UPDATE redemptions SET status='expired' WHERE user_id=? AND status='issued' AND expires_at<=?")
          .run(user.sub, nowIso());
        const account = getBalanceState(db, user.sub);
        const transactions = db.prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY timestamp DESC').all(user.sub)
          .map((row) => ({ id: row.id, userId: row.user_id, userName: row.user_name, amount: row.amount,
            type: row.type, description: row.description, referenceId: row.reference_id,
            timestamp: row.timestamp, createdBy: row.created_by }));
        const visits = db.prepare(`SELECT * FROM visit_tokens WHERE user_id = ? AND status = 'verified' ORDER BY verified_at DESC`)
          .all(user.sub).map(mapVisit);
        const redemptions = db.prepare('SELECT * FROM redemptions WHERE user_id = ? ORDER BY created_at DESC').all(user.sub)
          .map(mapRedemption);
        send(response, 200, { balance: account, transactions, visits, redemptions });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/visit-token') {
        const store = getDatabase();
        let token;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const candidate = String(randomInt(100000, 1000000));
          const hash = tokenHash(candidate);
          try {
            const createdAt = nowIso();
            const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
            store.prepare(`INSERT INTO visit_tokens(token_hash, user_id, user_name, status, created_at, expires_at)
              VALUES (?, ?, ?, 'active', ?, ?)`)
              .run(hash, user.sub, userName, createdAt, expiresAt);
            token = { token: candidate, userId: user.sub, userName, createdAt, expiresAt, status: 'active' };
            break;
          } catch (error) {
            if (!String(error.message).includes('UNIQUE')) throw error;
          }
        }
        if (!token) throw new Error('Could not generate a unique visit code. Try again.');
        send(response, 200, token);
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/weekly-claim') {
        const store = getDatabase();
        const week = currentIsoWeek();
        const result = inTransaction(store, () => {
          ensureAccount(store, user.sub);
          const existing = store.prepare(`SELECT 1 FROM ledger WHERE user_id = ? AND type = 'WEEKLY_GIFT' AND reference_id = ?`)
            .get(user.sub, week);
          if (existing) return { success: false, alreadyClaimed: true, error: "You've already claimed this week's Kinkoos." };
          const entry = { id: `weekly_${user.sub}_${week}`, userId: user.sub, userName, amount: WEEKLY_GIFT,
            type: 'WEEKLY_GIFT', description: `Weekly Free Kinkoos Gift (${week})`, referenceId: week,
            timestamp: nowIso(), createdBy: 'Weekly Gift System' };
          addLedgerEntry(store, entry);
          return { success: true, amount: WEEKLY_GIFT, balance: ensureAccount(store, user.sub).balance };
        });
        send(response, 200, result);
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/redeem') {
        const rewardId = requireString(body.rewardId, 'Choose a reward to redeem.');
        const store = getDatabase();
        store.prepare("UPDATE redemptions SET status='expired' WHERE user_id=? AND status='issued' AND expires_at<=?")
          .run(user.sub, nowIso());
        const result = inTransaction(store, () => {
          const reward = store.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
          if (!reward) throw new Error('Reward item not found.');
          if (!reward.is_available) throw new Error('This reward is currently unavailable.');
          if (reward.stock !== null && reward.stock <= 0) throw new Error('This reward is out of stock.');
          const account = ensureAccount(store, user.sub);
          if (account.balance < MINIMUM_REDEMPTION_BALANCE) throw new Error(`Minimum ${MINIMUM_REDEMPTION_BALANCE} Kinkoos required. Your balance is ${account.balance}.`);
          if (account.balance < reward.kinkoo_cost) throw new Error(`Insufficient Kinkoos. You need ${reward.kinkoo_cost}, but have ${account.balance}.`);
          const active = store.prepare(`SELECT id FROM redemptions WHERE user_id = ? AND reward_id = ?
            AND status = 'issued' AND expires_at > ?`).get(user.sub, rewardId, nowIso());
          if (active) throw new Error('You already have an active voucher for this reward.');

          let code;
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const candidate = `RW-${randomInt(100000, 1000000)}`;
            if (!store.prepare('SELECT 1 FROM redemptions WHERE code = ?').get(candidate)) { code = candidate; break; }
          }
          if (!code) throw new Error('Could not generate a unique reward voucher. Try again.');
          const createdAt = nowIso();
          const expiresAt = new Date(Date.now() + 15 * 86400000).toISOString();
          const id = randomUUID();
          store.prepare(`INSERT INTO redemptions(id, code, reward_id, reward_title, kinkoo_cost, user_id, user_name,
            status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?)`)
            .run(id, code, rewardId, reward.title, reward.kinkoo_cost, user.sub, userName, createdAt, expiresAt);
          addLedgerEntry(store, { id: `redemption_${id}`, userId: user.sub, userName, amount: -reward.kinkoo_cost,
            type: 'REDEMPTION', description: `Redeemed: ${reward.title}`, referenceId: id,
            timestamp: createdAt, createdBy: 'Rewards System' });
          if (reward.stock !== null) store.prepare('UPDATE rewards SET stock = stock - 1 WHERE id = ?').run(rewardId);
          const redemption = store.prepare('SELECT * FROM redemptions WHERE id = ?').get(id);
          return { success: true, balance: ensureAccount(store, user.sub).balance, redemption: mapRedemption(redemption) };
        });
        send(response, 200, result);
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/catalog/sync') {
        const adminName = await requireAdmin(activeProjectId, idToken, user);
        void adminName;
        syncCatalog(db, body);
        send(response, 200, { success: true });
        return true;
      }

      if (request.method === 'GET' && path === '/api/kinkoo/catalog') {
        const rewards = db.prepare('SELECT payload, stock FROM rewards WHERE is_available = 1 ORDER BY id').all()
          .map((row) => ({ ...JSON.parse(row.payload), stock: row.stock }));
        send(response, 200, { rewards });
        return true;
      }

      if (request.method === 'GET' && path === '/api/kinkoo/redemptions') {
        const adminName = await requireAdmin(activeProjectId, idToken, user);
        void adminName;
        db.prepare("UPDATE redemptions SET status='expired' WHERE status='issued' AND expires_at<=?")
          .run(nowIso());
        const redemptions = db.prepare('SELECT * FROM redemptions ORDER BY created_at DESC').all().map(mapRedemption);
        send(response, 200, { redemptions });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/visit/inspect') {
        await requireAdmin(activeProjectId, idToken, user);
        const code = requireString(body.token, 'Enter a visit pass.');
        if (!/^\d{6}$/.test(code)) throw new Error('This is not a valid visit pass.');
        const row = db.prepare('SELECT * FROM visit_tokens WHERE token_hash = ?').get(tokenHash(code));
        if (!row) throw new Error('Visit pass not found.');
        if (row.status !== 'active') throw new Error(row.status === 'verified' ? 'This visit pass has already been processed.' : 'Visit pass is inactive.');
        if (Date.parse(row.expires_at) <= Date.now()) {
          db.prepare("UPDATE visit_tokens SET status = 'expired' WHERE token_hash = ?").run(row.token_hash);
          throw new Error('Visit pass expired.');
        }
        send(response, 200, { token: code, userId: row.user_id, userName: row.user_name,
          createdAt: row.created_at, expiresAt: row.expires_at, status: row.status });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/visit/verify') {
        const adminName = await requireAdmin(activeProjectId, idToken, user);
        const code = requireString(body.token, 'Enter a visit pass.');
        if (!/^\d{6}$/.test(code)) throw new Error('This is not a valid visit pass.');
        const hash = tokenHash(code);
        const result = inTransaction(db, () => {
          const row = db.prepare('SELECT * FROM visit_tokens WHERE token_hash = ?').get(hash);
          if (!row) throw new Error('Visit pass not found.');
          if (row.status === 'verified') return row;
          if (row.status !== 'active') throw new Error('This visit pass is inactive or has already been processed.');
          if (Date.parse(row.expires_at) <= Date.now()) {
            db.prepare("UPDATE visit_tokens SET status = 'expired' WHERE token_hash = ?").run(hash);
            throw new Error('Visit pass expired. Ask the customer to generate a new one.');
          }
          const month = monthInBusinessZone();
          ensureAccount(db, row.user_id);
          const counter = db.prepare('SELECT * FROM monthly_visits WHERE user_id = ? AND month_key = ?').get(row.user_id, month)
            || { verified_visits: 0, awarded_visits: 0 };
          const award = counter.awarded_visits < MONTHLY_VISIT_LIMIT;
          const timestamp = nowIso();
          const awarded = award ? VISIT_REWARD : 0;
          db.prepare(`UPDATE visit_tokens SET status='verified', verified_at=?, verified_by_admin_id=?,
            verified_by_admin_name=?, kinkoos_awarded=?, notes=? WHERE token_hash=?`)
            .run(timestamp, user.sub, adminName, awarded, String(body.notes || '').slice(0, 500), hash);
          db.prepare(`INSERT INTO monthly_visits(user_id, month_key, verified_visits, awarded_visits) VALUES (?, ?, 1, ?)
            ON CONFLICT(user_id, month_key) DO UPDATE SET verified_visits=verified_visits+1,
              awarded_visits=awarded_visits+excluded.awarded_visits`)
            .run(row.user_id, month, award ? 1 : 0);
          if (award) addLedgerEntry(db, { id: `visit_${hash}`, userId: row.user_id, userName: row.user_name,
            amount: awarded, type: 'VISIT_REWARD', description: 'Physical Café Visit Verification',
            referenceId: hash, timestamp, createdBy: user.sub });
          db.prepare('INSERT OR IGNORE INTO firebase_visit_outbox(token_hash, created_at) VALUES (?, ?)').run(hash, timestamp);
          return db.prepare('SELECT * FROM visit_tokens WHERE token_hash = ?').get(hash);
        });
        send(response, 200, { success: true, visit: mapVisit(result) });
        queueVerifiedVisitSync(activeProjectId, idToken, result);
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/visit/flag') {
        await requireAdmin(activeProjectId, idToken, user);
        const code = requireString(body.token, 'Enter a visit pass.');
        const result = db.prepare("UPDATE visit_tokens SET status='flagged_spam', notes='Flagged by café staff' WHERE token_hash=? AND status='active'")
          .run(tokenHash(code));
        if (!result.changes) throw new Error('Only active visit passes can be flagged.');
        send(response, 200, { success: true });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/reward/consume') {
        const adminName = await requireAdmin(activeProjectId, idToken, user);
        const code = requireString(body.code, 'Enter a reward voucher code.').toUpperCase();
        if (!/^RW-\d{4,6}$/.test(code)) throw new Error('Enter a valid reward voucher code.');
        const result = inTransaction(db, () => {
          const row = db.prepare('SELECT * FROM redemptions WHERE code = ?').get(code);
          if (!row) throw new Error('Invalid redemption voucher code.');
          if (row.status !== 'issued') throw new Error(`This voucher is ${row.status}.`);
          if (Date.parse(row.expires_at) <= Date.now()) {
            db.prepare("UPDATE redemptions SET status='expired' WHERE id=?").run(row.id);
            throw new Error('This reward voucher has expired.');
          }
          const consumedAt = nowIso();
          db.prepare(`UPDATE redemptions SET status='verified_consumed', consumed_at=?, consumed_by_admin_id=?,
            consumed_by_admin_name=? WHERE id=?`)
            .run(consumedAt, user.sub, adminName, row.id);
          return db.prepare('SELECT * FROM redemptions WHERE id = ?').get(row.id);
        });
        send(response, 200, { success: true, redemption: mapRedemption(result) });
        return true;
      }

      if (request.method === 'GET' && path === '/api/kinkoo/admin/visits') {
        await requireAdmin(activeProjectId, idToken, user);
        const visits = db.prepare("SELECT * FROM visit_tokens WHERE status='verified' ORDER BY verified_at DESC LIMIT 500")
          .all().map(mapVisit);
        send(response, 200, { visits });
        return true;
      }

      if (request.method === 'GET' && path === '/api/kinkoo/admin/summary') {
        await requireAdmin(activeProjectId, idToken, user);
        const pointsInCirculation = db.prepare('SELECT COALESCE(SUM(balance), 0) AS total FROM accounts').get().total;
        send(response, 200, { pointsInCirculation });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/admin/purge') {
        await requireAdmin(activeProjectId, idToken, user);
        inTransaction(db, () => {
          for (const table of ['accounts', 'ledger', 'visit_tokens', 'monthly_visits', 'redemptions',
            'experience_bookings', 'firebase_visit_outbox']) db.exec(`DELETE FROM ${table};`);
          for (const row of db.prepare('SELECT id, payload FROM experience_slots').all()) {
            const slot = JSON.parse(row.payload);
            slot.bookedCount = 0;
            slot.status = 'open';
            db.prepare('UPDATE experience_slots SET booked_count=0,status=\'open\',payload=? WHERE id=?')
              .run(JSON.stringify(slot), row.id);
          }
        });
        send(response, 200, { success: true });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/experience/book') {
        const slotId = requireString(body.slotId, 'Choose an experience slot.');
        const result = inTransaction(db, () => {
          const slotRow = db.prepare('SELECT * FROM experience_slots WHERE id = ?').get(slotId);
          if (!slotRow) throw new Error('Experience slot not found.');
          const slot = JSON.parse(slotRow.payload);
          if (slotRow.status !== 'open' || slotRow.booked_count >= slotRow.capacity) throw new Error('This experience slot is fully booked.');
          const account = ensureAccount(db, user.sub);
          const month = monthInBusinessZone();
          const monthly = db.prepare('SELECT verified_visits FROM monthly_visits WHERE user_id=? AND month_key=?').get(user.sub, month);
          let spent = 0;
          if (body.useMonthlyReward) {
            if ((monthly?.verified_visits || 0) < MONTHLY_VISIT_LIMIT) throw new Error('You need 6 verified visits this month to unlock complimentary experience booking.');
            const used = db.prepare(`SELECT 1 FROM experience_bookings WHERE user_id=? AND monthly_reward=1
              AND status != 'cancelled' AND substr(created_at,1,7)=?`).get(user.sub, month);
            if (used) throw new Error('Your complimentary experience booking has already been used this month.');
          } else {
            spent = slot.kinkooRequired;
            if (account.balance < spent) throw new Error(`Insufficient Kinkoos. You need ${spent}, but have ${account.balance}.`);
          }
          const id = randomUUID();
          const timestamp = nowIso();
          const booking = { id, slotId: slot.id, slotTitle: slot.title, slotDate: slot.date, slotTime: slot.time,
            userId: user.sub, userName, userEmail: user.email || '', userPhone: String(body.phone || ''),
            kinkooSpent: spent, isMonthlyRewardRedemption: Boolean(body.useMonthlyReward), status: 'confirmed', createdAt: timestamp };
          db.prepare(`INSERT INTO experience_bookings(id,slot_id,slot_title,slot_date,slot_time,user_id,user_name,user_email,
            user_phone,kinkoo_spent,monthly_reward,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
            .run(id, slotId, slot.title, slot.date, slot.time, user.sub, userName, user.email || '',
              booking.userPhone, spent, body.useMonthlyReward ? 1 : 0, 'confirmed', timestamp);
          if (spent) addLedgerEntry(db, { id: `experience_${id}`, userId: user.sub, userName, amount: -spent,
            type: 'REDEMPTION', description: `Booked Experience: ${slot.title}`, referenceId: id,
            timestamp, createdBy: 'Experience Booking' });
          const count = slotRow.booked_count + 1;
          const status = count >= slotRow.capacity ? 'fully_booked' : 'open';
          slot.bookedCount = count;
          slot.status = status;
          db.prepare('UPDATE experience_slots SET booked_count=?,status=?,payload=? WHERE id=?')
            .run(count, status, JSON.stringify(slot), slotId);
          return { booking, slot };
        });
        send(response, 200, { success: true, booking: result.booking, slot: result.slot, balance: ensureAccount(db, user.sub).balance });
        return true;
      }

      if (request.method === 'POST' && path === '/api/kinkoo/experience/cancel') {
        const adminName = await requireAdmin(activeProjectId, idToken, user);
        const bookingId = requireString(body.bookingId, 'Choose a booking to cancel.');
        const result = inTransaction(db, () => {
          const booking = db.prepare('SELECT * FROM experience_bookings WHERE id = ?').get(bookingId);
          if (!booking) throw new Error('Booking not found.');
          if (booking.status === 'cancelled') throw new Error('Booking is already cancelled.');
          db.prepare("UPDATE experience_bookings SET status='cancelled' WHERE id=?").run(bookingId);
          const slotRow = db.prepare('SELECT * FROM experience_slots WHERE id=?').get(booking.slot_id);
          if (slotRow) {
            const count = Math.max(0, slotRow.booked_count - 1);
            const slot = JSON.parse(slotRow.payload);
            slot.bookedCount = count;
            slot.status = count >= slotRow.capacity ? 'fully_booked' : 'open';
            db.prepare('UPDATE experience_slots SET booked_count=?,status=?,payload=? WHERE id=?')
              .run(count, slot.status, JSON.stringify(slot), booking.slot_id);
          }
          if (body.refundKinkoos !== false && booking.kinkoo_spent > 0) {
            ensureAccount(db, booking.user_id);
            addLedgerEntry(db, { id: `refund_${bookingId}`, userId: booking.user_id, userName: booking.user_name,
              amount: booking.kinkoo_spent, type: 'REVERSAL', description: `Refund for cancelled booking: ${booking.slot_title}`,
              referenceId: bookingId, timestamp: nowIso(), createdBy: adminName });
            return { balance: ensureAccount(db, booking.user_id).balance, refunded: true };
          }
          return { refunded: null };
        });
        send(response, 200, { success: true, ...result });
        return true;
      }

      send(response, 404, { error: 'Kinkoo API route not found.' });
      return true;
    } catch (error) {
      const status = Number(error.status) || (error.message === 'Sign in again to continue.' ? 401 : 400);
      send(response, status, { error: error.message || 'Kinkoo request failed.' });
      return true;
    }
  };
}

function mapRedemption(row) {
  return {
    id: row.id,
    code: row.code,
    rewardId: row.reward_id,
    rewardTitle: row.reward_title,
    kinkooCost: row.kinkoo_cost,
    userId: row.user_id,
    userName: row.user_name,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at || undefined,
    consumedByAdminId: row.consumed_by_admin_id || undefined,
    consumedByAdminName: row.consumed_by_admin_name || undefined
  };
}
