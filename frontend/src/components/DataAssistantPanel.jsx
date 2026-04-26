import { useState } from "react";
import api from "../services/api";

const moneyFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/**
 * One-shot natural language query — assistant-style, not a chat.
 */
export default function DataAssistantPanel() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userQuery = value.trim();
    if (!userQuery) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/query", { userQuery });
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Request failed");
      }
      setPayload(res.data.data ?? null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Could not run your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-indigo-950/50 shadow-[0_20px_50px_-24px_rgba(99,102,241,0.45)] ring-1 ring-inset ring-white/[0.06]"
      aria-labelledby="data-assistant-heading"
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden
      />
      <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/15 text-indigo-200 shadow-inner"
              aria-hidden
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </span>
            <div>
              <h2
                id="data-assistant-heading"
                className="text-base font-bold tracking-tight text-white sm:text-lg"
              >
                Data assistant
              </h2>
              <p className="ui-subtitle mt-0.5 max-w-xl [text-wrap:pretty]">
                Ask in plain language. Answers use your workspace data only; nothing runs as raw code.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <label htmlFor="nl-query" className="sr-only">
            Your question
          </label>
          <input
            id="nl-query"
            name="userQuery"
            type="text"
            autoComplete="off"
            placeholder="Ask about your data..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="ui-input min-w-0 flex-1"
            disabled={loading}
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="ui-btn-primary shrink-0 px-6 sm:min-w-[7.5rem]"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                Working
              </span>
            ) : (
              "Ask AI"
            )}
          </button>
        </form>
      </div>

      <div className="relative px-5 py-4 sm:px-6 sm:py-5" aria-live="polite">
        {error ? (
          <div
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading && !payload ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <div className="h-3 w-2/3 max-w-sm animate-pulse rounded bg-indigo-500/20" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-500/15" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-500/10" />
          </div>
        ) : null}

        {loading && payload ? (
          <p className="mb-2 text-center text-xs font-medium text-indigo-300/90 sm:text-left">
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
              aria-hidden
            />
            Updating your answer…
          </p>
        ) : null}

        {payload ? (
          <div
            className={loading ? "pointer-events-none opacity-55 transition duration-200" : ""}
            aria-busy={loading}
          >
            <AssistantResult data={payload} />
          </div>
        ) : null}

        {!loading && !error && !payload ? (
          <p className="text-center text-xs text-slate-500 sm:text-left">
            <span className="text-slate-400">Try:</span> “What is my total amount?”{" "}
            <span className="text-slate-600">·</span> “Show me records from last month”{" "}
            <span className="text-slate-600">·</span> “Which category is largest?”
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AssistantResult({ data }) {
  const { answer, interpretation, result, metadata } = data || {};
  const capped = metadata?.capped;

  if (!result && answer) {
    return (
      <div className="assistant-fade-in rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5">
        <p className="text-sm font-medium leading-relaxed text-slate-100 [text-wrap:pretty]">{answer}</p>
        {capped ? <MetadataNote capped={capped} /> : null}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.kind === "message") {
    return (
      <div className="assistant-fade-in rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5">
        {interpretation?.type ? (
          <p className="ui-label text-amber-200/80">Note</p>
        ) : null}
        <p className="text-sm text-slate-200 [text-wrap:pretty]">{result.text || answer}</p>
        {capped ? <MetadataNote capped={capped} /> : null}
      </div>
    );
  }

  if (result.kind === "summary") {
    return (
      <div className="assistant-fade-in space-y-4">
        <div className="rounded-xl border border-white/[0.1] bg-gradient-to-br from-slate-950/80 to-indigo-950/30 p-5 ring-1 ring-inset ring-white/[0.04]">
          <p className="ui-label text-indigo-300/90">Result</p>
          <p className="mt-2 text-base font-medium leading-relaxed text-white [text-wrap:pretty]">
            {answer}
          </p>
          {result.value != null && result.metric !== "max_month" && result.metric !== "top_category" ? (
            <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-emerald-200/95">
              {result.metric === "record_count"
                ? Number(result.value).toLocaleString()
                : moneyFmt.format(Number(result.value) || 0)}
            </p>
          ) : null}
        </div>
        {capped ? <MetadataNote capped={capped} /> : null}
      </div>
    );
  }

  if (result.kind === "records") {
    const rows = result.records || [];
    return (
      <div className="assistant-fade-in space-y-3">
        <p className="text-sm font-medium text-slate-200 [text-wrap:pretty]">{answer}</p>
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/50">
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.04] text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 sm:px-4">Date</th>
                  <th className="px-3 py-2.5 sm:px-4">Title</th>
                  <th className="px-3 py-2.5 sm:px-4">Category</th>
                  <th className="px-3 py-2.5 pr-4 text-right sm:px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-white/[0.05] transition hover:bg-white/[0.04]"
                  >
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums sm:px-4">
                      {row.date ? new Date(row.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) : "—"}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5 text-slate-200 sm:max-w-xs sm:px-4" title={row.title}>
                      {row.title}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 sm:px-4">{row.category}</td>
                    <td className="px-3 py-2.5 pr-4 text-right font-mono tabular-nums text-slate-50 sm:px-4">
                      {moneyFmt.format(Number(row.amount) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No records matched.</p>
        ) : null}
        {capped ? <MetadataNote capped={capped} /> : null}
      </div>
    );
  }

  return null;
}

function MetadataNote({ capped }) {
  if (!capped) return null;
  return (
    <p className="text-[0.7rem] text-slate-500">
      Context uses up to 5,000 recent records; very large workspaces may be summarized.
    </p>
  );
}
