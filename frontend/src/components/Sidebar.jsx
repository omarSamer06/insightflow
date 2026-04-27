import { NavLink } from "react-router-dom";

const navSections = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/records", label: "Records" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/assistant", label: "Data assistant" },
      { to: "/report", label: "Reports" },
      { to: "/insights", label: "AI insights" },
      { to: "/forecast", label: "Forecast" },
    ],
  },
  {
    label: "Organization",
    items: [
      { to: "/team", label: "Team" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-gradient-to-b from-slate-950/65 via-slate-950/45 to-slate-950/35 backdrop-blur-xl md:flex">
      <div className="px-5 pt-5" />

      <nav className="flex-1 overflow-y-auto px-3 pb-8 pt-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-600">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/dashboard"}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/12 text-white shadow-md shadow-indigo-500/15 ring-1 ring-inset ring-white/10"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200",
                    ].join(" ")
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-slate-600 transition group-hover:bg-slate-300 group-[.active]:bg-indigo-300"
                    aria-hidden
                  />
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
