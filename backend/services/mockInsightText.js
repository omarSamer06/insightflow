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
