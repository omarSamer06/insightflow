import { normalizeDateRangeToken } from "../utils/nlQueryDateRange.js";

export const SUMMARY_METRICS = new Set([
  "total_amount",
  "record_count",
  "max_month",
  "top_category",
  "average_amount",
  "period_performance",
]);

export const AGG_GROUP_BY = new Set(["month", "category"]);
export const AGG_METRICS = new Set(["total_amount", "record_count", "average_amount"]);

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
    const dateRange = normalizeDateRangeToken(raw.dateRange);
    return { type: "summary", metric, dateRange };
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

  if (type === "aggregation") {
    const groupBy = String(raw.groupBy || "").toLowerCase();
    if (!AGG_GROUP_BY.has(groupBy)) return null;
    const metric = String(raw.metric || "").toLowerCase();
    if (!AGG_METRICS.has(metric)) return null;
    const dateRange = normalizeDateRangeToken(raw.dateRange);
    const category =
      raw.category == null || raw.category === ""
        ? undefined
        : String(raw.category).trim().slice(0, 100);
    let limit = 12;
    if (raw.limit != null) {
      const n = Math.floor(Number(raw.limit));
      if (Number.isFinite(n)) {
        limit = Math.min(60, Math.max(1, n));
      }
    }
    return { type: "aggregation", groupBy, metric, dateRange, category, limit };
  }

  return null;
}
