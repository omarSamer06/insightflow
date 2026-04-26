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
      return runSummary(wid, instruction.metric);
    case "filter":
      return runFilter(wid, instruction);
    default:
      return { kind: "message", text: "Unknown operation." };
  }
}

async function runSummary(workspaceId, metric) {
  const match = { workspace: workspaceId };

  switch (metric) {
    case "record_count": {
      const n = await Record.countDocuments(match);
      return { kind: "summary", metric, value: n, label: "Record count" };
    }
    case "total_amount": {
      const agg = await Record.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const total = agg[0]?.total ?? 0;
      return { kind: "summary", metric, value: round2(total), label: "Total amount" };
    }
    case "average_amount": {
      const agg = await Record.aggregate([
        { $match: match },
        { $group: { _id: null, avg: { $avg: "$amount" } } },
      ]);
      const avg = agg[0]?.avg ?? 0;
      return { kind: "summary", metric, value: round2(avg), label: "Average amount per record" };
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
      return {
        kind: "summary",
        metric,
        value: key,
        amount: round2(agg[0].total),
        label: "Month with highest total spend",
        detail: { month: key, totalAmount: round2(agg[0].total) },
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

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
