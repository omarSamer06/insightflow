import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchWorkspaceReport } from "../services/api";

/**
 * @param {object} props
 * @param {Intl.NumberFormat} props.moneyFmt
 */
export default function ReportGenerator({ moneyFmt }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetchWorkspaceReport();
      const root = res?.data;
      if (!root?.success) {
        setError(root?.message || "Report could not be generated.");
        return;
      }
      setReport(root.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load report.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-slate-500/20 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-emerald-950/20 p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.1)] sm:p-7"
      aria-labelledby="report-heading"
    >
      <div
        className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 -bottom-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300/80">
              Reports
            </p>
            <h2
              id="report-heading"
              className="mt-0.5 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              Workspace report
            </h2>
            <p className="ui-subtitle mt-1 max-w-2xl">
              Aggregated totals, monthly trends, and a narrative for your current workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="ui-btn-primary min-w-[11rem] shrink-0 shadow-lg shadow-emerald-900/20 ring-1 ring-white/10"
          >
            {isLoading ? (
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

        {error ? (
          <div
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading && !report ? (
          <div className="ui-card space-y-4 p-5 sm:p-6">
            <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
              <div className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
              <div className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
            </div>
            <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        ) : null}

        {report ? <ReportContent report={report} moneyFmt={moneyFmt} isRefreshing={isLoading} /> : null}

        {!isLoading && !report && !error ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/40 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-300">No report yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Run a report to see summary metrics, trend charts, and AI-generated insights.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReportContent({ report, moneyFmt, isRefreshing }) {
  const { summary, categoryBreakdown = [], ai, generatedAt } = report || {};
  const trends = summary?.trends || {};
  const chartData = (trends.monthly || []).map((m) => ({
    month: m.month,
    amount: m.totalAmount,
    count: m.recordCount,
  }));

  const fromLabel = formatIsoDate(summary?.dateRange?.from);
  const toLabel = formatIsoDate(summary?.dateRange?.to);
  const genLabel = formatIsoDateTime(generatedAt);

  return (
    <article
      className={[
        "ui-card overflow-hidden border border-white/[0.1] shadow-xl shadow-black/20 transition-opacity",
        isRefreshing ? "opacity-80" : "",
      ].join(" ")}
    >
      <header className="border-b border-white/[0.06] bg-gradient-to-r from-slate-950/80 to-slate-900/40 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">Current report</h3>
            {isRefreshing ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-200/90">
                <span
                  className="h-3 w-3 animate-spin rounded-full border border-emerald-400/40 border-t-emerald-200"
                  aria-hidden
                />
                Refreshing
              </span>
            ) : null}
          </div>
          {genLabel ? (
            <p className="text-xs text-slate-500">Generated {genLabel}</p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col divide-y divide-white/[0.06]">
        <section className="p-5 sm:p-6">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
            Summary
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {fromLabel && toLabel
              ? `Data window: ${fromLabel} — ${toLabel}`
              : "No date range (no records with valid dates)."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="ui-label">Total amount</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-200">
                {moneyFmt.format(Number(summary?.totalAmount) || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="ui-label">Records</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                {Number(summary?.recordCount || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="ui-label">Top category</p>
              <p className="mt-1 truncate text-lg font-semibold text-slate-100" title={summary?.topCategory?.name}>
                {summary?.topCategory?.name ?? "—"}
              </p>
              {summary?.topCategory ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  {moneyFmt.format(Number(summary.topCategory.totalAmount) || 0)} ·{" "}
                  {summary.topCategory.recordCount} record{summary.topCategory.recordCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-slate-950/50 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 sm:px-4">Category</th>
                    <th className="px-3 py-2.5 sm:px-4">Amount</th>
                    <th className="px-3 py-2.5 sm:px-4">Share</th>
                    <th className="px-3 py-2.5 text-right sm:px-4">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((row) => (
                    <tr
                      key={row.category}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 font-medium text-slate-200 sm:px-4">{row.category}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-slate-200 sm:px-4">
                        {moneyFmt.format(Number(row.totalAmount) || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 sm:px-4">
                        {Number(row.percentOfTotal).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-400 sm:px-4">
                        {row.recordCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No category breakdown (empty workspace).</p>
          )}
        </section>

        <section className="p-5 sm:p-6">
          <h4 className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">Trends</h4>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MoMBadge trends={trends} />
            {trends?.comparedMonths ? (
              <span className="text-xs text-slate-500">
                {trends.comparedMonths.previous} → {trends.comparedMonths.current}
              </span>
            ) : null}
          </div>

          {chartData.length > 0 ? (
            <div className="mt-4 h-56 min-h-[14rem] sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.9)" />
                      <stop offset="100%" stopColor="rgba(5, 150, 105, 0.45)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => moneyFmt.format(Number(v))}
                  />
                  <Tooltip
                    formatter={(value) => [moneyFmt.format(Number(value)), "Amount"]}
                    labelFormatter={(l) => `Month: ${l}`}
                    contentStyle={{
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "rgba(241,245,249,0.95)",
                    }}
                  />
                  <Bar dataKey="amount" name="Total amount" fill="url(#reportBar)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Not enough history to plot monthly trends.</p>
          )}
          {chartData.length > 0 ? (
            <p className="mt-2 text-center text-[0.7rem] text-slate-500">
              Last {chartData.length} month{chartData.length === 1 ? "" : "s"} in view
            </p>
          ) : null}
        </section>

        <section className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
              Insights
            </h4>
            {ai?.source ? (
              <span
                className={[
                  "rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                  ai.source === "openai"
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                    : "border-slate-500/30 bg-slate-500/10 text-slate-300",
                ].join(" ")}
              >
                {ai.source === "openai" ? "AI narrative" : "Template"}
              </span>
            ) : null}
          </div>
          <div className="mt-3 rounded-xl border border-violet-500/15 bg-gradient-to-b from-slate-950/60 to-slate-950/30 p-4 sm:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
              {ai?.explanation || "No insight text available."}
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}

function MoMBadge({ trends }) {
  const d = trends?.recentDirection;
  const pct = trends?.monthOverMonthChangePercent;
  if (d === "insufficient_data" || pct == null) {
    return (
      <span className="inline-flex items-center rounded-lg border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-300">
        Month-over-month: needs more months
      </span>
    );
  }
  const isUp = d === "up";
  const isDown = d === "down";
  const label =
    d === "flat"
      ? "Flat"
      : `${isUp ? "↑" : isDown ? "↓" : "—"} ${Math.abs(Number(pct)).toFixed(1)}%`;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums",
        isUp
          ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-200"
          : isDown
            ? "border-rose-500/35 bg-rose-500/12 text-rose-200"
            : "border-slate-500/30 bg-slate-500/10 text-slate-300",
      ].join(" ")}
    >
      <span className="text-slate-500">vs prior month</span>
      {label}
    </span>
  );
}

function formatIsoDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatIsoDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
