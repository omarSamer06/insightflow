/**
 * Deterministic report copy when OpenAI is off or request fails, or for empty data.
 * @param {object} report - { summary, trends, categories }
 * @returns {{ performanceOverview: string, trendAnalysis: string, categoryBreakdown: string, recommendations: string, source: "empty" | "mock" }}
 */
export function buildMockReportNarrative(report) {
  const { summary, trends, categories } = report || {};
  if (!summary?.hasData) {
    return {
      performanceOverview:
        "No report is available yet: 0 records are present in the workspace. Add records to establish a baseline for totals and category mix.",
      trendAnalysis:
        "Growth rate is not computed because there is no previous period to compare. Capture at least two calendar months to enable month-over-month interpretation.",
      categoryBreakdown:
        "Top category cannot be identified until categories exist in the dataset. Use consistent category labels to make the breakdown meaningful.",
      recommendations:
        "Add a starter set of categorized records, then rerun the report after the next month closes to measure change and identify drivers.",
      source: "empty",
    };
  }

  const mom = trends?.monthOverMonth;
  const top = summary.topCategory || categories?.top;

  return {
    performanceOverview: buildPerformanceOverview(summary, top),
    trendAnalysis: buildTrendAnalysis(mom),
    categoryBreakdown: buildCategoryBreakdown(summary, top),
    recommendations: buildRecommendations(mom, top),
    source: "mock",
  };
}

function formatAmount(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
}

function pctText(p) {
  if (p == null) return "N/A";
  return `${p > 0 ? "+" : ""}${p}%`;
}

function buildPerformanceOverview(summary, top) {
  const total = formatAmount(summary.totalAmount);
  const n = summary.totalRecords;
  const topLine = top ? `Top category is ${top.name} at ${formatAmount(top.totalAmount)}.` : "Top category is unavailable.";
  return `Total activity is ${total} across ${n} record${n === 1 ? "" : "s"}. ${topLine}`;
}

function buildTrendAnalysis(mom) {
  if (!mom) {
    return "Growth rate is not computed because fewer than two months are available. Add another month of data to enable month-over-month interpretation.";
  }
  const trend = mom.direction === "up" ? "growth" : mom.direction === "down" ? "decline" : "stable";
  const delta = formatAmount(mom.deltaAmount);
  const pct = pctText(mom.percentChange);
  return `From ${mom.fromMonth} to ${mom.toMonth}, the trend is ${trend} at ${delta} (${pct}). This reflects changes in record volume and/or average amount versus the prior month.`;
}

function buildCategoryBreakdown(summary, top) {
  if (!top) {
    return "Category mix is not available yet. Use consistent category labels to make concentration and drivers measurable.";
  }
  const share = summary.totalAmount > 0 ? Math.round((top.totalAmount / summary.totalAmount) * 1000) / 10 : null;
  const shareText = share == null ? "N/A" : `${share}% of total`;
  return `${top.name} is the top contributor with ${formatAmount(top.totalAmount)} across ${top.recordCount} record${top.recordCount === 1 ? "" : "s"} (${shareText}). Concentration at the top category is the primary driver to monitor.`;
}

function buildRecommendations(mom, top) {
  const cat = top?.name ? `Focus review on ${top.name}` : "Focus review on your largest category";
  if (!mom) {
    return `${cat} and standardize category labels. Once two months are available, validate growth rate and set targets for the next cycle.`;
  }
  if (mom.direction === "up") {
    return `${cat} to confirm the increase is intentional and sustainable. If the growth is unplanned, apply caps or approvals to reduce month-over-month volatility.`;
  }
  if (mom.direction === "down") {
    return `${cat} to determine whether the decline is efficiency or reduced activity. If this is demand-driven, adjust the next month plan and investigate the biggest drops.`;
  }
  return `${cat} to reduce concentration risk and improve signal quality. Maintain the current run-rate while tightening categorization and monitoring outliers.`;
}
