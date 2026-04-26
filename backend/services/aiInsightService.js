import { buildMockInsightSummary } from "./mockInsightText.js";

/**
 * @param {object} stats - output from buildInsightStatsFromRecords
 * @returns {Promise<{ summary: string, source: "openai" | "mock" }>}
 */
export async function generateInsightSummary(stats) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return {
      summary: buildMockInsightSummary(stats),
      source: "mock",
    };
  }

  try {
    const text = await callOpenAI(apiKey, stats);
    if (!text) throw new Error("Empty OpenAI response");
    return { summary: text.trim(), source: "openai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    if (process.env.NODE_ENV !== "production") {
      console.warn("AI insight fallback:", message);
    }
    return {
      summary: buildMockInsightSummary(stats),
      source: "mock",
    };
  }
}

async function callOpenAI(apiKey, stats) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const payload = {
    model,
    temperature: 0.35,
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content:
          "You are a concise business analytics assistant for a multi-tenant SaaS dashboard. " +
          "Write clear, professional insights: trends, growth signals, and 2-4 practical recommendations. " +
          "Use short paragraphs or bullet points. No markdown code blocks. Do not invent data beyond the JSON.",
      },
      {
        role: "user",
        content:
          "Analyze this workspace financial record summary (JSON). Respond with actionable insights only.\n\n" +
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
