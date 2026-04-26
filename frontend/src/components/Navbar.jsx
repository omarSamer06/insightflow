import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const mobileNav = [
  { to: "/dashboard", label: "Home" },
  { to: "/assistant", label: "Assistant" },
  { to: "/report", label: "Reports" },
  { to: "/insights", label: "Insights" },
  { to: "/forecast", label: "Forecast" },
  { to: "/records", label: "Records" },
  { to: "/team", label: "Team" },
  { to: "/settings", label: "Settings" },
];

function initialsFromUser(user) {
  const s = (user?.name || user?.email || "").trim();
  if (!s) return "U";
  const parts = s.split(/[@\s]+/).filter(Boolean);
  if (parts[0] && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const display = user?.name || user?.email || "User";
  const initials = initialsFromUser(user);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-slate-950/75 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold tracking-tight text-slate-50">SaaS Analytics</p>
          <p className="truncate text-xs text-slate-500">Workspace</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-slate-100 ring-1 ring-white/10">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                Signed in
              </p>
              <p className="max-w-[12rem] truncate text-sm font-medium text-slate-100" title={display}>
                {display}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="ui-btn-ghost px-3 py-2 text-slate-200 hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-white/[0.06] bg-slate-950/50 px-3 py-2 md:hidden"
        aria-label="Page"
      >
        {mobileNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
