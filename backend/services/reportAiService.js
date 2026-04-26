import { buildMockReportNarrative } from "./reportMockNarrative.js";

const SYSTEM = `You are a concise financial analytics writer for a secure multi-tenant SaaS dashboard. 
The user will send ONLY aggregated JSON about one workspace (totals, monthly sums, top categories) — not raw rows. 
You must respond with ONE JSON object (no markdown, no code fences) with exactly these string fields:
"performanceOverview" — 2-4 short sentences: overall position and what stands out.
"growthOrDecline" — 2-3 sentences: explain recent month-over-month change if provided; if not enough data, say so plainly.
"recommendation" — 2-3 practical, business-oriented suggestions. Do not invent numbers; only use information from the input JSON.`;

/**
 * @param {object} report - output of aggregateWorkspaceReport: { summary, trends, categories }
 * @returns {Promise<{ performanceOverview: string, growthOrDecline: string, recommendation: string, source: "openai" | "empty" | "mock" }>}
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

    const p = String(parsed.performanceOverview || "").trim();
    const g = String(parsed.growthOrDecline || parsed.growthDecline || "").trim();
    const r = String(parsed.recommendation || "").trim();

    if (!p && !g && !r) {
      throw new Error("Empty narrative fields");
    }

    return {
      performanceOverview: p || "See structured metrics in the report payload.",
      growthOrDecline: g || "Month-over-month context is in the report trends.",
      recommendation: r || "Use the category breakdown to prioritize reviews.",
      source: "openai",
    };
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
