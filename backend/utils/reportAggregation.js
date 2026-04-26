import { buildInsightStatsFromRecords } from "./insightAggregation.js";

/**
 * Workspace report: summary (totals, date range, trends) + category breakdown.
 * @param {Array<{ amount: number, category: string, date: Date | string }>} records
 */
export function buildReportFromRecords(records) {
  const list = Array.isArray(records) ? records : [];
  const stats = buildInsightStatsFromRecords(list);

  let minD = null;
  let maxD = null;
  for (const r of list) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    if (!minD || d < minD) minD = d;
    if (!maxD || d > maxD) maxD = d;
  }

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

  const totalAmt = Number(stats.totalAmount) || 0;
  const categoryBreakdown = Array.from(categoryMap.values())
    .map((c) => ({
      category: c.name,
      totalAmount: roundMoney(c.totalAmount),
      recordCount: c.recordCount,
      percentOfTotal: totalAmt > 0 ? round2((c.totalAmount / totalAmt) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const mt = stats.monthlyTrends;
  const trends = buildTrends(mt);

  return {
    summary: {
      totalAmount: stats.totalAmount,
      recordCount: stats.recordCount,
      topCategory: stats.topCategory,
      dateRange: {
        from: minD ? minD.toISOString() : null,
        to: maxD ? maxD.toISOString() : null,
      },
      trends,
    },
    categoryBreakdown,
  };
}

function buildTrends(monthlyTrends) {
  const mt = Array.isArray(monthlyTrends) ? monthlyTrends : [];
  if (mt.length < 2) {
    return {
      monthOverMonthChangePercent: null,
      recentDirection: "insufficient_data",
      comparedMonths: null,
      monthly: mt,
    };
  }

  const a = mt[mt.length - 2];
  const b = mt[mt.length - 1];
  const prev = Number(a.totalAmount) || 0;
  const curr = Number(b.totalAmount) || 0;
  let monthOverMonthChangePercent = null;
  if (prev > 0) {
    monthOverMonthChangePercent = round2(((curr - prev) / prev) * 100);
  } else {
    monthOverMonthChangePercent = curr > 0 ? 100 : 0;
  }
  const delta = curr - prev;
  const recentDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return {
    monthOverMonthChangePercent,
    recentDirection,
    comparedMonths: { previous: a.month, current: b.month },
    monthly: mt,
  };
}

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
