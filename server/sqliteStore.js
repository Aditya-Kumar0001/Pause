import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const INITIAL_REWARDS = [
  ['rew-1', 'Any Classic Espresso Beverage (Hot or Iced)', 500, 1, 999],
  ['rew-2', 'Behind-The-Bar Coffee Making Experience', 600, 1, 50],
  ['rew-3', 'Spanish Latte (Iced) or Cold Coffee', 550, 1, 200],
  ['rew-4', 'Fresh Strawberry Thickshake', 550, 1, 120],
  ['rew-5', 'Artisanal Bomboloni or Fresh Brownie', 500, 1, 60]
];
const INITIAL_EXPERIENCE_SLOTS = [
  { id: 'exp-1', title: 'The Art of the Pull: Espresso & Extraction Craft', date: '2026-09-05', time: '10:00 AM – 11:30 AM', capacity: 4, bookedCount: 2, kinkooRequired: 600, status: 'open' },
  { id: 'exp-2', title: 'Manual Alchemy: Pour-Over & Filter Geometries', date: '2026-09-12', time: '04:00 PM – 05:30 PM', capacity: 6, bookedCount: 3, kinkooRequired: 600, status: 'open' },
  { id: 'exp-3', title: 'Cold Brew & Botanical Infusions Laboratory', date: '2026-09-19', time: '11:00 AM – 12:30 PM', capacity: 4, bookedCount: 1, kinkooRequired: 600, status: 'open' }
];

export function openKinkooDatabase(databasePath = process.env.KINKOO_SQLITE_PATH || './data/kinkoo.sqlite') {
  const path = resolve(databasePath);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
      lifetime_earned INTEGER NOT NULL DEFAULT 0,
      lifetime_spent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT,
      timestamp TEXT NOT NULL,
      created_by TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS ledger_user_time ON ledger(user_id, timestamp DESC);
    CREATE TABLE IF NOT EXISTS visit_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified_at TEXT,
      verified_by_admin_id TEXT,
      verified_by_admin_name TEXT,
      kinkoos_awarded INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS visit_tokens_user ON visit_tokens(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS monthly_visits (
      user_id TEXT NOT NULL,
      month_key TEXT NOT NULL,
      verified_visits INTEGER NOT NULL DEFAULT 0,
      awarded_visits INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, month_key)
    );
    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      reward_id TEXT NOT NULL,
      reward_title TEXT NOT NULL,
      kinkoo_cost INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      consumed_by_admin_id TEXT,
      consumed_by_admin_name TEXT
    );
    CREATE INDEX IF NOT EXISTS redemptions_user ON redemptions(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      kinkoo_cost INTEGER NOT NULL,
      is_available INTEGER NOT NULL,
      stock INTEGER,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS experience_bookings (
      id TEXT PRIMARY KEY,
      slot_id TEXT NOT NULL,
      slot_title TEXT NOT NULL,
      slot_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT,
      kinkoo_spent INTEGER NOT NULL DEFAULT 0,
      monthly_reward INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS experience_slots (
      id TEXT PRIMARY KEY,
      capacity INTEGER NOT NULL,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS firebase_visit_outbox (
      token_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );
    CREATE TABLE IF NOT EXISTS legacy_imports (
      user_id TEXT PRIMARY KEY,
      imported_at TEXT NOT NULL
    );
  `);
  const seedReward = db.prepare(`
    INSERT OR IGNORE INTO rewards(id, title, kinkoo_cost, is_available, stock, payload)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const [id, title, cost, active, stock] of INITIAL_REWARDS) {
    seedReward.run(id, title, cost, active, stock, JSON.stringify({ id, title, kinkooCost: cost, isAvailable: true, stock }));
  }
  const seedSlot = db.prepare(`INSERT OR IGNORE INTO experience_slots(id, capacity, booked_count, status, payload)
    VALUES (?, ?, ?, ?, ?)`);
  for (const slot of INITIAL_EXPERIENCE_SLOTS) {
    seedSlot.run(slot.id, slot.capacity, slot.bookedCount, slot.status, JSON.stringify(slot));
  }
  return db;
}

export function inTransaction(db, callback) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
