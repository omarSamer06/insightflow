import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="ui-card w-full max-w-md p-8 text-center shadow-2xl shadow-black/50 sm:p-10">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">Page not found</h1>
        <p className="ui-subtitle mt-2">
          The page you’re looking for doesn’t exist, or you don’t have access to it.
        </p>
        <div className="mt-8">
          <Link to="/dashboard" className="ui-btn-primary w-full sm:w-auto">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
