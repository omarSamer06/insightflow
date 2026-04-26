import { Link } from "react-router-dom";
import ShellLayout from "../components/ShellLayout";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <ShellLayout>
      <div className="grid gap-6">
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm">
          <p className="text-xs text-slate-400">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">
            Welcome{user?.name ? `, ${user.name}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            This is your analytics workspace shell. Next, we’ll add charts and deeper insights —
            for now, you can manage records securely through the API-connected pages.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/records"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15"
            >
              Manage records
            </Link>
            <Link
              to="/settings"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Settings
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total records", value: "—" },
            { label: "This month", value: "—" },
            { label: "Top category", value: "—" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-slate-900/30 p-5 shadow-sm"
            >
              <p className="text-xs text-slate-400">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{c.value}</p>
              <p className="mt-2 text-xs text-slate-500">Charts coming next.</p>
            </div>
          ))}
        </section>
      </div>
    </ShellLayout>
  );
}

