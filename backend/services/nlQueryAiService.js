import { interpretWithHeuristics } from "./nlQueryHeuristics.js";

/**
 * Calls OpenAI to interpret userQuery into a strict JSON instruction.
 * If OPENAI_API_KEY is unset, uses local heuristics (same instruction shapes).
 * Never executes user text as code — only parses JSON and validates elsewhere.
 */

const SCHEMA_HINT = `You must respond with ONE JSON object only. No markdown, no code fences. Valid shapes:
1) { "type": "summary", "metric": "total_amount" | "record_count" | "max_month" | "top_category" | "average_amount" | "period_performance", "dateRange"?: "last_7_days" | "last_month" | "last_3_months" | "this_month" | "all" }
2) { "type": "filter", "category": string (optional), "dateRange": "last_7_days" | "last_month" | "last_3_months" | "this_month" | "all", "limit": number (optional, 1-100) }
3) { "type": "aggregation", "groupBy": "month" | "category", "metric": "total_amount" | "record_count" | "average_amount", "dateRange"?: "last_7_days" | "last_month" | "last_3_months" | "this_month" | "all", "category"?: string, "limit"?: number (1-60) }
4) { "type": "unsupported", "reason": string }

Choose "summary" for questions about totals, averages, which month was highest, top category, and last month performance.
Choose "filter" for listing or finding records by category or time period.
Choose "aggregation" for monthly totals or category totals.
If the question is off-topic or unsafe, use "unsupported".`;

/**
 * @returns {Promise<{ ok: true, parsed: object, source: "heuristic" | "openai" } | { ok: false, fallbackMessage: string, detail?: string }>}
 */
export async function requestNlQueryInterpretation(userQuery, metadata) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("NL query: no OPENAI_API_KEY — using local heuristics.");
    }
    return {
      ok: true,
      parsed: interpretWithHeuristics(userQuery, metadata),
      source: "heuristic",
    };
  }

  try {
    const model = String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let res;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 512,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `${SCHEMA_HINT}\nmetadata about the current workspace (JSON):\n${JSON.stringify(metadata)}`,
            },
            { role: "user", content: `User question: ${userQuery}` },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const bodyText = await res.text();

    if (!res.ok) {
      const hint = parseOpenAiErrorBody(bodyText);
      if (process.env.NODE_ENV !== "production") {
        console.warn("NL query OpenAI HTTP", res.status, hint || bodyText.slice(0, 400), "— using heuristics");
      } else {
        console.warn("NL query OpenAI failed; using heuristics.");
      }
      return {
        ok: true,
        parsed: interpretWithHeuristics(userQuery, metadata),
        source: "heuristic",
      };
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error("Invalid JSON from OpenAI (response body was not JSON)");
    }

    const message = data?.choices?.[0]?.message;
    const raw = message?.content;
    if (message?.refusal) {
      throw new Error(`Model refused the request: ${String(message.refusal).slice(0, 200)}`);
    }
    if (typeof raw !== "string" || raw.trim() === "") {
      throw new Error("Empty model content (no JSON in response)");
    }

    const parsed = safeJsonParse(raw);
    if (!parsed) throw new Error("Could not parse model JSON from content");
    return { ok: true, parsed, source: "openai" };
  } catch (err) {
    const errName = err?.name;
    const errMessage = err instanceof Error ? err.message : "AI request failed";

    if (process.env.NODE_ENV !== "production") {
      console.warn("NL query OpenAI error; using heuristics:", errName, errMessage);
    } else {
      console.warn("NL query: OpenAI request failed, using heuristics.");
    }

    return {
      ok: true,
      parsed: interpretWithHeuristics(userQuery, metadata),
      source: "heuristic",
    };
  }
}

/**
 * @param {string} bodyText
 */
function parseOpenAiErrorBody(bodyText) {
  try {
    const j = JSON.parse(bodyText);
    return j?.error?.message || j?.message || "";
  } catch {
    return bodyText.slice(0, 300);
  }
}

function safeJsonParse(text) {
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
