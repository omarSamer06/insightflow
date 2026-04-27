import { coerceNarrative, narrativeToText } from "./narrativeUtils.js";

/**
 * @param {object} context
 * @param {Array<{ month: string, totalAmount: number }>} context.monthly
 * @param {object} context.forecast
 * @returns {Promise<{ narrative: { metric: string, explanation: string, implication: string, recommendation: string }, text: string, source: "openai" | "mock" | "empty" }>}
 */
export async function generatePredictionInsight(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    const n = buildMockPredictionNarrative(context);
    return { narrative: n, text: narrativeToText(n), source: n.source };
  }
  try {
    const t = await callOpenAIPrediction(apiKey, context);
    if (t) {
      const parsed = safeJsonParseModel(t);
      if (parsed) {
        const n = coerceNarrative(parsed);
        return { narrative: n, text: narrativeToText(n), source: "openai" };
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Prediction insight AI fallback:", err?.message || err);
    }
  }
  const n = buildMockPredictionNarrative(context);
  return { narrative: n, text: narrativeToText(n), source: n.source };
}

function buildMockPredictionNarrative({ monthly, forecast }) {
  if (!monthly?.length) {
    return {
      metric: "No forecast (0 months of history).",
      explanation: "Monthly totals are not available yet, so a trend-based forecast cannot be computed.",
      implication: "The projection panel remains inactive until at least one month of data exists.",
      recommendation: "Add records across at least two calendar months to unlock growth context.",
      source: "empty",
    };
  }
  const p = Number(forecast?.predictedTotal) || 0;
  const g = forecast?.growthPercent;
  const label = forecast?.growthLabel || "flat";
  const gp = g == null ? null : `${g > 0 ? "+" : ""}${g}%`;

  const metric = [`Next month ${formatAmount(p)}`, gp ? `MoM ${gp}` : null].filter(Boolean).join(" • ");
  const explanation = `Forecast method: ${String(forecast?.method || "linear")} using ${monthly.length} month(s) of history. Growth label is “${label}”.`;
  const implication =
    label === "increase"
      ? "Expect higher run-rate next month; category control becomes more important."
      : label === "decrease"
        ? "Expect a lower run-rate next month; validate whether this is intentional or demand-driven."
        : "Expect a steady run-rate; focus on improving category signal and consistency.";
  const recommendation = "Use the last 2–3 months to validate the trend and sanity-check outliers before committing to next month’s plan.";

  return { metric, explanation, implication, recommendation, source: "mock" };
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
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return ONE JSON object only (no markdown) with string keys: metric, explanation, implication, recommendation. " +
            "Metric must include at least one number or percent from the input JSON. Be concise and business-focused.",
        },
        {
          role: "user",
          content: `Summarize this financial forecast (JSON): ${JSON.stringify(context)}`,
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

function safeJsonParseModel(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

function formatAmount(n) {
  const v = Number(n);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    Number.isFinite(v) ? v : 0
  );
}
