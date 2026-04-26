import { Link } from "react-router-dom";

const items = [
  {
    to: "/assistant",
    label: "Data assistant",
    desc: "Ask questions in natural language",
    border: "border-indigo-500/25",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    to: "/report",
    label: "Reports",
    desc: "Business report & AI narrative",
    border: "border-amber-500/25",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25V11.2a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v3.05m-8.25 0V9.2a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v5.05M6 3.75A.75.75 0 016.75 3h10.5a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H6A.75.75 0 015.25 5.25V4.5A.75.75 0 016 3.75zM3 12a.75.75 0 01.75-.75h.5a.75.75 0 01.75.75V21a.75.75 0 01-.75.75H3A.75.75 0 012 21v-8.25A.75.75 0 012.25 12zM9 3.75A.75.75 0 009.75 3h.5A.75.75 0 0111 3.75V21a.75.75 0 01-.75.75h-1.5A.75.75 0 019 21V3.75zM15 3.75A.75.75 0 0015.75 3h.5a.75.75 0 00.75.75V21a.75.75 0 00-.75.75h-1.5A.75.75 0 0015 21V3.75zM21 12a.75.75 0 01.75.75V21A.75.75 0 0121 22h-1.5a.75.75 0 01-.75-.75v-8.25A.75.75 0 0021.75 12H21z"
      />
    ),
  },
  {
    to: "/insights",
    label: "AI insights",
    desc: "On-demand analysis of your data",
    border: "border-violet-500/25",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    ),
  },
  {
    to: "/forecast",
    label: "Forecast",
    desc: "Next month projection",
    border: "border-cyan-500/25",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.414-5.414l2.25 2.25-6.6 6.6a3 3 0 11-4.2-4.2l-2.1 2.1-3.3-3.3z"
      />
    ),
  },
];

export default function FeatureShortcuts() {
  return (
    <section className="ui-card ui-card-hover p-5 sm:p-6" aria-label="Feature shortcuts">
      <p className="ui-label">{"Intelligence & reporting"}</p>
      <h2 className="mt-1 text-base font-bold text-slate-50">Open a dedicated workspace</h2>
      <p className="mt-0.5 text-sm text-slate-500">Jump to each tool from the sidebar or below.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className={[
                "group flex gap-3 rounded-xl border bg-slate-950/30 p-4 transition",
                "hover:border-white/15 hover:bg-slate-900/50",
                it.border,
              ].join(" ")}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200"
                aria-hidden
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {it.icon}
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-100 group-hover:text-white">{it.label}</p>
                <p className="text-xs text-slate-500">{it.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
