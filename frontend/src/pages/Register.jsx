import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) return setError("Name is required");
    if (!trimmedEmail) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setIsSubmitting(true);
    const res = await register({ name: trimmedName, email: trimmedEmail, password });
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.message || "Registration failed");
      return;
    }

    navigate("/login", {
      replace: true,
      state: {
        registered: true,
        email: trimmedEmail,
        message: res.message || "Account created. Sign in with your email and password.",
      },
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between border-r border-white/[0.08] bg-gradient-to-br from-slate-900 via-violet-950/70 to-slate-950 p-10 lg:flex">
          <div>
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
              Start with your own workspace.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-violet-100/80">
              Registration creates a dedicated workspace and links your account — ready for records and
              insights.
            </p>
          </div>
          <p className="text-xs text-violet-200/50">Secure • Multi-tenant</p>
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-2xl font-bold tracking-tight text-slate-50">Create account</p>
              <p className="mt-1 text-sm text-slate-500">A workspace is created for you</p>
            </div>

            <div className="ui-card p-8 shadow-2xl shadow-black/40 sm:p-9">
              <div className="hidden lg:block">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                  Get started
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">Create your account</h1>
                <p className="mt-1 text-sm text-slate-500">Takes a minute. No credit card required.</p>
              </div>

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
                  <label htmlFor="reg-name" className="ui-label">
                    Name
                  </label>
                  <input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    autoComplete="name"
                    className="ui-input mt-2"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="ui-label">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    className="ui-input mt-2"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="ui-label">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className="ui-input mt-2"
                    placeholder="Min 6 characters"
                  />
                </div>

                <button disabled={isSubmitting} type="submit" className="ui-btn-primary w-full">
                  {isSubmitting ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-indigo-300 transition hover:text-indigo-200">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
