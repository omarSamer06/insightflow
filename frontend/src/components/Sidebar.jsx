import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/records", label: "Records" },
  { to: "/team", label: "Team" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-slate-950/40 backdrop-blur-md md:flex">
      <div className="p-5 pb-2">
        <div className="ui-card ui-card-hover rounded-2xl p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-500">
            Product
          </p>
          <p className="mt-1.5 text-base font-bold tracking-tight text-slate-50">Analytics Suite</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Multi-tenant workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-8 pt-2">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-600">
          Menu
        </p>
        <div className="space-y-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white shadow-sm shadow-indigo-500/10 ring-1 ring-inset ring-white/10"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                ].join(" ")
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-slate-600 transition group-hover:bg-slate-400"
                aria-hidden
              />
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
