import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/dashboard";

  const [email, setEmail] = useState(() => location.state?.email || "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return setError("Email is required");
    if (!password) return setError("Password is required");

    setIsSubmitting(true);
    const res = await login({ email: trimmedEmail, password });
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message || "Login failed");
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between border-r border-white/[0.08] bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 p-10 lg:flex">
          <div>
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
              Analytics that feel effortless.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100/80">
              Sign in to your workspace. Your data stays scoped to your tenant — secure by design.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-100/70">
              Manage your business data with clarity and control. This SaaS analytics dashboard lets you track
              records, monitor performance, and gain insights through interactive charts—all within your own secure
              workspace.
            </p>
          </div>
          <p className="text-xs text-indigo-200/50">© {new Date().getFullYear()} Workspace</p>
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-2xl font-bold tracking-tight text-slate-50">Welcome back</p>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Sign in to your workspace. Your data stays scoped to your tenant — secure by design.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Manage your business data with clarity and control. This SaaS analytics dashboard lets you track
                records, monitor performance, and gain insights through interactive charts—all within your own secure
                workspace.
              </p>
            </div>

            <div className="ui-card p-8 shadow-2xl shadow-black/40 sm:p-9">
              <div className="hidden lg:block">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                  Sign in
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-500">Enter your credentials to access the dashboard.</p>
              </div>

              {location.state?.registered ? (
                <div
                  className="mt-6 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.1] px-4 py-3 text-sm text-emerald-100 [text-wrap:pretty]"
                  role="status"
                >
                  {location.state?.message ||
                    "Account created. Sign in with your email and password."}
                </div>
              ) : null}

              {error ? (
                <div
                  className="mt-6 rounded-xl border border-rose-500/35 bg-rose-500/[0.12] px-4 py-3 text-sm text-rose-100"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="login-email" className="ui-label">
                    Email
                  </label>
                  <input
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    className="ui-input mt-2"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="ui-label">
                    Password
                  </label>
                  <input
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    className="ui-input mt-2"
                    placeholder="••••••••"
                  />
                </div>

                <button disabled={isSubmitting} type="submit" className="ui-btn-primary w-full">
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                New here?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-300 transition hover:text-indigo-200"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
