/**
 * @param {object} context
 * @param {Array<{ month: string, totalAmount: number }>} context.monthly
 * @param {object} context.forecast
 * @returns {Promise<{ text: string, source: "openai" | "mock" }>}
 */
export async function generatePredictionInsight(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return { text: buildMockPredictionInsight(context), source: "mock" };
  }
  try {
    const t = await callOpenAIPrediction(apiKey, context);
    if (t) return { text: t.trim(), source: "openai" };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Prediction insight AI fallback:", err?.message || err);
    }
  }
  return { text: buildMockPredictionInsight(context), source: "mock" };
}

function buildMockPredictionInsight({ monthly, forecast }) {
  if (!monthly?.length) {
    return "No historical monthly totals yet. Once you have a few months of data, we can estimate next month's total and growth.";
  }
  if (monthly.length === 1) {
    return `Only one month on file (${monthly[0].month}). Forecast uses that month as a simple baseline; add more months for a real trend.`;
  }
  const p = forecast?.predictedTotal;
  const g = forecast?.growthPercent;
  const label = forecast?.growthLabel || "flat";
  const gp =
    g == null
      ? "n/a vs last month (edge case)"
      : `${g > 0 ? "+" : ""}${g}% change vs the latest month`;
  return `Projected next month is around ${p}. Trend suggests a ${label} — ${gp}. Linear model uses ${monthly.length} month(s) of history.`;
}

async function callOpenAIPrediction(apiKey, context) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are a business analyst. In 1-2 short sentences, explain the given monthly amount forecast. Be factual, no markdown.",
        },
        {
          role: "user",
          content: `Summarize this financial forecast: ${JSON.stringify(context)}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 200));
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}
