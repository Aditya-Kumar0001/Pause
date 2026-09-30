# SQLite index fixes — apply to `server/sqliteStore.js`

Add these `CREATE INDEX IF NOT EXISTS` statements inside `openKinkooDatabase()` in
`server/sqliteStore.js`, right after the existing `CREATE INDEX` lines (or anywhere
after the matching `CREATE TABLE`, before the function returns `db`). They're all
additive — no data migration needed, safe to run against an existing database.

```sql
-- 1. GET /api/kinkoo/admin/visits does:
--    WHERE status='verified' ORDER BY verified_at DESC LIMIT 500
-- The only existing index on visit_tokens is (user_id, created_at DESC), which
-- doesn't help this query — it currently does a full table scan.
CREATE INDEX IF NOT EXISTS visit_tokens_status_verified
  ON visit_tokens(status, verified_at DESC);

-- 2. POST /api/kinkoo/weekly-claim dedup check does:
--    WHERE user_id=? AND type='WEEKLY_GIFT' AND reference_id=?
-- Existing index (user_id, timestamp DESC) doesn't cover type/reference_id.
CREATE INDEX IF NOT EXISTS ledger_user_type_ref
  ON ledger(user_id, type, reference_id);

-- 3. POST /api/kinkoo/redeem active-voucher check does:
--    WHERE user_id=? AND reward_id=? AND status='issued' AND expires_at > ?
-- Existing index (user_id, created_at DESC) doesn't cover reward_id/status.
CREATE INDEX IF NOT EXISTS redemptions_user_reward_status
  ON redemptions(user_id, reward_id, status);
```

## Item 4 needs a small schema change, not just an index

`POST /api/kinkoo/experience/book`'s monthly-reward-used check
(`server/kinkooApi.js`, inside the `useMonthlyReward` branch) does:

```sql
WHERE user_id=? AND monthly_reward=1 AND status != 'cancelled'
  AND substr(created_at,1,7)=?
```

`substr(created_at,1,7)` can't use an index no matter what you index, because
it's a function applied to the column at query time. If this table grows large,
add a `month_key TEXT NOT NULL` column to `experience_bookings` (filled in at
insert time using the same `monthInBusinessZone()` helper already used
elsewhere in `kinkooApi.js`), then index and query that column directly:

```sql
ALTER TABLE experience_bookings ADD COLUMN month_key TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS experience_bookings_user_month
  ON experience_bookings(user_id, month_key, monthly_reward);
```

This one's lower priority than 1–3 (experience bookings are naturally low-volume
compared to ledger/visit rows), so apply it later if it ever becomes a hot path.
