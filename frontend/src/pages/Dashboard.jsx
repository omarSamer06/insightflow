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
import ChartCard from "../components/ChartCard";
import FeatureShortcuts from "../components/FeatureShortcuts";
import ShellLayout from "../components/ShellLayout";
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

  const kpis = useMemo(() => computeKpis(records), [records]);
  const lineData = useMemo(() => buildLineSeries(records, 14), [records]);
  const monthlyData = useMemo(() => buildMonthlyTotals(records, 6), [records]);
  const categoryData = useMemo(() => buildCategoryDistribution(records, 6), [records]);

  const moneyFmt = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }),
    []
  );

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
              <Link to="/assistant" className="ui-btn-secondary">
                Data assistant
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

            <FeatureShortcuts />

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

