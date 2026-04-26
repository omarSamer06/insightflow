function toDayKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toMonthKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function computeKpis(records) {
  const totalRecords = records.length;
  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const now = Date.now();
  const last7DaysMs = 7 * 24 * 60 * 60 * 1000;
  const recentActivityCount = records.filter((r) => {
    const t = new Date(r.date).getTime();
    return Number.isFinite(t) && now - t <= last7DaysMs;
  }).length;

  return { totalRecords, totalAmount, recentActivityCount };
}

export function buildLineSeries(records, days = 14) {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const counts = new Map();
  records.forEach((r) => {
    const k = toDayKey(r.date);
    if (!k) return;
    counts.set(k, (counts.get(k) || 0) + 1);
  });

  const data = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = toDayKey(d);
    data.push({
      day: key,
      records: counts.get(key) || 0,
    });
  }
  return data;
}

export function buildMonthlyTotals(records, months = 6) {
  const totals = new Map();
  records.forEach((r) => {
    const k = toMonthKey(r.date);
    if (!k) return;
    totals.set(k, (totals.get(k) || 0) + (Number(r.amount) || 0));
  });

  const end = new Date();
  const data = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const key = toMonthKey(d);
    data.push({
      month: key,
      total: Number((totals.get(key) || 0).toFixed(2)),
    });
  }
  return data;
}

export function buildCategoryDistribution(records, top = 6) {
  const totals = new Map();
  records.forEach((r) => {
    const cat = String(r.category || "Uncategorized").trim() || "Uncategorized";
    totals.set(cat, (totals.get(cat) || 0) + (Number(r.amount) || 0));
  });

  const sorted = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const topItems = sorted.slice(0, top);
  const rest = sorted.slice(top);
  const restValue = rest.reduce((sum, x) => sum + x.value, 0);

  if (restValue > 0) topItems.push({ name: "Other", value: Number(restValue.toFixed(2)) });
  return topItems;
}

