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

export default function Navbar() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-gradient-to-b from-slate-950/85 to-slate-950/55 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="min-w-0 leading-tight">
          <p className="truncate text-lg font-extrabold tracking-tight text-slate-50 sm:text-xl">
            Insightflow
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
