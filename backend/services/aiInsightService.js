import { buildMockInsightNarrative, buildMockInsightSummary } from "./mockInsightText.js";
import { coerceNarrative, narrativeToText } from "./narrativeUtils.js";

/**
 * @param {object} stats - output from buildInsightStatsFromRecords
 * @returns {Promise<{ narrative: { metric: string, explanation: string, implication: string, recommendation: string }, executiveSummary: string, summary: string, source: "openai" | "mock" | "empty" }>}
 */
export async function generateInsightSummary(stats) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    const n = buildMockInsightNarrative(stats);
    return {
      narrative: coerceNarrative(n),
      executiveSummary: String(n.executiveSummary || "").trim(),
      summary: narrativeToText(n),
      source: n.source,
    };
  }

  try {
    const text = await callOpenAI(apiKey, stats);
    if (!text) throw new Error("Empty OpenAI response");
    const parsed = safeJsonParseModel(text);
    if (!parsed) throw new Error("Invalid JSON from model");
    const narrative = coerceNarrative(parsed);
    const executiveSummary = String(parsed.executiveSummary || "").trim();
    return {
      narrative,
      executiveSummary: executiveSummary || narrative.metric,
      summary: narrativeToText(narrative),
      source: "openai",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    if (process.env.NODE_ENV !== "production") {
      console.warn("AI insight fallback:", message);
    }
    const n = buildMockInsightNarrative(stats);
    return {
      narrative: coerceNarrative(n),
      executiveSummary: String(n.executiveSummary || "").trim(),
      summary: narrativeToText(n),
      source: n.source,
    };
  }
}

async function callOpenAI(apiKey, stats) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.35,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write premium, business-grade analytics narratives for a secure multi-tenant SaaS dashboard. " +
          "Return ONE JSON object only (no markdown) with EXACT string keys: " +
          "\"executiveSummary\", \"metric\", \"explanation\", \"implication\", \"recommendation\". " +
          "The executiveSummary must be 2–3 sentences in an executive tone and MUST include: " +
          "(1) percentage change vs previous period when available, (2) top contributing category, (3) clear trend (growth/decline/stable), " +
          "(4) what is driving the change, and (5) what to do next. " +
          "Metric must include at least one number or percentage from the input. " +
          "Do not invent numbers beyond the JSON.",
      },
      {
        role: "user",
        content:
          "Analyze this workspace financial record summary (JSON) and produce the narrative fields.\n\n" +
          JSON.stringify(stats, null, 2),
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
