import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const moneyFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

/**
 * Self-contained next-month forecast + trend (GET /api/predictions).
 */
export default function PredictionsPanel() {
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState("");
  const [predData, setPredData] = useState(null);

  useEffect(() => {
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
  }, []);

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

  return (
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
                      <linearGradient id="predLinePanel" x1="0" y1="0" x2="1" y2="0">
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
                      stroke="url(#predLinePanel)"
                      strokeWidth={2.5}
                      dot={(dotProps) => {
                        const { cx, cy, payload: pt } = dotProps;
                        if (cx == null || cy == null) return null;
                        const f = pt?.kind === "forecast";
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
  );
}
