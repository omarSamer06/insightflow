/**
 * Rule-based interpretation when OpenAI is unavailable.
 * Produces the same instruction shapes as the LLM, then validated in nlQueryValidation.js
 */

import { normalizeDateRangeToken } from "../utils/nlQueryDateRange.js";

/**
 * @param {string} userQuery
 * @param {object} metadata - from buildRecordMetadata: categories, recordCount, etc.
 * @returns {object} instruction: summary | filter | unsupported
 */
export function interpretWithHeuristics(userQuery, metadata) {
  const q = String(userQuery || "").trim().toLowerCase();
  if (!q) {
    return { type: "unsupported", reason: "Empty question." };
  }

  const categories = Array.isArray(metadata?.categories) ? metadata.categories : [];

  // --- explicit "last month performance"
  if (/\b(last month).*(performance|total|spend|amount|revenue)\b/.test(q) || /\bperformance last month\b/.test(q)) {
    return { type: "summary", metric: "period_performance" };
  }

  // --- summary metrics (before generic "show/list" so "show total" is not a filter)
  if (/\b(how many|count|number of).*(record|row|entry)/.test(q) || /\brecord count\b/.test(q)) {
    return { type: "summary", metric: "record_count" };
  }
  if (/\b(average|mean)\b/.test(q) || /\bper record\b/.test(q)) {
    return { type: "summary", metric: "average_amount" };
  }
  if (
    /\b(top|largest|biggest|highest|main|dominant).*(categor|spend|amount)/.test(q) ||
    /\bcategor.*(top|largest|biggest)\b/.test(q) ||
    /\bwhich categor\b/.test(q)
  ) {
    return { type: "summary", metric: "top_category" };
  }
  if (/\b(which|what) month\b/.test(q) || /\b(highest|best|peak|max).*(month|monthly)\b/.test(q)) {
    return { type: "summary", metric: "max_month" };
  }
  if (/\b(total|sum|how much|combined|overall amount|in total)\b/.test(q) || /total amount/.test(q)) {
    // Support scoped totals like "total last month"
    const dateRange = pickDateRangeToken(q);
    return { type: "summary", metric: "total_amount", dateRange };
  }

  // --- aggregation intent: monthly / by category
  if (/\b(by month|monthly totals|monthly|per month)\b/.test(q)) {
    return { type: "aggregation", groupBy: "month", metric: "total_amount", dateRange: pickDateRangeToken(q), limit: 12 };
  }
  if (/\b(by category|category totals|per category)\b/.test(q)) {
    return { type: "aggregation", groupBy: "category", metric: "total_amount", dateRange: pickDateRangeToken(q), limit: 12 };
  }

  // --- filter: list / show records with optional category + date
  const categoryMatch = findCategoryMention(q, categories);
  const wantsList =
    /\b(list|show|find|display|pull up|get|give me|return)\b/.test(q) ||
    (/\brecords?\b/.test(q) && !/\btotal\b/.test(q)) ||
    /\b(what|which).*(records|entries|rows)\b/.test(q);

  if (wantsList || (categoryMatch && hasDateMentionForFilter(q)) || (categoryMatch && /\b(in|for)\s+\w+/.test(q))) {
    const dateRange = pickDateRangeToken(q);
    const limit = pickLimit(q);
    return {
      type: "filter",
      category: categoryMatch || undefined,
      dateRange,
      limit,
    };
  }

  if (wantsList && !categoryMatch) {
    const dateRange = pickDateRangeToken(q);
    return {
      type: "filter",
      dateRange,
      limit: pickLimit(q),
    };
  }

  if (metadata?.recordCount > 0) {
    return { type: "summary", metric: "total_amount" };
  }

  return {
    type: "unsupported",
    reason:
      "I couldn’t map that to a safe operation. Try: “top category”, “highest month”, “last month performance”, “list records from last month”, or “monthly totals”.",
  };
}

/**
 * @param {string} q lowercased query
 * @param {string[]} categories
 * @returns {string | null}
 */
function findCategoryMention(q, categories) {
  for (const c of categories) {
    const name = String(c || "").trim();
    if (name.length < 1) continue;
    if (q.includes(name.toLowerCase())) return name;
  }
  const m = q.match(/\b(?:in|for)\s+([a-z0-9][a-z0-9\s&]{0,50}?)(?:\s*[?.!]|$)/i);
  if (m && m[1]) {
    const word = m[1].trim();
    if (word.length > 0 && word.length < 100) {
      for (const c of categories) {
        if (c && String(c).toLowerCase() === word) return c;
      }
      return word.slice(0, 100);
    }
  }
  return null;
}

function hasDateMentionForFilter(q) {
  return (
    /\b(last|past|this|previous).*(day|week|month|3 month|quarter)\b/.test(q) ||
    /\b(last 7|last three|3 month)\b/.test(q)
  );
}

/**
 * @param {string} q lowercased
 */
function pickDateRangeToken(q) {
  if (/\b(last 7|past week|last week|7 day)\b/.test(q)) return normalizeDateRangeToken("last_7_days");
  if (/\b(last 3|three month|past 3|quarter)\b/.test(q)) return normalizeDateRangeToken("last_3_months");
  if (/\bthis month|current month\b/.test(q)) return normalizeDateRangeToken("this_month");
  if (/\b(last month|previous month|prior month)\b/.test(q)) return normalizeDateRangeToken("last_month");
  if (/\b(all time|everything|entire|full history)\b/.test(q)) return normalizeDateRangeToken("all");
  return "all";
}

function pickLimit(q) {
  const m1 = q.match(/\b(?:top|first|last|limit)\s*(\d{1,2})\b/);
  if (m1) return Math.min(100, Math.max(1, parseInt(m1[1], 10)));
  const m2 = q.match(/\b(\d{1,2})\s*records?\b/);
  if (m2) return Math.min(100, Math.max(1, parseInt(m2[1], 10)));
  return 50;
}
