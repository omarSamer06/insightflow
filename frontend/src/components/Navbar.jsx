import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-sm" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-100">SaaS Analytics</p>
            <p className="text-xs text-slate-400">Workspace dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-slate-400">Signed in</p>
            <p className="text-sm font-medium text-slate-100">
              {user?.email || user?.name || user?.id || "User"}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 active:bg-white/15"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

