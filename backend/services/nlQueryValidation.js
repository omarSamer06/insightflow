import { normalizeDateRangeToken } from "../utils/nlQueryDateRange.js";

export const SUMMARY_METRICS = new Set([
  "total_amount",
  "record_count",
  "max_month",
  "top_category",
  "average_amount",
]);

/**
 * @returns {object | null} normalized safe instruction, or null if invalid
 */
export function validateAndNormalizeInstruction(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.type || "").toLowerCase();

  if (type === "unsupported") {
    return {
      type: "unsupported",
      reason: String(raw.reason || "Not supported").slice(0, 500),
    };
  }

  if (type === "summary") {
    const metric = String(raw.metric || "").toLowerCase();
    if (!SUMMARY_METRICS.has(metric)) return null;
    return { type: "summary", metric };
  }

  if (type === "filter") {
    const category =
      raw.category == null || raw.category === ""
        ? undefined
        : String(raw.category).trim().slice(0, 100);
    const dateRange = normalizeDateRangeToken(raw.dateRange);
    let limit = 50;
    if (raw.limit != null) {
      const n = Math.floor(Number(raw.limit));
      if (Number.isFinite(n)) {
        limit = Math.min(100, Math.max(1, n));
      }
    }
    return { type: "filter", category, dateRange, limit };
  }

  return null;
}
