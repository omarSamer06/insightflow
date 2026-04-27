import { useState } from "react";
import api from "../services/api";

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/**
 * On-demand workspace report — professional document-style layout.
 */
export default function ReportGeneratorPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/report");
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Report request failed");
      }
      setReport(res.data.data ?? null);
      setGeneratedAt(new Date());
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Could not generate the report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-500/25 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/80 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.9)] ring-1 ring-inset ring-white/[0.05]"
      aria-labelledby="report-generator-heading"
    >
      <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-slate-900/0 px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-200/80">
              Reporting
            </p>
            <h2
              id="report-generator-heading"
              className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              Workspace business report
            </h2>
            <p className="ui-subtitle mt-1 max-w-2xl [text-wrap:pretty]">
              Full-period totals, monthly trends, category mix, and a written executive summary. Data is
              limited to your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="ui-btn-primary shrink-0 shadow-lg shadow-amber-900/20 ring-1 ring-amber-500/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                Generating…
              </span>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {error ? (
          <div
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading && !report ? (
          <div className="space-y-6">
            <div className="h-3 w-48 animate-pulse rounded bg-amber-500/15" />
            <div className="grid gap-3 sm:grid-cols-3">
              {["a", "b", "c"].map((k) => (
                <div key={k} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
            <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.03]" />
          </div>
        ) : null}

        {loading && report ? (
          <p className="mb-2 text-center text-xs font-medium text-amber-200/80 sm:text-left" aria-live="polite">
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
              aria-hidden
            />
            Refreshing report…
          </p>
        ) : null}

        {report ? (
          <div
            className={["report-document space-y-8", loading ? "pointer-events-none opacity-50" : ""].join(" ")}
            aria-busy={loading}
          >
            <div className="flex flex-col gap-1 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                  Document
                </p>
                <p className="text-sm font-medium text-slate-300">Workspace performance overview</p>
              </div>
              {generatedAt ? (
                <p className="text-xs tabular-nums text-slate-500">
                  Generated {generatedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              ) : null}
            </div>

            <ReportSummaryBlock summary={report.summary} />
            <ReportTrendsBlock trends={report.trends} />
            <ReportCategoriesBlock categories={report.categories} />
            <ReportAiBlock summary={report.summary} />
          </div>
        ) : null}

        {!loading && !error && !report ? (
          <p className="text-center text-sm text-slate-500 sm:text-left">
            Click <span className="font-medium text-slate-300">Generate Report</span> to build a fresh report
            from your live workspace data.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ReportSummaryBlock({ summary }) {
  if (!summary) return null;
  const { totalAmount, totalRecords, hasData, dateRange, topCategory, narrative } = summary;
  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${formatISODate(dateRange.from)} — ${formatISODate(dateRange.to)}`
      : "—";

  return (
    <div className="report-section">
      <h3 className="report-section-title">Summary</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="report-metric-card border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent">
          <p className="ui-label text-emerald-200/80">Total amount</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
            {hasData ? money.format(totalAmount) : "—"}
          </p>
        </div>
        <div className="report-metric-card border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-transparent">
          <p className="ui-label text-cyan-200/70">Total records</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
            {hasData ? compact.format(totalRecords) : "0"}
          </p>
        </div>
        <div className="report-metric-card border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent">
          <p className="ui-label text-violet-200/80">Top category</p>
          <p className="mt-2 truncate text-lg font-bold leading-snug text-white sm:text-xl" title={topCategory?.name}>
            {topCategory?.name ?? (hasData ? "—" : "—")}
          </p>
          {topCategory ? (
            <p className="mt-1 text-sm tabular-nums text-slate-400">{money.format(topCategory.totalAmount)}</p>
          ) : !hasData ? (
            <p className="mt-1 text-sm text-slate-500">No categories yet</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        <span className="text-slate-500">Data period: </span>
        {hasData ? dateLabel : "No records in scope"}
        {narrative?.source ? (
          <span className="ml-3 border-l border-white/10 pl-3 text-slate-500">
            Narrative: <SourceBadge source={narrative.source} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ReportTrendsBlock({ trends }) {
  if (!trends) return null;
  const { monthlyTotals, monthOverMonth, latestMonth } = trends;
  const rows = monthlyTotals || [];

  return (
    <div className="report-section">
      <h3 className="report-section-title">Trends</h3>
      {monthOverMonth ? (
        <div className="mt-3 rounded-xl border border-white/[0.08] bg-gradient-to-r from-slate-950/80 to-slate-900/40 p-4 sm:p-5">
          <p className="ui-label">Latest month-over-month</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-sm text-slate-400">
              {formatMonthKey(monthOverMonth.fromMonth)} → {formatMonthKey(monthOverMonth.toMonth)}
            </span>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums",
                monthOverMonth.direction === "up"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : monthOverMonth.direction === "down"
                    ? "bg-rose-500/20 text-rose-200"
                    : "bg-slate-500/20 text-slate-300",
              ].join(" ")}
            >
              {monthOverMonth.direction === "up" ? "▲" : monthOverMonth.direction === "down" ? "▼" : "—"}
              {monthOverMonth.deltaAmount >= 0 ? "+" : ""}
              {money.format(monthOverMonth.deltaAmount)}
              {monthOverMonth.percentChange != null ? (
                <span className="font-semibold text-slate-300">
                  ({monthOverMonth.percentChange > 0 ? "+" : ""}
                  {monthOverMonth.percentChange}%)
                </span>
              ) : null}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          {rows.length < 2
            ? "Add at least two calendar months of records to unlock an automatic month-over-month comparison."
            : "See the table below for month-by-month totals."}
        </p>
      )}

      {latestMonth ? (
        <p className="mt-2 text-xs text-slate-500">Latest data month: {formatMonthKey(latestMonth)}</p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
        <div className="max-h-56 overflow-auto sm:max-h-72">
          <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04] text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 sm:px-4">Month</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Amount</th>
                <th className="px-3 py-2.5 pr-4 text-right sm:px-4">Records</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((m) => (
                  <tr key={m.month} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-3 py-2 text-slate-200 sm:px-4">{formatMonthKey(m.month)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-100 sm:px-4">
                      {money.format(m.totalAmount)}
                    </td>
                    <td className="px-3 py-2 pr-4 text-right font-mono tabular-nums text-slate-400 sm:px-4">
                      {m.recordCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No monthly data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportCategoriesBlock({ categories }) {
  if (!categories) return null;
  const { byAmount, distinctCount } = categories;
  const rows = byAmount || [];

  return (
    <div className="report-section">
      <h3 className="report-section-title">Categories</h3>
      <p className="mt-1 text-sm text-slate-500">
        {typeof distinctCount === "number" ? (
          <>
            <span className="font-mono text-slate-300">{distinctCount}</span> distinct categor
            {distinctCount === 1 ? "y" : "ies"} in this workspace
          </>
        ) : null}
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
        <div className="max-h-64 overflow-auto sm:max-h-80">
          <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.04] text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 sm:px-4">Category</th>
                <th className="px-3 py-2.5 text-right sm:px-4">Total amount</th>
                <th className="px-3 py-2.5 pr-4 text-right sm:px-4">Records</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((c, i) => (
                  <tr
                    key={c.name + i}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.02] last:border-0"
                  >
                    <td className="px-3 py-2.5 text-slate-200 sm:px-4">
                      {i === 0 ? (
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-[0.65rem] font-bold text-amber-200">
                          1
                        </span>
                      ) : null}
                      {c.name}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-50 sm:px-4">
                      {money.format(c.totalAmount)}
                    </td>
                    <td className="px-3 py-2.5 pr-4 text-right font-mono tabular-nums text-slate-400 sm:px-4">
                      {c.recordCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No category breakdown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportAiBlock({ summary }) {
  const n = summary?.narrative;
  if (!n) return null;

  return (
    <div className="report-section">
      <h3 className="report-section-title">Report narrative</h3>
      <p className="mt-1 text-sm text-slate-500">
        Business-analyst commentary derived from the figures above.{" "}
        <SourceBadge className="align-middle" source={n.source} />
      </p>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 sm:p-5">
          <p className="ui-label text-emerald-200/80">Performance overview</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-100 [text-wrap:pretty]">
            {n.performanceOverview}
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-4 sm:p-5">
          <p className="ui-label text-sky-200/80">Trend analysis</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-100 [text-wrap:pretty]">
            {n.trendAnalysis}
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-4 sm:p-5">
          <p className="ui-label text-violet-200/80">Category breakdown</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-100 [text-wrap:pretty]">
            {n.categoryBreakdown}
          </p>
        </div>
        <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.05] p-4 sm:p-5">
          <p className="ui-label text-fuchsia-200/80">Recommendations</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-100 [text-wrap:pretty]">
            {n.recommendations}
          </p>
        </div>
      </div>
    </div>
  );
}

function SourceBadge({ source, className = "" }) {
  const { label, style } = sourceInfo(source);
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider",
        style,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function sourceInfo(source) {
  if (source === "openai") {
    return { label: "AI generated", style: "border-violet-400/30 bg-violet-500/15 text-violet-200" };
  }
  if (source === "mock") {
    return { label: "Template (offline)", style: "border-slate-500/30 bg-slate-500/10 text-slate-300" };
  }
  if (source === "empty") {
    return { label: "No data", style: "border-slate-500/30 bg-slate-800/50 text-slate-500" };
  }
  return { label: "—", style: "border-white/10 bg-white/5 text-slate-500" };
}

function formatISODate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatMonthKey(key) {
  if (!key || typeof key !== "string") return "—";
  const [y, m] = key.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
