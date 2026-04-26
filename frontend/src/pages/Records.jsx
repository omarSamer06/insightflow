import { useEffect, useMemo, useState } from "react";
import ShellLayout from "../components/ShellLayout";
import api from "../services/api";

export default function Records() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (search.trim()) p.set("search", search.trim());
    p.set("sortBy", sortBy);
    p.set("sortOrder", sortOrder);
    return p.toString();
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecords() {
      try {
        setIsLoading(true);
        setError("");
        const res = await api.get(`/records?${queryString}`);
        if (cancelled) return;
        const payload = res?.data?.data;
        setRecords(payload?.records || []);
        setTotal(payload?.total || 0);
      } catch (e) {
        if (cancelled) return;
        const message = e?.response?.data?.message || e?.message || "Failed to load records";
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRecords();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ShellLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Records</h1>
            <p className="mt-1 text-sm text-slate-400">
              Search, sort, and review workspace records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:w-[560px]">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              placeholder="Search title or category..."
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="desc">Order: Desc</option>
              <option value="asc">Order: Asc</option>
            </select>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-900/30 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <p className="text-sm text-slate-200">
              <span className="font-semibold">{total}</span> total
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>
                Page <span className="text-slate-200 font-medium">{page}</span> / {totalPages}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ) : error ? (
            <div className="p-5">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-5">
              <p className="text-sm text-slate-400">No records found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {records.map((r) => (
                <div key={r._id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {r.category} • {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100">
                    {Number(r.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 disabled:opacity-40 hover:bg-white/10"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 disabled:opacity-40 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </ShellLayout>
  );
}

