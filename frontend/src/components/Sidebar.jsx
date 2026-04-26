import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/records", label: "Records" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:gap-4 border-r border-white/10 bg-slate-950">
      <div className="px-6 pt-6">
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 border border-white/10 shadow-sm">
          <p className="text-xs text-slate-300">Your product</p>
          <p className="mt-1 text-base font-semibold text-slate-100">Analytics Suite</p>
          <p className="mt-1 text-xs text-slate-400">Multi-tenant dashboard</p>
        </div>
      </div>

      <nav className="px-3 pb-6">
        <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Navigation
        </p>
        <div className="mt-2 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                [
                  "block rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-white/10 text-slate-100 border border-white/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-slate-100",
                ].join(" ")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}

