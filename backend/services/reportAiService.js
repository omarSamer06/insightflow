import { buildMockReportNarrative } from "./reportMockNarrative.js";
import { coerceReportNarrative } from "./reportNarrativeUtils.js";

const SYSTEM = `You write premium, business-grade analytics narratives for a secure multi-tenant SaaS dashboard.
Input is aggregated JSON only (totals, monthly totals, top categories). Do not invent numbers.

Return ONE JSON object only (no markdown) with EXACT string keys:
- "performanceOverview": 2–3 concise sentences with totals (total amount, record count) and top category.
- "trendAnalysis": 2–3 concise sentences with growth rate vs previous month (percent + absolute delta) and interpretation.
- "categoryBreakdown": 2–3 concise sentences with top category amount and (if possible) share of total.
- "recommendations": 2–3 concise sentences with actionable next steps based on trend direction.

Avoid vague filler like \"your data shows\". Use specific numbers from the JSON.`;

/**
 * @param {object} report - output of aggregateWorkspaceReport: { summary, trends, categories }
 * @returns {Promise<{ performanceOverview: string, trendAnalysis: string, categoryBreakdown: string, recommendations: string, source: "openai" | "empty" | "mock" }>}
 */
export async function generateReportNarrative(report) {
  if (!report?.summary?.hasData) {
    return buildMockReportNarrative(report);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return buildMockReportNarrative(report);
  }

  try {
    const text = await callOpenAIJson(apiKey, report);
    const parsed = safeJsonParseModel(text);
    if (!parsed) throw new Error("Invalid JSON from model");

    const n = coerceReportNarrative(parsed);
    return { ...n, source: "openai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    if (process.env.NODE_ENV !== "production") {
      console.warn("Report AI fallback:", message);
    }
    return buildMockReportNarrative(report);
  }
}

async function callOpenAIJson(apiKey, report) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            "Aggregated workspace report (JSON). Write the three narrative fields in JSON as instructed.\n\n" +
            JSON.stringify(report, null, 2),
        },
      ],
    }),
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
