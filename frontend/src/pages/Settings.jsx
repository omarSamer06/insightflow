import ShellLayout from "../components/ShellLayout";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, token } = useAuth();

  return (
    <ShellLayout>
      <div className="grid gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Account and workspace preferences.</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/30 p-6 shadow-sm">
          <p className="text-xs text-slate-400">Account</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">User</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {user?.email || user?.name || user?.id || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Token</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {token ? "Stored" : "Not set"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Stored in localStorage.</p>
            </div>
          </div>
        </section>
      </div>
    </ShellLayout>
  );
}

