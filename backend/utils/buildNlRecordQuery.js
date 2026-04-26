function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a safe Mongoose match object from whitelisted filter fields.
 * @param {import('mongoose').Types.ObjectId | string} workspaceId
 * @param {object} filters
 */
export function buildNlRecordQuery(workspaceId, filters) {
  const f = filters && typeof filters === "object" ? filters : {};
  const q = { workspace: workspaceId };

  if (f.category && String(f.category).trim()) {
    q.category = new RegExp(escapeRegex(String(f.category).trim()), "i");
  }

  if (f.titleContains && String(f.titleContains).trim()) {
    q.title = new RegExp(escapeRegex(String(f.titleContains).trim()), "i");
  }

  const amount = {};
  if (f.minAmount != null && Number.isFinite(Number(f.minAmount))) {
    amount.$gte = Number(f.minAmount);
  }
  if (f.maxAmount != null && Number.isFinite(Number(f.maxAmount))) {
    amount.$lte = Number(f.maxAmount);
  }
  if (Object.keys(amount).length) {
    q.amount = amount;
  }

  const dateRange = {};
  if (f.dateFrom) {
    const d = new Date(String(f.dateFrom));
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      dateRange.$gte = d;
    }
  }
  if (f.dateTo) {
    const d = new Date(String(f.dateTo));
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(23, 59, 59, 999);
      dateRange.$lte = d;
    }
  }
  if (Object.keys(dateRange).length) {
    q.date = dateRange;
  }

  return q;
}
