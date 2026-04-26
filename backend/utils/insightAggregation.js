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
  }

  const monthsSorted = Array.from(monthlyBuckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const last6 = monthsSorted.slice(-6);

  return {
    totalAmount: roundMoney(totalAmount),
    recordCount,
    topCategory,
    monthlyTrends: last6.map((m) => ({
      month: m.month,
      totalAmount: roundMoney(m.totalAmount),
      recordCount: m.recordCount,
    })),
  };
}

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}
