/**
 * Calls OpenAI to interpret userQuery into a strict JSON instruction.
 * Never executes user text as code — only parses JSON and validates elsewhere.
 */

const SCHEMA_HINT = `You must respond with ONE JSON object only. No markdown, no code fences. Valid shapes:
1) { "type": "summary", "metric": "total_amount" | "record_count" | "max_month" | "top_category" | "average_amount" }
2) { "type": "filter", "category": string (optional), "dateRange": "last_7_days" | "last_month" | "last_3_months" | "this_month" | "all", "limit": number (optional, 1-100) }
3) { "type": "unsupported", "reason": string }

Choose "summary" for questions about totals, averages, which month was highest, top category.
Choose "filter" for listing or finding records by category or time period.
If the question is off-topic or unsafe, use "unsupported".`;

/**
 * @returns {Promise<{ ok: true, parsed: object } | { ok: false, fallbackMessage: string }>}
 */
export async function requestNlQueryInterpretation(userQuery, metadata) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return {
      ok: false,
      fallbackMessage:
        "Natural language query is not configured (missing OPENAI_API_KEY). Add a key to enable this feature.",
    };
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SCHEMA_HINT}\nmetadata about the current workspace (JSON):\n${JSON.stringify(metadata)}` },
          { role: "user", content: `User question: ${userQuery}` },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("Empty or invalid model response");
    const parsed = safeJsonParse(raw);
    if (!parsed) throw new Error("Could not parse model JSON");
    return { ok: true, parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    if (process.env.NODE_ENV !== "production") {
      console.warn("NL query AI error:", message);
    }
    return {
      ok: false,
      fallbackMessage: "We could not run the language model right now. Please try again later.",
    };
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
