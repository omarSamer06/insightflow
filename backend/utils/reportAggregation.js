import mongoose from "mongoose";

import Record from "../models/Record.js";

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Server-side aggregations for workspace report (no raw record rows returned).
 * @param {import("mongoose").Types.ObjectId} workspaceId
 * @returns {Promise<{
 *   summary: object,
 *   trends: object,
 *   categories: object
 * }>}
 */
export async function aggregateWorkspaceReport(workspaceId) {
  const wid = new mongoose.Types.ObjectId(workspaceId);

  const [row] = await Record.aggregate([
    { $match: { workspace: wid } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
              totalRecords: { $sum: 1 },
            },
          },
        ],
        byMonth: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" },
              },
              totalAmount: { $sum: "$amount" },
              recordCount: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        byCategory: [
          {
            $group: {
              _id: "$category",
              totalAmount: { $sum: "$amount" },
              recordCount: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1, recordCount: -1 } },
        ],
        dateBounds: [
          {
            $group: {
              _id: null,
              firstDate: { $min: "$date" },
              lastDate: { $max: "$date" },
            },
          },
        ],
      },
    },
  ]).exec();

  const facet = row || { totals: [], byMonth: [], byCategory: [], dateBounds: [] };
  const t = facet.totals?.[0];
  const totalAmount = t ? round2(t.totalAmount) : 0;
  const totalRecords = t ? t.totalRecords : 0;
  const hasData = totalRecords > 0;

  const db = facet.dateBounds?.[0];
  const dateRange =
    hasData && db?.firstDate && db?.lastDate
      ? { from: db.firstDate.toISOString(), to: db.lastDate.toISOString() }
      : null;

  const monthlyTotals = (facet.byMonth || []).map((m) => ({
    month: m._id,
    totalAmount: round2(m.totalAmount),
    recordCount: m.recordCount,
  }));

  const monthOverMonth = computeMonthOverMonth(monthlyTotals);
  const recentMonths = monthlyTotals.slice(-12);

  const catRows = facet.byCategory || [];
  const top = catRows[0]
    ? {
        name: String(catRows[0]._id || "Uncategorized"),
        totalAmount: round2(catRows[0].totalAmount),
        recordCount: catRows[0].recordCount,
      }
    : null;

  const byAmount = catRows.map((c) => ({
    name: String(c._id || "Uncategorized"),
    totalAmount: round2(c.totalAmount),
    recordCount: c.recordCount,
  }));

  return {
    summary: {
      totalAmount,
      totalRecords,
      hasData,
      dateRange,
      topCategory: top,
    },
    trends: {
      monthlyTotals: recentMonths,
      monthOverMonth,
      latestMonth: monthlyTotals.length ? monthlyTotals[monthlyTotals.length - 1].month : null,
    },
    categories: {
      top,
      byAmount: byAmount.slice(0, 25),
      distinctCount: byAmount.length,
    },
  };
}

/**
 * @param {Array<{ month: string, totalAmount: number, recordCount: number }>} monthsSorted asc
 */
function computeMonthOverMonth(monthsSorted) {
  if (!monthsSorted || monthsSorted.length < 2) {
    return null;
  }
  const prev = monthsSorted[monthsSorted.length - 2];
  const curr = monthsSorted[monthsSorted.length - 1];
  const delta = round2(curr.totalAmount - prev.totalAmount);
  const base = prev.totalAmount;
  let percentChange = null;
  if (Number.isFinite(base) && base !== 0) {
    percentChange = round2((delta / base) * 100);
  } else if (Number.isFinite(base) && base === 0 && curr.totalAmount > 0) {
    percentChange = null; // from zero — avoid misleading infinity
  }
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return {
    fromMonth: prev.month,
    toMonth: curr.month,
    previousAmount: prev.totalAmount,
    currentAmount: curr.totalAmount,
    deltaAmount: delta,
    percentChange,
    direction,
  };
}
