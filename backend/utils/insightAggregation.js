/**
 * Build analytics for AI / API response from raw workspace records.
 * @param {Array<{ amount: number, category: string, date: Date | string }>} records
 */
export function buildInsightStatsFromRecords(records) {
  const list = Array.isArray(records) ? records : [];

  let totalAmount = 0;
  for (const r of list) {
    const n = Number(r.amount);
    if (Number.isFinite(n)) totalAmount += n;
  }
  const recordCount = list.length;

  const categoryMap = new Map();
  for (const r of list) {
    const name = String(r.category || "Uncategorized").trim() || "Uncategorized";
    const amt = Number(r.amount) || 0;
    if (!categoryMap.has(name)) {
      categoryMap.set(name, { name, totalAmount: 0, recordCount: 0 });
    }
    const c = categoryMap.get(name);
    c.totalAmount += amt;
    c.recordCount += 1;
  }

  let topCategory = null;
  for (const c of categoryMap.values()) {
    if (!topCategory) {
      topCategory = { ...c };
      continue;
    }
    if (c.totalAmount > topCategory.totalAmount) {
      topCategory = { ...c };
    } else if (c.totalAmount === topCategory.totalAmount && c.recordCount > topCategory.recordCount) {
      topCategory = { ...c };
    }
  }

  const monthlyBuckets = new Map();
  // Used to compute driver category for the last two months
  const monthCategoryTotals = new Map(); // monthKey -> Map(category -> totalAmount)
  for (const r of list) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    if (!monthlyBuckets.has(key)) {
      monthlyBuckets.set(key, { month: key, totalAmount: 0, recordCount: 0 });
    }
    const b = monthlyBuckets.get(key);
    b.totalAmount += Number(r.amount) || 0;
    b.recordCount += 1;

    const cat = String(r.category || "Uncategorized").trim() || "Uncategorized";
    const amt = Number(r.amount) || 0;
    if (!monthCategoryTotals.has(key)) monthCategoryTotals.set(key, new Map());
    const catMap = monthCategoryTotals.get(key);
    catMap.set(cat, (catMap.get(cat) || 0) + amt);
  }

  const monthsSorted = Array.from(monthlyBuckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const last6 = monthsSorted.slice(-6);

  const periodComparison = computePeriodComparison(last6);
  const driverCategory = computeDriverCategory(monthCategoryTotals, periodComparison);

  return {
    totalAmount: roundMoney(totalAmount),
    recordCount,
    topCategory,
    monthlyTrends: last6.map((m) => ({
      month: m.month,
      totalAmount: roundMoney(m.totalAmount),
      recordCount: m.recordCount,
    })),
    periodComparison,
    driverCategory,
  };
}

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {Array<{ month: string, totalAmount: number, recordCount: number }>} last6 sorted asc
 */
function computePeriodComparison(last6) {
  if (!Array.isArray(last6) || last6.length < 2) return null;
  const prev = last6[last6.length - 2];
  const curr = last6[last6.length - 1];
  const prevTotal = roundMoney(prev.totalAmount);
  const currTotal = roundMoney(curr.totalAmount);
  const delta = roundMoney(currTotal - prevTotal);
  const direction = delta > 0 ? "growth" : delta < 0 ? "decline" : "stable";
  const percentChange =
    prevTotal === 0 ? null : roundMoney((delta / prevTotal) * 100);

  return {
    previousMonth: prev.month,
    currentMonth: curr.month,
    previousTotal: prevTotal,
    currentTotal: currTotal,
    delta,
    percentChange,
    trend: direction,
  };
}

/**
 * Pick the category that contributed most to the change between previous and current period.
 * @param {Map<string, Map<string, number>>} monthCategoryTotals
 * @param {ReturnType<typeof computePeriodComparison>} period
 */
function computeDriverCategory(monthCategoryTotals, period) {
  if (!period) return null;
  const prevMap = monthCategoryTotals.get(period.previousMonth) || new Map();
  const currMap = monthCategoryTotals.get(period.currentMonth) || new Map();
  const cats = new Set([...prevMap.keys(), ...currMap.keys()]);

  let best = null;
  for (const c of cats) {
    const prev = Number(prevMap.get(c) || 0);
    const curr = Number(currMap.get(c) || 0);
    const delta = curr - prev;
    if (!best) {
      best = { name: c, deltaAmount: roundMoney(delta), previousTotal: roundMoney(prev), currentTotal: roundMoney(curr) };
      continue;
    }
    // Prefer deltas aligned with the overall direction if possible.
    const aligned = period.delta > 0 ? delta > 0 : period.delta < 0 ? delta < 0 : false;
    const bestAligned = period.delta > 0 ? best.deltaAmount > 0 : period.delta < 0 ? best.deltaAmount < 0 : false;

    if (aligned && !bestAligned) {
      best = { name: c, deltaAmount: roundMoney(delta), previousTotal: roundMoney(prev), currentTotal: roundMoney(curr) };
      continue;
    }
    if (aligned === bestAligned && Math.abs(delta) > Math.abs(best.deltaAmount)) {
      best = { name: c, deltaAmount: roundMoney(delta), previousTotal: roundMoney(prev), currentTotal: roundMoney(curr) };
    }
  }
  return best;
}
