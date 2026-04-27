/**
 * Deterministic, data-grounded copy when OpenAI is unavailable or fails.
 * @param {object} stats - aggregated stats (totalAmount, recordCount, topCategory, monthlyTrends)
 */
export function buildMockInsightSummary(stats) {
  const { totalAmount, recordCount, topCategory, monthlyTrends } = stats;

  if (recordCount === 0) {
    return (
      "No records yet in this workspace. Add transactions to see spending patterns, " +
      "category concentration, and month-over-month trends. Once data exists, insights will highlight " +
      "growth, top categories, and practical next steps."
    );
  }

  const parts = [];
  parts.push(
    `This workspace has ${recordCount} record${recordCount === 1 ? "" : "s"} with a combined total of ${formatAmount(
      totalAmount
    )}.`
  );

  if (topCategory) {
    parts.push(
      `The largest share by amount is “${topCategory.name}” (${formatAmount(
        topCategory.totalAmount
      )} across ${topCategory.recordCount} record${topCategory.recordCount === 1 ? "" : "s"}).`
    );
  }

  if (monthlyTrends.length >= 2) {
    const a = monthlyTrends[monthlyTrends.length - 2];
    const b = monthlyTrends[monthlyTrends.length - 1];
    const delta = b.totalAmount - a.totalAmount;
    const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    parts.push(
      `Comparing the last two months in view (${a.month} → ${b.month}), total amount is ${dir} ` +
        `(${
          delta === 0
            ? "no change"
            : `${delta > 0 ? "+" : ""}${formatAmount(delta)} between those months`
        }).`
    );
  } else if (monthlyTrends.length === 1) {
    parts.push(
      `Activity in ${monthlyTrends[0].month} totals ${formatAmount(
        monthlyTrends[0].totalAmount
      )} across ${monthlyTrends[0].recordCount} record${
        monthlyTrends[0].recordCount === 1 ? "" : "s"
      }. Add more months of data to see momentum.`
    );
  }

  parts.push(
    "Recommendations: (1) Keep categorizing consistently to sharpen trends. (2) Review the top category for optimization. " +
      "(3) Revisit the latest month to confirm spikes are expected. Connect OpenAI in production for richer narrative insights."
  );

  return parts.join(" ");
}

function formatAmount(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}

/**
 * Structured narrative for premium UI.
 * @param {object} stats
 * @returns {{ metric: string, explanation: string, implication: string, recommendation: string, executiveSummary: string, source: "mock" | "empty" }}
 */
export function buildMockInsightNarrative(stats) {
  const { totalAmount, recordCount, topCategory, monthlyTrends, periodComparison, driverCategory } = stats || {};
  if (!recordCount) {
    return {
      metric: "0 records (no activity yet).",
      explanation: "No workspace records were found, so totals and trend deltas cannot be computed.",
      implication: "Insights remain unavailable until at least one record exists and categories are used consistently.",
      recommendation: "Add a few records across your main categories, then rerun insights to establish a baseline.",
      executiveSummary:
        "No performance summary is available yet because there are zero records in the workspace. Add a baseline set of categorized records to unlock trend and driver analysis.",
      source: "empty",
    };
  }

  const last = monthlyTrends?.length ? monthlyTrends[monthlyTrends.length - 1] : null;
  const prev = monthlyTrends?.length >= 2 ? monthlyTrends[monthlyTrends.length - 2] : null;
  const delta = periodComparison ? Number(periodComparison.delta) : prev && last ? Number(last.totalAmount) - Number(prev.totalAmount) : null;
  const trend = periodComparison?.trend || (delta == null ? null : delta > 0 ? "growth" : delta < 0 ? "decline" : "stable");
  const pct = periodComparison?.percentChange;

  const metricParts = [
    `${recordCount} record${recordCount === 1 ? "" : "s"}`,
    `Total ${formatAmount(totalAmount)}`,
  ];
  if (prev && last) {
    const pctPart = pct == null ? null : `(${pct > 0 ? "+" : ""}${pct}%)`;
    metricParts.push(
      `MoM ${trend === "stable" ? "0" : `${delta > 0 ? "+" : ""}${formatAmount(delta)}`}${pctPart ? ` ${pctPart}` : ""}`
    );
  }

  const driver =
    driverCategory?.name
      ? `Change is most strongly associated with “${driverCategory.name}” (${formatAmount(driverCategory.deltaAmount)} vs prior period).`
      : topCategory?.name
        ? `Largest category exposure is “${topCategory.name}” at ${formatAmount(topCategory.totalAmount)}.`
        : "No category leader is available yet.";

  const explanation = [
    prev && last
      ? `Trend is ${trend} from ${prev.month} → ${last.month}.`
      : "Trend requires at least two months of activity.",
    driver,
  ].join(" ");

  const implication =
    prev && last
      ? trend === "growth"
        ? "Performance expanded versus the previous period; tighten category-level monitoring to keep the run-rate controlled."
        : trend === "decline"
          ? "Performance contracted versus the previous period; validate whether this reflects efficiency or reduced activity."
          : "Performance is stable versus the previous period; improve category signal to uncover drivers."
      : "Without a previous period, focus on consistent categorization to enable driver attribution.";

  const recommendation = topCategory
    ? `Audit “${topCategory.name}” for repeatable drivers and outliers; keep categories consistent to improve trend accuracy.`
    : "Standardize category labels and add more records to unlock category concentration insights.";

  const pctText =
    pct == null
      ? "an uncalculated change (no prior baseline)"
      : `${pct > 0 ? "+" : ""}${pct}%`;
  const topName = topCategory?.name || driverCategory?.name || "the leading category";
  const trendText = trend === "growth" ? "upward" : trend === "decline" ? "downward" : "stable";
  const driverPhrase = driverCategory?.name
    ? `driven primarily by movement in the ${driverCategory.name} category`
    : topCategory?.name
      ? `with the largest contribution in the ${topCategory.name} category`
      : `with the largest contribution in ${topName}`;

  const executiveSummary =
    prev && last
      ? `Performance ${trend === "growth" ? "increased" : trend === "decline" ? "decreased" : "held"} by ${pctText} compared to the previous period, ${driverPhrase}. This indicates a ${trendText} trend; prioritize category-level review and address outliers before the next cycle.`
      : `Total performance is ${formatAmount(totalAmount)} across ${recordCount} record${recordCount === 1 ? "" : "s"}. Add at least two months of activity to compute a percentage change and identify the primary driver category.`;

  return { metric: metricParts.join(" • "), explanation, implication, recommendation, executiveSummary, source: "mock" };
}
