const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateLedgerBalance,
  canAwardMonthlyVisit,
  validateMonthlyVisitAward,
  validateRewardRedemption
} = require('./loyaltyRules');

test('visits remain valid after six, but only the first six earn monthly Kinkoos', () => {
  for (let count = 0; count < 8; count += 1) assert.equal(validateMonthlyVisitAward(count), null);
  for (let count = 0; count < 6; count += 1) assert.equal(canAwardMonthlyVisit(count), true);
  assert.equal(canAwardMonthlyVisit(6), false);
  assert.equal(canAwardMonthlyVisit(7), false);
});

test('monthly visit count rejects invalid values', () => {
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN]) {
    assert.match(validateMonthlyVisitAward(value), /count is invalid/);
  }
});

test('redemption requires minimum balance and enough points for exact cost', () => {
  const reward = { cost: 600, isAvailable: true, stock: 3 };
  assert.match(validateRewardRedemption({ ...reward, balance: 499 }), /Minimum 500/);
  assert.match(validateRewardRedemption({ ...reward, balance: 599 }), /Insufficient Kinkoos/);
  assert.equal(validateRewardRedemption({ ...reward, balance: 600 }), null);
  assert.equal(validateRewardRedemption({ ...reward, balance: 700 }), null);
});

test('redemption rejects inactive, out of stock, and malformed rewards', () => {
  assert.match(validateRewardRedemption({ balance: 700, cost: 500, isAvailable: false }), /unavailable/);
  assert.match(validateRewardRedemption({ balance: 700, cost: 500, isAvailable: true, stock: 0 }), /out of stock/);
  assert.match(validateRewardRedemption({ balance: 700, cost: 0, isAvailable: true }), /invalid Kinkoo cost/);
  assert.match(validateRewardRedemption({ balance: -1, cost: 500, isAvailable: true }), /staff review/);
});

test('ledger math includes credits and debits and ignores malformed amounts', () => {
  assert.equal(calculateLedgerBalance([
    { amount: 600 },
    { amount: 100 },
    { amount: -500 },
    { amount: '1000' },
    { amount: 1.5 }
  ]), 200);
});

test('six monthly visits plus one weekly claim produce the expected redemption balance', () => {
  const ledger = Array.from({ length: 6 }, () => ({ amount: 100 }));
  ledger.push({ amount: 100 }); // A single weekly claim.
  const balance = calculateLedgerBalance(ledger);
  assert.equal(balance, 700);
  assert.equal(validateMonthlyVisitAward(6), null);
  assert.equal(canAwardMonthlyVisit(6), false);
  assert.equal(validateRewardRedemption({ balance, cost: 600, isAvailable: true }), null);
  assert.equal(balance - 600, 100);
});
