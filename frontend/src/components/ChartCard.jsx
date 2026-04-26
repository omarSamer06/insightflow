export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <section className="ui-card ui-card-hover flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent px-5 py-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Chart</p>
          <p className="mt-1 text-base font-bold tracking-tight text-slate-50">{title}</p>
          {subtitle ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
