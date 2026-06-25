export const normalizePriceHistory = (product) => {
  const history = Array.isArray(product.priceHistory) ? product.priceHistory : [];
  const entries = history
    .map((entry) => ({
      date: entry.date || product.createdAt || new Date().toISOString(),
      price: Number(entry.price),
      source: entry.source || 'manual',
    }))
    .filter((entry) => Number.isFinite(entry.price) && entry.price >= 0);

  const initialPrice = Number(product.initialPrice || product.price);
  if (Number.isFinite(initialPrice) && initialPrice >= 0 && entries.length === 0) {
    entries.push({
      date: product.createdAt || new Date().toISOString(),
      price: initialPrice,
      source: 'initial',
    });
  }

  const currentPrice = Number(product.price);
  const lastEntry = entries.at(-1);
  if (Number.isFinite(currentPrice) && currentPrice >= 0 && (!lastEntry || lastEntry.price !== currentPrice)) {
    entries.push({
      date: product.lastChecked || new Date().toISOString(),
      price: currentPrice,
      source: 'current',
    });
  }

  return entries;
};

export const getPriceStats = (product) => {
  const history = normalizePriceHistory(product);
  const prices = history.map((entry) => entry.price);
  const current = Number(product.price) || 0;
  const initial = Number(product.initialPrice || prices[0] || current) || 0;
  const best = prices.length ? Math.min(...prices) : current;
  const target = Number(product.targetPrice) || 0;
  const isBestPrice = current > 0 && best > 0 && current <= best;
  const targetReached = target > 0 && current <= target;
  const discountFromInitial = initial > 0 ? Math.round(((initial - current) / initial) * 100) : 0;

  return {
    history,
    current,
    initial,
    best,
    target,
    isBestPrice,
    targetReached,
    discountFromInitial,
  };
};

export const getWishScore = (product, settings = {}) => {
  const stats = getPriceStats(product);
  const priority = Number(product.priority || 2);
  const monthlyBudget = Number(settings.monthlyBudget || 0);
  const savingsFund = Number(settings.savingsFund || 0);
  const affordableNow = savingsFund > 0 && stats.current > 0 && stats.current <= savingsFund;
  const budgetFriendly = monthlyBudget > 0 && stats.current > 0 && stats.current <= monthlyBudget;

  let score = 35;
  score += priority * 12;
  if (stats.targetReached) score += 26;
  if (stats.isBestPrice && stats.history.length > 1) score += 12;
  if (stats.discountFromInitial > 0) score += Math.min(18, Math.round(stats.discountFromInitial / 2));
  if (affordableNow) score += 10;
  if (budgetFriendly) score += 6;
  if (!stats.target && stats.current > 0) score -= 6;
  if (product.isGiftIdea) score += 4;

  const clampedScore = Math.max(0, Math.min(100, score));
  let decision = 'wait';
  if (stats.targetReached || clampedScore >= 78) decision = 'buy';
  if (clampedScore < 48 || (!stats.targetReached && !affordableNow && priority <= 1)) decision = 'park';

  return {
    score: clampedScore,
    decision,
    affordableNow,
    budgetFriendly,
    monthsToBuy: stats.current > 0 && monthlyBudget > 0
      ? Math.max(1, Math.ceil(Math.max(0, stats.current - savingsFund) / monthlyBudget))
      : null,
  };
};

export const createPriceSparkline = (history, width = 120, height = 34) => {
  if (!history.length) return '';
  if (history.length === 1) {
    const y = Math.round(height / 2);
    return `M 0 ${y} L ${width} ${y}`;
  }

  const prices = history.map((entry) => entry.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);

  return history.map((entry, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - ((entry.price - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
};
