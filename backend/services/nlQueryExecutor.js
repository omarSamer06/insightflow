import mongoose from "mongoose";

import Record from "../models/Record.js";
import { escapeRegex, getDateRangeBounds } from "../utils/nlQueryDateRange.js";

/**
 * Runs only vetted instruction types. Always scopes by workspace.
 * @param {import("mongoose").Types.ObjectId} workspaceId
 * @param {object} instruction - output of validateAndNormalizeInstruction
 * @returns {Promise<object>}
 */
export async function executeNlInstruction(workspaceId, instruction) {
  if (!workspaceId) {
    return { kind: "message", text: "Missing workspace context." };
  }
  if (!instruction || !instruction.type) {
    return { kind: "message", text: "Invalid instruction." };
  }

  const wid = new mongoose.Types.ObjectId(workspaceId);

  switch (instruction.type) {
    case "unsupported":
      return { kind: "message", text: instruction.reason || "This request is not supported." };
    case "summary":
      return runSummary(wid, instruction.metric, instruction.dateRange);
    case "filter":
      return runFilter(wid, instruction);
    case "aggregation":
      return runAggregation(wid, instruction);
    default:
      return { kind: "message", text: "Unknown operation." };
  }
}

async function runSummary(workspaceId, metric, dateRange) {
  const match = { workspace: workspaceId };
  if (dateRange && dateRange !== "all") {
    const { start, end } = getDateRangeBounds(dateRange);
    match.date = { $gte: start, $lte: end };
  }

  switch (metric) {
    case "record_count": {
      const n = await Record.countDocuments(match);
      return { kind: "summary", metric, value: n, label: "Record count", scope: dateRange || "all" };
    }
    case "total_amount": {
      const agg = await Record.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const total = agg[0]?.total ?? 0;
      return { kind: "summary", metric, value: round2(total), label: "Total amount", scope: dateRange || "all" };
    }
    case "average_amount": {
      const agg = await Record.aggregate([
        { $match: match },
        { $group: { _id: null, avg: { $avg: "$amount" } } },
      ]);
      const avg = agg[0]?.avg ?? 0;
      return { kind: "summary", metric, value: round2(avg), label: "Average amount per record", scope: dateRange || "all" };
    }
    case "max_month": {
      const agg = await Record.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);
      if (!agg[0]) {
        return { kind: "summary", metric, value: null, label: "Month with highest total", detail: "No data" };
      }
      const key = String(agg[0]._id);
      const driver = await Record.aggregate([
        {
          $match: {
            workspace: workspaceId,
            date: {
              $gte: new Date(`${key}-01T00:00:00.000Z`),
              $lte: new Date(new Date(`${key}-01T00:00:00.000Z`).getTime() + 32 * 24 * 60 * 60 * 1000),
            },
          },
        },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);
      return {
        kind: "summary",
        metric,
        value: key,
        amount: round2(agg[0].total),
        label: "Month with highest total spend",
        detail: {
          month: key,
          totalAmount: round2(agg[0].total),
          driverCategory: driver?.[0]?._id ? { name: driver[0]._id, totalAmount: round2(driver[0].total) } : null,
        },
      };
    }
    case "top_category": {
      const agg = await Record.aggregate([
        { $match: match },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);
      if (!agg[0]) {
        return { kind: "summary", metric, value: null, label: "Top category", detail: "No data" };
      }
      return {
        kind: "summary",
        metric,
        value: agg[0]._id,
        amount: round2(agg[0].total),
        label: "Top category by total amount",
        detail: { category: agg[0]._id, totalAmount: round2(agg[0].total) },
      };
    }
    case "period_performance": {
      // Compare last_month vs the month before it. (dateRange is ignored; this metric defines its own period.)
      const now = new Date();
      const { start: startLast, end: endLast } = getDateRangeBounds("last_month", now);
      const startPrev = new Date(Date.UTC(startLast.getUTCFullYear(), startLast.getUTCMonth() - 1, 1, 0, 0, 0, 0));
      const endPrev = new Date(Date.UTC(startLast.getUTCFullYear(), startLast.getUTCMonth(), 0, 23, 59, 59, 999));

      const [lastAgg] = await Record.aggregate([
        { $match: { workspace: workspaceId, date: { $gte: startLast, $lte: endLast } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);
      const [prevAgg] = await Record.aggregate([
        { $match: { workspace: workspaceId, date: { $gte: startPrev, $lte: endPrev } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);
      const lastTotal = round2(lastAgg?.total ?? 0);
      const prevTotal = round2(prevAgg?.total ?? 0);
      const delta = round2(lastTotal - prevTotal);
      const percentChange = prevTotal === 0 ? null : round2((delta / prevTotal) * 100);

      const driver = await Record.aggregate([
        { $match: { workspace: workspaceId, date: { $gte: startLast, $lte: endLast } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);

      const monthKey = `${startLast.getUTCFullYear()}-${String(startLast.getUTCMonth() + 1).padStart(2, "0")}`;
      const prevKey = `${startPrev.getUTCFullYear()}-${String(startPrev.getUTCMonth() + 1).padStart(2, "0")}`;

      return {
        kind: "summary",
        metric,
        value: lastTotal,
        label: "Last month performance",
        detail: {
          month: monthKey,
          previousMonth: prevKey,
          totalAmount: lastTotal,
          previousTotalAmount: prevTotal,
          deltaAmount: delta,
          percentChange,
          topCategory: driver?.[0]?._id ? { name: driver[0]._id, totalAmount: round2(driver[0].total) } : null,
        },
      };
    }
    default:
      return { kind: "message", text: "Unsupported summary metric." };
  }
}

async function runFilter(workspaceId, instruction) {
  const match = { workspace: workspaceId };
  if (instruction.category) {
    match.category = new RegExp(`^${escapeRegex(instruction.category)}$`, "i");
  }
  if (instruction.dateRange && instruction.dateRange !== "all") {
    const { start, end } = getDateRangeBounds(instruction.dateRange);
    match.date = { $gte: start, $lte: end };
  }

  const limit = instruction.limit || 50;
  const records = await Record.find(match).sort({ date: -1 }).limit(limit).lean();
  return {
    kind: "records",
    count: records.length,
    limit,
    records,
  };
}

async function runAggregation(workspaceId, instruction) {
  const match = { workspace: workspaceId };
  if (instruction.category) {
    match.category = new RegExp(`^${escapeRegex(instruction.category)}$`, "i");
  }
  if (instruction.dateRange && instruction.dateRange !== "all") {
    const { start, end } = getDateRangeBounds(instruction.dateRange);
    match.date = { $gte: start, $lte: end };
  }

  const groupId =
    instruction.groupBy === "month"
      ? { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } }
      : "$category";

  const groupStage = (() => {
    if (instruction.metric === "record_count") {
      return { $group: { _id: groupId, value: { $sum: 1 } } };
    }
    if (instruction.metric === "average_amount") {
      return { $group: { _id: groupId, value: { $avg: "$amount" } } };
    }
    return { $group: { _id: groupId, value: { $sum: "$amount" } } };
  })();

  const rows = await Record.aggregate([
    { $match: match },
    groupStage,
    { $sort: { value: -1 } },
    { $limit: instruction.limit || 12 },
  ]);

  return {
    kind: "aggregation",
    groupBy: instruction.groupBy,
    metric: instruction.metric,
    rows: rows.map((r) => ({ key: r._id, value: round2(r.value) })),
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
