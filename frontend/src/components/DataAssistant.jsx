import { useState } from "react";
import { postNaturalLanguageQuery } from "../services/api";

/**
 * @param {object} props
 * @param {Intl.NumberFormat} props.moneyFmt
 */
export default function DataAssistant({ moneyFmt }) {
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [turn, setTurn] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = userQuery.trim();
    if (!q) return;

    setError("");
    setIsLoading(true);
    setTurn({ question: q, data: null });

    try {
      const res = await postNaturalLanguageQuery(q);
      const root = res?.data;
      if (!root?.success) {
        setError(root?.message || "Request failed");
        setTurn((t) => (t ? { ...t, data: null } : null));
        return;
      }
      setTurn({
        question: q,
        data: { ...root.data, message: root.message },
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Could not run your question. Try again.";
      setError(message);
      setTurn((t) => (t ? { ...t, data: null } : null));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-cyan-950/30 p-5 shadow-[0_0_0_1px_rgba(6,182,212,0.12),0_24px_60px_-28px_rgba(6,182,212,0.25)] sm:p-7"
      aria-labelledby="data-assistant-heading"
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 -bottom-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/30 to-violet-600/20 shadow-inner shadow-cyan-500/10"
              aria-hidden
            >
              <svg
                className="h-6 w-6 text-cyan-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z"
                />
              </svg>
            </div>
            <div>
              <p
                id="data-assistant-heading"
                className="text-[0.7rem] font-semibold uppercase tracking-wider text-cyan-300/90"
              >
                Data assistant
              </p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-white sm:text-xl">
                Ask about your data
              </h2>
              <p className="ui-subtitle mt-1 max-w-2xl">
                Describe what you want in plain English. Answers use only your workspace — filtered
                records or a quick summary.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <label htmlFor="nl-query" className="sr-only">
            Ask about your data
          </label>
          <input
            id="nl-query"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="ui-input flex-1 min-w-0 sm:py-3"
            placeholder="Ask about your data..."
            autoComplete="off"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userQuery.trim()}
            className="ui-btn-primary shrink-0 px-6 sm:min-w-[7.5rem]"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                Thinking…
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </form>

        {error ? (
          <div
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading && turn ? (
          <div className="mt-1 rounded-xl border border-white/[0.08] bg-slate-950/50 p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">You</p>
            <p className="mt-1 text-sm text-slate-200 [text-wrap:pretty]">{turn.question}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <span
                className="h-8 w-8 shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10"
                aria-hidden
              />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-3/4 max-w-sm animate-pulse rounded bg-cyan-500/20" />
                <div className="h-2.5 w-full max-w-md animate-pulse rounded bg-slate-600/20" />
                <div className="h-2.5 w-5/6 max-w-sm animate-pulse rounded bg-slate-600/15" />
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && turn?.data ? (
          <AssistantReply data={turn.data} question={turn.question} moneyFmt={moneyFmt} />
        ) : null}
      </div>
    </section>
  );
}

function AssistantReply({ data, question, moneyFmt }) {
  const { mode, message, userQuery, responseType, filters, records, summary, meta } = data || {};
  const showMessage =
    typeof message === "string" ? message : "Your workspace was queried successfully.";

  return (
    <div className="mt-1 space-y-3">
      <div className="rounded-xl border border-white/[0.08] bg-slate-950/40 p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">You</p>
        <p className="mt-1 text-sm text-slate-200 [text-wrap:pretty]">{question || userQuery}</p>
      </div>

      <div className="flex gap-3 rounded-xl border border-cyan-500/15 bg-gradient-to-b from-slate-950/80 to-slate-950/40 p-4 sm:p-5">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10"
          aria-hidden
        >
          <span className="text-lg" role="img" aria-label="Assistant">
            ✨
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-cyan-200/90">Assistant</span>
            {mode && mode !== "ok" ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-200/90">
                {mode === "unavailable" ? "Offline" : "Clarify"}
              </span>
            ) : responseType ? (
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200/80">
                {responseType === "summary" ? "Summary" : "Records"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
            {showMessage}
          </p>

          {filters && Object.keys(filters).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(filters).map(([k, v]) => {
                if (v == null || v === "") return null;
                return (
                  <span
                    key={k}
                    className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[0.7rem] text-slate-300"
                  >
                    <span className="text-slate-500">{k}</span>
                    <span className="mx-1 text-slate-600">·</span>
                    {String(v)}
                  </span>
                );
              })}
            </div>
          ) : null}

          {mode === "ok" && responseType === "summary" && summary ? (
            <SummaryView summary={summary} moneyFmt={moneyFmt} />
          ) : null}

          {mode === "ok" && responseType === "records" && Array.isArray(records) ? (
            <RecordsTable records={records} moneyFmt={moneyFmt} meta={meta} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryView({ summary, moneyFmt }) {
  const { count = 0, totalAmount = 0, byCategory = [] } = summary;
  return (
    <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
          <p className="ui-label">Matching records</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
            {Number(count).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
          <p className="ui-label">Total amount</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-200">
            {moneyFmt.format(Number(totalAmount) || 0)}
          </p>
        </div>
      </div>
      {byCategory.length > 0 ? (
        <div>
          <p className="ui-label mb-2">By category</p>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-white/[0.06] bg-slate-950/50 p-2">
            {byCategory.map((row) => (
              <li
                key={String(row.category)}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-white/[0.04]"
              >
                <span className="min-w-0 truncate font-medium text-slate-200">{row.category}</span>
                <span className="shrink-0 font-mono tabular-nums text-slate-300">
                  {moneyFmt.format(Number(row.totalAmount) || 0)}
                  <span className="ml-1.5 text-xs text-slate-500">({row.count})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RecordsTable({ records, moneyFmt, meta }) {
  if (records.length === 0) {
    return (
      <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm text-slate-400">
        No records matched those criteria.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      {meta?.returned != null ? (
        <p className="mb-2 text-xs text-slate-500">
          Showing {meta.returned}
          {meta.limit != null ? ` of up to ${meta.limit}` : ""} matches (newest first)
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-slate-950/60 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 sm:px-4">Date</th>
              <th className="px-3 py-2.5 sm:px-4">Title</th>
              <th className="px-3 py-2.5 sm:px-4">Category</th>
              <th className="px-3 py-2.5 text-right sm:px-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const d = r.date ? new Date(r.date) : null;
              const dateStr = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
              return (
                <tr
                  key={r._id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-400 sm:px-4">{dateStr}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2.5 font-medium text-slate-100 sm:max-w-xs sm:px-4">
                    {r.title}
                  </td>
                  <td className="px-3 py-2.5 text-slate-300 sm:px-4">{r.category}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-100 sm:px-4">
                    {moneyFmt.format(Number(r.amount) || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
