import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#a855f7",
  "#94a3b8",
];
import DataAssistant from "../components/DataAssistant";
import ReportGenerator from "../components/ReportGenerator";
import ShellLayout from "../components/ShellLayout";
import ChartCard from "../components/ChartCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  buildCategoryDistribution,
  buildLineSeries,
  buildMonthlyTotals,
  computeKpis,
} from "../utils/analytics";

export default function Dashboard() {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [insightData, setInsightData] = useState(null);

  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState("");
  const [predData, setPredData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllRecords() {
      try {
        setIsLoading(true);
        setError("");

        // Pull a large page for analytics; backend caps at 100.
        const res = await api.get("/records?page=1&limit=100&sortBy=date&sortOrder=desc");
        if (cancelled) return;
        const payload = res?.data?.data;
        setRecords(payload?.records || []);
      } catch (e) {
        if (cancelled) return;
        const message =
          e?.response?.data?.message || e?.message || "Failed to load dashboard data";
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAllRecords();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || error) return;
    let cancelled = false;
    async function fetchPredictions() {
      try {
        setPredLoading(true);
        setPredError("");
        const res = await api.get("/predictions");
        if (cancelled) return;
        setPredData(res?.data?.data || null);
      } catch (e) {
        if (cancelled) return;
        setPredData(null);
        setPredError(e?.response?.data?.message || e?.message || "Could not load predictions.");
      } finally {
        if (!cancelled) setPredLoading(false);
      }
    }
    fetchPredictions();
    return () => {
      cancelled = true;
    };
  }, [isLoading, error]);

  const kpis = useMemo(() => computeKpis(records), [records]);
  const lineData = useMemo(() => buildLineSeries(records, 14), [records]);
  const monthlyData = useMemo(() => buildMonthlyTotals(records, 6), [records]);
  const categoryData = useMemo(() => buildCategoryDistribution(records, 6), [records]);

  const moneyFmt = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }),
    []
  );

  const forecastPoints = useMemo(() => {
    if (!predData?.monthly?.length) return [];
    const pred = predData.predictedNextMonth;
    const rows = predData.monthly.map((m) => ({
      month: m.month,
      amount: m.totalAmount,
      kind: "actual",
    }));
    if (pred?.month && pred?.totalAmount != null && predData.method !== "empty") {
      rows.push({ month: pred.month, amount: pred.totalAmount, kind: "forecast" });
    }
    return rows;
  }, [predData]);

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
    <ShellLayout>
      <div className="flex flex-col gap-8 md:gap-10">
        <section className="ui-card ui-card-hover relative overflow-hidden p-8 sm:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-transparent blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              Overview
            </p>
            <h1 className="ui-page-title mt-2">
              Welcome{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="ui-subtitle mt-3 max-w-2xl">
              KPIs and charts below use live data from your workspace — no sample data.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/records" className="ui-btn-primary">
                Manage records
              </Link>
              <Link to="/settings" className="ui-btn-secondary">
                Settings
              </Link>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {["Total records", "Total amount", "Recent activity"].map((label) => (
              <div key={label} className="ui-card p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-9 w-40 rounded bg-white/10" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </section>
        ) : error ? (
          <section
            className="rounded-2xl border border-rose-500/40 bg-rose-500/[0.12] px-6 py-5 text-sm text-rose-100 shadow-lg shadow-rose-900/20"
            role="alert"
          >
            {error}
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <StatCard
                label="Total records"
                value={kpis.totalRecords.toLocaleString()}
                helper="All records in your workspace"
                accent="indigo"
              />
              <StatCard
                label="Total amount"
                value={moneyFmt.format(kpis.totalAmount)}
                helper="Sum of record amounts"
                accent="emerald"
              />
              <StatCard
                label="Recent activity"
                value={kpis.recentActivityCount.toLocaleString()}
                helper="Records created in the last 7 days"
                accent="amber"
              />
            </section>

            <ReportGenerator moneyFmt={moneyFmt} />

            <DataAssistant moneyFmt={moneyFmt} />

            <section className="ui-card ui-card-hover relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/10" />
              <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-cyan-400/90">
                  Predictions
                </p>
                <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-50 sm:text-xl">
                  Next month forecast
                </h2>
                <p className="ui-subtitle mt-1 max-w-2xl">
                  Linear trend on your monthly totals — projection and growth vs the latest month.
                </p>
              </div>

              <div className="relative p-5 sm:p-6">
                {predLoading ? (
                  <div className="space-y-4">
                    <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
                    <div className="h-48 animate-pulse rounded-xl bg-white/[0.04]" />
                  </div>
                ) : predError ? (
                  <div
                    className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                    role="alert"
                  >
                    {predError}
                  </div>
                ) : !predData || predData.method === "empty" || !predData.monthly?.length ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-5 py-8 text-center">
                    <p className="text-sm font-medium text-slate-300">Not enough monthly data yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add records across multiple months to unlock a forecast and trend chart.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-5 ring-1 ring-inset ring-white/[0.04]">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                          Projected total — {predData.predictedNextMonth?.month || "next month"}
                        </p>
                        <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-white">
                          {predData.predictedNextMonth?.totalAmount != null
                            ? moneyFmt.format(predData.predictedNextMonth.totalAmount)
                            : "—"}
                        </p>
                        {predData.growthPercent != null ? (
                          <div
                            className={[
                              "mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold tabular-nums",
                              predData.growthLabel === "increase"
                                ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
                                : predData.growthLabel === "decrease"
                                  ? "border border-rose-500/35 bg-rose-500/15 text-rose-200"
                                  : "border border-slate-500/30 bg-slate-500/10 text-slate-300",
                            ].join(" ")}
                          >
                            <span aria-hidden>
                              {predData.growthLabel === "increase"
                                ? "↑"
                                : predData.growthLabel === "decrease"
                                  ? "↓"
                                  : "→"}
                            </span>
                            {Number(predData.growthPercent) > 0 ? "+" : ""}
                            {Number(predData.growthPercent).toFixed(1)}% vs last month
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-500">Growth vs last month: n/a (baseline month)</p>
                        )}
                      </div>
                      {predData.insight ? (
                        <p className="text-xs leading-relaxed text-slate-400 [text-wrap:pretty]">{predData.insight}</p>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="h-56 min-h-[14rem] sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={forecastPoints}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                            aria-label="Monthly amount trend and forecast"
                          >
                            <defs>
                              <linearGradient id="predLine" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#a78bfa" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis
                              dataKey="month"
                              type="category"
                              tick={{ fill: "rgba(148,163,184,0.85)", fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{ fill: "rgba(148,163,184,0.85)", fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => moneyFmt.format(v)}
                            />
                            <Tooltip
                              formatter={(value, _n, p) => [
                                moneyFmt.format(Number(value)),
                                p?.payload?.kind === "forecast" ? "Forecast" : "Actual",
                              ]}
                              contentStyle={{
                                background: "rgba(2,6,23,0.95)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 12,
                                color: "rgba(241,245,249,0.95)",
                              }}
                              labelFormatter={(l) => `Month: ${l}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              name="Amount"
                              stroke="url(#predLine)"
                              strokeWidth={2.5}
                              dot={(dotProps) => {
                                const { cx, cy, payload } = dotProps;
                                if (cx == null || cy == null) return null;
                                const f = payload?.kind === "forecast";
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={f ? 5.5 : 3.5}
                                    fill={f ? "#a78bfa" : "#22d3ee"}
                                    stroke="rgba(15,23,42,0.5)"
                                    strokeWidth={1}
                                  />
                                );
                              }}
                              activeDot={{ r: 6, stroke: "#fff", strokeWidth: 1 }}
                              isAnimationActive
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-4 text-[0.7rem] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-cyan-400" /> History
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-violet-400" /> Forecast point
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section
              className="insight-glow border border-violet-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/80 p-6 sm:p-8"
              aria-labelledby="insight-heading"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p
                    id="insight-heading"
                    className="text-[0.7rem] font-semibold uppercase tracking-wider text-violet-300/90"
                  >
                    AI insights
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
                    Smarter read on your data
                  </h2>
                  <p className="ui-subtitle mt-1 max-w-xl">
                    Run an on-demand analysis. We send aggregated stats to the insight engine; your raw rows
                    stay on the server.
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
                <div
                  className="insight-reveal mt-6 rounded-xl border border-white/10 bg-slate-950/50 p-5 shadow-inner sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                      {insightData.source === "openai" ? "AI generated" : "Data-driven"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200 [text-wrap:pretty]">
                    {insightData.summary}
                  </p>
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

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Records over time"
                subtitle="Last 14 days (count per day)"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(2,6,23,0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "rgba(241,245,249,0.95)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="records"
                        stroke="#818cf8"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: "#a5b4fc" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Monthly totals"
                subtitle="Last 6 months (sum of amount)"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.95)" />
                          <stop offset="100%" stopColor="rgba(5, 150, 105, 0.55)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(v) => moneyFmt.format(Number(v))}
                        contentStyle={{
                          background: "rgba(2,6,23,0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "rgba(241,245,249,0.95)",
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="url(#barGradient)"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Category distribution"
                subtitle="Share of total amount by category"
              >
                <div className="grid gap-4 md:grid-cols-2 md:items-center">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          formatter={(v, n) => [moneyFmt.format(Number(v)), n]}
                          contentStyle={{
                            background: "rgba(2,6,23,0.95)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            color: "rgba(241,245,249,0.95)",
                          }}
                        />
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={105}
                          innerRadius={58}
                          stroke="rgba(255,255,255,0.12)"
                          paddingAngle={2}
                        >
                          {categoryData.map((_, i) => (
                            <Cell key={categoryData[i].name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {categoryData.map((c, i) => (
                      <div
                        key={c.name}
                        className="ui-card group flex items-center justify-between px-3.5 py-2.5 transition duration-200 hover:border-white/[0.12]"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            aria-hidden
                          />
                          <p className="truncate text-sm font-medium text-slate-200">{c.name}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-50">
                          {moneyFmt.format(c.value)}
                        </p>
                      </div>
                    ))}
                    {categoryData.length === 0 ? (
                      <p className="text-sm text-slate-400">No categories yet.</p>
                    ) : null}
                  </div>
                </div>
              </ChartCard>
            </section>
          </>
        )}
      </div>
    </ShellLayout>
  );
}

