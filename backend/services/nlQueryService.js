const FILTER_KEYS = new Set([
  "category",
  "titleContains",
  "minAmount",
  "maxAmount",
  "dateFrom",
  "dateTo",
]);

function sanitizeFilters(raw) {
  if (raw == null || typeof raw !== "object") return {};
  const out = {};
  for (const k of Object.keys(raw)) {
    if (!FILTER_KEYS.has(k)) continue;
    const v = raw[k];
    if (v == null) {
      out[k] = null;
      continue;
    }
    if (k === "minAmount" || k === "maxAmount") {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
      else out[k] = null;
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

function parseStructuredResponse(obj) {
  if (!obj || typeof obj !== "object") return null;
  const rt = obj.responseType;
  if (rt !== "records" && rt !== "summary") return null;
  return { responseType: rt, filters: sanitizeFilters(obj.filters) };
}

/**
 * @param {string} userQuery
 * @returns {Promise<{ ok: true, value: { responseType: 'records'|'summary', filters: object } } | { ok: false, error: string }>}
 */
export async function interpretQueryWithOpenAI(userQuery) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).trim() === "") {
    return { ok: false, error: "OPENAI_NOT_CONFIGURED" };
  }

  const text = String(userQuery || "").trim();
  if (!text) {
    return { ok: false, error: "EMPTY_QUERY" };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system = `You convert natural language questions about financial "records" into structured JSON filters.
Each record has: title (string), amount (number), category (string), date (ISO datetime — compare by calendar day in UTC when user mentions dates).
The user is always scoped to their own workspace; never output workspace ids.

You MUST respond with a single valid JSON object only (no markdown, no code fences) using this exact shape:
{
  "responseType": "records" or "summary",
  "filters": {
    "category": string or null,
    "titleContains": string or null,
    "minAmount": number or null,
    "maxAmount": number or null,
    "dateFrom": "YYYY-MM-DD" or null,
    "dateTo": "YYYY-MM-DD" or null
  }
}
Rules:
- Use "summary" for totals, sums, how much, aggregate questions.
- Use "records" for lists, show, find, filter questions.
- Use null for any field not implied by the user.
- For month names (e.g. "January 2026"), set dateFrom/dateTo to cover that month in UTC.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `OPENAI_HTTP_${res.status}:${err.slice(0, 120)}` };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return { ok: false, error: "OPENAI_INVALID_RESPONSE" };
    }

    const raw = JSON.parse(content);
    const parsed = parseStructuredResponse(raw);
    if (!parsed) {
      return { ok: false, error: "OPENAI_SCHEMA_MISMATCH" };
    }

    return { ok: true, value: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse_failed";
    return { ok: false, error: message };
  }
}
