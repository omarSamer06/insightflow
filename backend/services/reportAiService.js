/**
 * @param {object} reportPayload - { summary, categoryBreakdown } from buildReportFromRecords
 * @returns {Promise<{ explanation: string, source: "openai" | "mock" }>}
 */
export async function generateReportExplanation(reportPayload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return {
      explanation: buildMockReportExplanation(reportPayload),
      source: "mock",
    };
  }

  try {
    const text = await callOpenAI(apiKey, reportPayload);
    if (!text) throw new Error("Empty OpenAI response");
    return { explanation: text.trim(), source: "openai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    if (process.env.NODE_ENV !== "production") {
      console.warn("Report AI fallback:", message);
    }
    return {
      explanation: buildMockReportExplanation(reportPayload),
      source: "mock",
    };
  }
}

function buildMockReportExplanation(payload) {
  const { summary, categoryBreakdown } = payload || {};
  const { totalAmount, recordCount, trends, topCategory } = summary || {};

  if (!recordCount) {
    return (
      "This workspace has no records yet. Add transactions to generate a full report with totals, " +
      "category mix, and month-over-month trends. Configure OPENAI_API_KEY for a richer narrative when ready."
    );
  }

  const parts = [];
  parts.push(
    `Report overview: ${recordCount} record${recordCount === 1 ? "" : "s"} totaling ${formatAmount(
      totalAmount
    )}.`
  );

  if (topCategory?.name) {
    parts.push(
      `Strongest category by amount: “${topCategory.name}” (${formatAmount(
        topCategory.totalAmount
      )}, ${topCategory.recordCount} record${topCategory.recordCount === 1 ? "" : "s"}).`
    );
  }

  if (trends?.comparedMonths && trends.monthOverMonthChangePercent != null) {
    const { previous, current } = trends.comparedMonths;
    const pct = trends.monthOverMonthChangePercent;
    const dir = pct > 0 ? "increase" : pct < 0 ? "decrease" : "flat";
    parts.push(
      `Month-over-month (${previous} → ${current}): total amount ${dir} by ${Math.abs(
        Number(pct)
      ).toFixed(1)}%.`
    );
  } else if (trends?.monthly?.length === 1) {
    parts.push(
      `Only one month in range (${trends.monthly[0].month}); add more history for trend comparison.`
    );
  }

  const top3 = (categoryBreakdown || []).slice(0, 3);
  if (top3.length) {
    const line = top3
      .map((c) => `“${c.category}” ${formatAmount(c.totalAmount)} (${c.percentOfTotal}%)`)
      .join("; ");
    parts.push(`Top categories by share: ${line}.`);
  }

  parts.push(
    "This summary is data-grounded. For deeper commentary, ensure OpenAI is configured on the server."
  );

  return parts.join(" ");
}

async function callOpenAI(apiKey, reportPayload) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.35,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a concise financial reporting assistant for a SaaS workspace dashboard. " +
          "Given structured JSON (totals, category breakdown, monthly trends, MoM where available), " +
          "write a short professional report: 1 short intro, 1 paragraph on category concentration, " +
          "1 paragraph on recent momentum/trends, and 2-3 bullet-style recommendations. " +
          "No markdown code blocks. Do not invent numbers; only use values from the JSON.",
      },
      {
        role: "user",
        content:
          "Write the narrative section of a workspace report from this JSON:\n\n" +
          JSON.stringify(reportPayload, null, 2),
      },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Invalid OpenAI response shape");
  }
  return content;
}

function formatAmount(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}
