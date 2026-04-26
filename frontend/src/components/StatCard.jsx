export default function StatCard({ label, value, helper, accent = "indigo" }) {
  const accentMap = {
    indigo: {
      ring: "ring-indigo-500/25",
      glow: "from-indigo-500/20 via-indigo-500/5 to-transparent",
      dot: "bg-indigo-400",
    },
    emerald: {
      ring: "ring-emerald-500/25",
      glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      dot: "bg-emerald-400",
    },
    amber: {
      ring: "ring-amber-500/25",
      glow: "from-amber-500/20 via-amber-500/5 to-transparent",
      dot: "bg-amber-400",
    },
    rose: {
      ring: "ring-rose-500/25",
      glow: "from-rose-500/20 via-rose-500/5 to-transparent",
      dot: "bg-rose-400",
    },
  };

  const a = accentMap[accent] || accentMap.indigo;

  return (
    <div
      className={`ui-card ui-card-hover group relative overflow-hidden p-6 ${a.ring} ring-1 ring-inset`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${a.glow} blur-2xl transition duration-500 group-hover:opacity-100`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums tracking-tight text-slate-50">
            {value}
          </p>
          {helper ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{helper}</p> : null}
        </div>
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.dot} ring-1 ring-white/20`} aria-hidden />
      </div>
    </div>
  );
}
