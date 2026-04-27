/**
 * Report narrative schema (all strings):
 * - performanceOverview
 * - trendAnalysis
 * - categoryBreakdown
 * - recommendations
 */

/**
 * @param {any} n
 * @returns {{ performanceOverview: string, trendAnalysis: string, categoryBreakdown: string, recommendations: string }}
 */
export function coerceReportNarrative(n) {
  const performanceOverview = String(n?.performanceOverview || "").trim();
  const trendAnalysis = String(n?.trendAnalysis || "").trim();
  const categoryBreakdown = String(n?.categoryBreakdown || "").trim();
  const recommendations = String(n?.recommendations || "").trim();

  return {
    performanceOverview: performanceOverview || "Performance overview unavailable.",
    trendAnalysis: trendAnalysis || "Trend analysis unavailable.",
    categoryBreakdown: categoryBreakdown || "Category breakdown unavailable.",
    recommendations: recommendations || "Recommendations unavailable.",
  };
}

