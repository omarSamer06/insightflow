/**
 * Group workspace records by calendar month (UTC) and sum amounts.
 * @param {Array<{ amount: number, date: Date | string }>} records
 * @returns {Array<{ month: string, totalAmount: number, recordCount: number }>} sorted ascending by month
 */
export function buildMonthlyAmountSeries(records) {
  const list = Array.isArray(records) ? records : [];
  const map = new Map();

  for (const r of list) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      map.set(key, { month: key, totalAmount: 0, recordCount: 0 });
    }
    const row = map.get(key);
    const amt = Number(r.amount);
    row.totalAmount += Number.isFinite(amt) ? amt : 0;
    row.recordCount += 1;
  }

  return Array.from(map.values())
    .map((r) => ({
      month: r.month,
      totalAmount: round2(r.totalAmount),
      recordCount: r.recordCount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {string} yyyyMm
 * @returns {string} next calendar month YYYY-MM (UTC)
 */
export function getNextMonthKey(yyyyMm) {
  const [y, m] = String(yyyyMm)
    .split("-")
    .map((p) => parseInt(p, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return yyyyMm;
  }
  const d = new Date(Date.UTC(y, m, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}
