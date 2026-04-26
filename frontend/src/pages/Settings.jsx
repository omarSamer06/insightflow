import ShellLayout from "../components/ShellLayout";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, token } = useAuth();

  return (
    <ShellLayout>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Account</p>
          <h1 className="ui-page-title">Settings</h1>
          <p className="ui-subtitle mt-2 max-w-xl">
            Session and identity details. Token storage uses localStorage; rotate credentials from the backend when
            needed.
          </p>
        </div>

        <section className="ui-card ui-card-hover p-6 sm:p-8">
          <h2 className="text-sm font-bold tracking-tight text-slate-100">Session</h2>
          <p className="mt-1 text-xs text-slate-500">Information tied to the signed-in user.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-slate-950/40 p-5 transition duration-200 hover:border-white/[0.12]">
              <p className="ui-label">User</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-100">
                {user?.email || user?.name || user?.id || "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-slate-950/40 p-5 transition duration-200 hover:border-white/[0.12]">
              <p className="ui-label">Token</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {token ? "Active" : "Not set"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Stored in localStorage for this browser.</p>
            </div>
          </div>
        </section>
      </div>
    </ShellLayout>
  );
}
