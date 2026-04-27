import { useEffect, useId, useState } from "react";
import { createRecord, updateRecord } from "../services/recordService";

function localDateString() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {() => void} props.onSuccess
 * @param {object | null} [props.editing] — record to edit (must include _id) or null for create
 */
export default function RecordFormModal({ open, onClose, onSuccess, editing = null }) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setTitle(editing.title || "");
      setAmount(editing.amount != null ? String(editing.amount) : "");
      setCategory(editing.category || "");
      setDateStr(editing.date ? new Date(editing.date).toISOString().slice(0, 10) : localDateString());
    } else {
      setTitle("");
      setAmount("");
      setCategory("");
      setDateStr(localDateString());
    }
  }, [open, editing]);

  if (!open) return null;

  const isEdit = Boolean(editing?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const t = title.trim();
    const c = category.trim();
    const a = parseFloat(String(amount).replace(/,/g, ""));

    if (!t) {
      setError("Title is required");
      return;
    }
    if (!c) {
      setError("Category is required");
      return;
    }
    if (!Number.isFinite(a)) {
      setError("Amount must be a valid number");
      return;
    }

    const body = { title: t, amount: a, category: c };
    if (dateStr) {
      body.date = dateStr;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateRecord(editing._id, body);
      } else {
        await createRecord(body);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || (isEdit ? "Could not update record" : "Could not create record");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-slate-900 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <h2 id={`${formId}-title`} className="text-lg font-bold text-white">
            {isEdit ? "Edit record" : "Add record"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Saved to your workspace. Amounts are numbers (e.g. 120.5).</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 sm:px-6 sm:py-5">
          {error ? (
            <div
              className="mb-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="ui-label" htmlFor={`${formId}-title`}>
                Title
              </label>
              <input
                id={`${formId}-title`}
                className="ui-input mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
                placeholder="e.g. Q1 software subscription"
                required
              />
            </div>
            <div>
              <label className="ui-label" htmlFor={`${formId}-amount`}>
                Amount
              </label>
              <input
                id={`${formId}-amount`}
                className="ui-input mt-1.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="ui-label" htmlFor={`${formId}-category`}>
                Category
              </label>
              <input
                id={`${formId}-category`}
                className="ui-input mt-1.5"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                autoComplete="off"
                placeholder="e.g. Sales, Operations"
                required
              />
            </div>
            <div>
              <label className="ui-label" htmlFor={`${formId}-date`}>
                Date
              </label>
              <input
                id={`${formId}-date`}
                type="date"
                className="ui-input mt-1.5"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} className="ui-btn-secondary w-full sm:w-auto" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="ui-btn-primary w-full sm:min-w-[8rem] sm:w-auto" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Add record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
