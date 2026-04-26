import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a]">
        <div className="ui-card flex items-center gap-4 px-8 py-6 shadow-xl">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-slate-100">Loading workspace</p>
            <p className="text-xs text-slate-500">Verifying your session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
