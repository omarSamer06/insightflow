/**
 * Compact metadata for NL query AI (token budget).
 * @param {Array<{ amount?: number, category?: string, date?: Date | string }>} records
 */
export function buildRecordMetadata(records) {
  const list = Array.isArray(records) ? records : [];
  const categories = new Set();
  let minTime = Infinity;
  let maxTime = -Infinity;
  let totalAmount = 0;

  for (const r of list) {
    if (r.category) categories.add(String(r.category).trim());
    const amt = Number(r.amount);
    if (Number.isFinite(amt)) totalAmount += amt;
    const d = new Date(r.date);
    if (!Number.isNaN(d.getTime())) {
      const t = d.getTime();
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  }

  return {
    recordCount: list.length,
    categories: Array.from(categories).slice(0, 80),
    dateSpan:
      minTime !== Infinity && maxTime !== -Infinity
        ? { min: new Date(minTime).toISOString(), max: new Date(maxTime).toISOString() }
        : null,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}
