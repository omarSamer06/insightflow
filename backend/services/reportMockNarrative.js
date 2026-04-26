/**
 * Deterministic report copy when OpenAI is off or request fails, or for empty data.
 * @param {object} report - { summary, trends, categories }
 * @returns {{ performanceOverview: string, growthOrDecline: string, recommendation: string, source: "empty" | "mock" }}
 */
export function buildMockReportNarrative(report) {
  const { summary, trends, categories } = report || {};
  if (!summary?.hasData) {
    return {
      performanceOverview:
        "There is no data in this workspace yet. Add records to unlock totals, category breakdowns, and month-over-month trends.",
      growthOrDecline: "N/A — not enough history to measure growth or decline until at least one month of activity is recorded.",
      recommendation:
        "Start by entering a few records across the categories you care about. Revisit this report after a few weeks to see momentum.",
      source: "empty",
    };
  }

  const mom = trends?.monthOverMonth;
  const top = summary.topCategory || categories?.top;

  const performanceOverview = [
    `The workspace has ${summary.totalRecords} record${
      summary.totalRecords === 1 ? "" : "s"
    } totaling ${formatAmount(summary.totalAmount)}.`,
    top
      ? `The top category by amount is “${top.name}” with ${formatAmount(
          top.totalAmount
        )} across ${top.recordCount} record${top.recordCount === 1 ? "" : "s"}.`
      : "Category split is not available.",
  ]
    .filter(Boolean)
    .join(" ");

  let growthOrDecline;
  if (mom) {
    const pct =
      mom.percentChange == null
        ? "N/A (baseline month was $0 or no prior comparison)"
        : `${mom.percentChange > 0 ? "+" : ""}${mom.percentChange}%`;
    growthOrDecline = `Comparing ${mom.fromMonth} to ${mom.toMonth}, total amount moved ${mom.direction} ` +
      `by ${formatAmount(mom.deltaAmount)} (${pct} where applicable), from ${formatAmount(
        mom.previousAmount
      )} to ${formatAmount(mom.currentAmount)}.`;
  } else if (trends?.monthlyTotals?.length === 1) {
    const m = trends.monthlyTotals[0];
    growthOrDecline = `Only ${m.month} is present in the data so far (${formatAmount(
      m.totalAmount
    )}). Add at least one more month to measure changes.`;
  } else {
    growthOrDecline = "Trend comparison is not available for the current date coverage.";
  }

  const recommendation = [
    top ? `Revisit “${top.name}” to confirm the largest spend is expected.` : "Review the largest category once multiple categories exist.",
    mom?.direction === "up"
      ? "If the recent increase is not planned, consider tightening the next month’s plan."
      : mom?.direction === "down"
        ? "A decline may reflect less activity or lower ticket sizes; validate against your expectations."
        : "Keep a steady review cadence as more months accumulate.",
  ].join(" ");

  return {
    performanceOverview,
    growthOrDecline,
    recommendation,
    source: "mock",
  };
}

function formatAmount(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
}
