import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl">
        <p className="text-xs text-slate-400">404</p>
        <h1 className="mt-1 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you’re looking for doesn’t exist.
        </p>
        <div className="mt-5">
          <Link
            to="/dashboard"
            className="inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

