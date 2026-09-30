const MONTHLY_VISIT_LIMIT = 6;
const MINIMUM_REDEMPTION_BALANCE = 500;

const validateMonthlyVisitAward = (awardedVisits) => {
  if (!Number.isSafeInteger(awardedVisits) || awardedVisits < 0) return 'Monthly visit count is invalid.';
  return null;
};

const canAwardMonthlyVisit = (awardedVisits) => awardedVisits < MONTHLY_VISIT_LIMIT;

const validateRewardRedemption = ({ balance, cost, isAvailable, stock }) => {
  if (isAvailable !== true) return 'This reward is currently unavailable.';
  if (!Number.isSafeInteger(cost) || cost <= 0) return 'This reward has an invalid Kinkoo cost.';
  if (stock !== undefined && (!Number.isSafeInteger(stock) || stock <= 0)) return 'This reward is out of stock.';
  if (!Number.isSafeInteger(balance) || balance < 0) return 'Your Kinkoo account balance needs staff review.';
  if (balance < MINIMUM_REDEMPTION_BALANCE) {
    return `Minimum ${MINIMUM_REDEMPTION_BALANCE} Kinkoos required. Your balance is ${balance}.`;
  }
  if (balance < cost) return `Insufficient Kinkoos. You need ${cost}, but have ${balance}.`;
  return null;
};

const calculateLedgerBalance = (entries) => entries.reduce((sum, entry) => {
  const amount = entry.amount;
  return sum + (Number.isSafeInteger(amount) ? amount : 0);
}, 0);

module.exports = { validateMonthlyVisitAward, canAwardMonthlyVisit, validateRewardRedemption, calculateLedgerBalance };
