import { useState } from "react";
import api from "../services/api";

const moneyFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/**
 * On-demand GET /api/insights narrative + key stats.
 */
export default function InsightsPanel() {
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [insightData, setInsightData] = useState(null);

  const handleAnalyzeInsights = async () => {
    setInsightError("");
    setInsightData(null);
    setInsightLoading(true);
    try {
      const res = await api.get("/insights");
      const payload = res?.data?.data;
      if (payload) setInsightData(payload);
    } catch (e) {
      const message =
        e?.response?.data?.message || e?.message || "Could not load AI insights. Try again.";
      setInsightError(message);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <section
      className="insight-glow border border-violet-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/80 p-6 sm:p-8"
      aria-labelledby="insight-panel-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p
            id="insight-panel-heading"
            className="text-[0.7rem] font-semibold uppercase tracking-wider text-violet-300/90"
          >
            AI insights
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">Smarter read on your data</h2>
          <p className="ui-subtitle mt-1 max-w-xl">
            Run an on-demand analysis. We send aggregated stats to the insight engine; your raw rows stay on the
            server.
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleAnalyzeInsights}
            disabled={insightLoading}
            className="ui-btn-primary min-w-[10rem] shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 transition-transform duration-200 enabled:hover:scale-[1.02] enabled:active:scale-[0.99]"
          >
            {insightLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                Analyzing…
              </span>
            ) : (
              "Analyze My Data"
            )}
          </button>
        </div>
      </div>

      {insightError ? (
        <div
          className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {insightError}
        </div>
      ) : null}

      {insightLoading && !insightData ? (
        <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="h-3 w-3/4 max-w-md animate-pulse rounded bg-violet-500/20" />
          <div className="h-3 w-full animate-pulse rounded bg-violet-500/10" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-violet-500/10" />
        </div>
      ) : null}

      {insightData && !insightLoading ? (
        <div className="insight-reveal mt-6 rounded-xl border border-white/10 bg-slate-950/50 p-5 shadow-inner sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              {insightData.source === "openai" ? "AI generated" : "Data-driven"}
            </span>
          </div>
          {insightData.narrative ? (
            <div className="space-y-3">
              {insightData.executiveSummary ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                  <p className="ui-label text-emerald-200/80">Executive summary</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-100 [text-wrap:pretty]">
                    {insightData.executiveSummary}
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="ui-label text-violet-200/80">Metric</p>
                <p className="mt-1 text-sm font-semibold text-slate-100 [text-wrap:pretty]">
                  {insightData.narrative.metric}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-4">
                  <p className="ui-label text-sky-200/80">Explanation</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
                    {insightData.narrative.explanation}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                  <p className="ui-label text-amber-200/80">Implication</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
                    {insightData.narrative.implication}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.05] p-4">
                <p className="ui-label text-fuchsia-200/80">Recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
                  {insightData.narrative.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
              {insightData.summary}
            </p>
          )}
          {insightData.keyStats ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 transition hover:border-emerald-500/35">
                <p className="ui-label">Total amount</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-200">
                  {moneyFmt.format(Number(insightData.keyStats.totalAmount) || 0)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {insightData.keyStats.recordCount?.toLocaleString() ?? 0} records
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4 transition hover:border-violet-500/35">
                <p className="ui-label">Top category</p>
                <p className="mt-1 text-lg font-bold text-violet-100">
                  {insightData.keyStats.topCategory?.name ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {insightData.keyStats.topCategory
                    ? `${moneyFmt.format(
                        Number(insightData.keyStats.topCategory.totalAmount) || 0
                      )} across ${insightData.keyStats.topCategory.recordCount} record${
                        insightData.keyStats.topCategory.recordCount === 1 ? "" : "s"
                      }`
                    : "No category split yet"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
