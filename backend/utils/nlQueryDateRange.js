/** @typedef {'last_7_days' | 'last_month' | 'last_3_months' | 'this_month' | 'all' | null} DateRangeToken */

const ALLOWED = new Set(["last_7_days", "last_month", "last_3_months", "this_month", "all"]);

/**
 * @param {unknown} value
 * @returns {DateRangeToken}
 */
export function normalizeDateRangeToken(value) {
  if (value == null || value === "" || value === "all") return "all";
  const s = String(value).trim();
  if (!ALLOWED.has(s)) return "all";
  return /** @type {DateRangeToken} */ (s);
}

/**
 * @param {Exclude<DateRangeToken, null>} token
 * @returns {{ start: Date, end: Date }}
 */
export function getDateRangeBounds(token, now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);

  if (token === "all") {
    return { start: new Date(0), end };
  }

  if (token === "last_7_days") {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);
    start.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  if (token === "this_month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    return { start, end };
  }

  if (token === "last_month") {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const firstThis = new Date(Date.UTC(y, m, 1));
    const lastPrev = new Date(firstThis.getTime() - 1);
    const start = new Date(Date.UTC(lastPrev.getUTCFullYear(), lastPrev.getUTCMonth(), 1, 0, 0, 0, 0));
    const endPrev = new Date(Date.UTC(lastPrev.getUTCFullYear(), lastPrev.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    return { start, end: endPrev };
  }

  if (token === "last_3_months") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1, 0, 0, 0, 0));
    return { start, end };
  }

  return { start: new Date(0), end };
}

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
