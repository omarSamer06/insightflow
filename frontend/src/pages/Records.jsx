import { useCallback, useEffect, useMemo, useState } from "react";
import RecordFormModal from "../components/RecordFormModal";
import ShellLayout from "../components/ShellLayout";
import { deleteRecord } from "../services/recordService";
import api from "../services/api";

const moneyFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

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

  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (search.trim()) p.set("search", search.trim());
    p.set("sortBy", sortBy);
    p.set("sortOrder", sortOrder);
    return p.toString();
  }, [page, limit, search, sortBy, sortOrder]);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
  }, [queryString, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openCreate = () => {
    setActionError("");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setActionError("");
    setEditing(record);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async (record) => {
    const ok = window.confirm(`Delete “${record.title}”? This cannot be undone.`);
    if (!ok) return;
    setActionError("");
    setDeletingId(record._id);
    try {
      await deleteRecord(record._id);
      bumpRefresh();
    } catch (e) {
      setActionError(e?.response?.data?.message || e?.message || "Could not delete record");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ShellLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              Data
            </p>
            <h1 className="ui-page-title">Records</h1>
            <p className="ui-subtitle mt-2 max-w-xl">
              Add, edit, and review records in your workspace. All data is tenant-scoped on the server.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-xs sm:flex-initial lg:shrink-0">
            <button type="button" onClick={openCreate} className="ui-btn-primary w-full sm:min-w-[10rem]">
              Add record
            </button>
          </div>
        </div>

        {actionError ? (
          <div
            className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="ui-input"
            placeholder="Search title or category…"
          />
          <select
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value);
            }}
            className="ui-input"
          >
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => {
              setPage(1);
              setSortOrder(e.target.value);
            }}
            className="ui-input"
          >
            <option value="desc">Newest / highest first</option>
            <option value="asc">Oldest / lowest first</option>
          </select>
        </div>

        <section className="ui-card flex flex-col overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              <span className="font-bold tabular-nums text-slate-50">{total}</span>{" "}
              <span className="text-slate-500">total</span>
            </p>
            <div className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
              <span className="font-semibold text-slate-200">{totalPages}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/10" />
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div
                className="rounded-xl border border-rose-500/35 bg-rose-500/[0.12] px-4 py-3 text-sm text-rose-100"
                role="alert"
              >
                {error}
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-300">No records yet</p>
              <p className="mt-1 text-xs text-slate-500">Create your first record to populate charts and reports.</p>
              <button type="button" onClick={openCreate} className="ui-btn-primary mt-5">
                Add record
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {records.map((r) => (
                <div
                  key={r._id}
                  className="group flex flex-col gap-3 px-5 py-4 transition duration-200 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="text-slate-400">{r.category}</span>
                      <span className="mx-2 text-slate-600">·</span>
                      {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="rounded-xl border border-white/[0.1] bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3.5 py-2 text-sm font-bold tabular-nums text-slate-50 shadow-sm ring-1 ring-inset ring-white/10">
                      {moneyFmt.format(Number(r.amount) || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="ui-btn-ghost py-1.5 text-xs"
                        disabled={deletingId === r._id}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="rounded-xl border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5 text-xs font-medium text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-50"
                        disabled={deletingId === r._id}
                      >
                        {deletingId === r._id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/[0.06] bg-slate-950/30 px-5 py-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="ui-btn-ghost min-w-[5rem]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="ui-btn-ghost min-w-[5rem]"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      <RecordFormModal
        open={formOpen}
        onClose={closeForm}
        onSuccess={bumpRefresh}
        editing={editing}
      />
    </ShellLayout>
  );
}
