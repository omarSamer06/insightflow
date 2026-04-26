import mongoose from "mongoose";
import Record from "../models/Record.js";
import { canMutateWorkspaceData, getWorkspaceForUserOrFail } from "../utils/workspaceMembers.js";

function parseNumber(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

function buildRecordsQuery({ workspaceId, search, startDate, endDate }) {
  const query = { workspace: workspaceId };

  const safeSearch = String(search || "").trim();
  if (safeSearch) {
    const regex = new RegExp(safeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: regex }, { category: regex }];
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = startDate;
  if (endDate) dateFilter.$lte = endDate;
  if (Object.keys(dateFilter).length) query.date = dateFilter;

  return query;
}

async function assertCanMutateRecords(req, res, workspaceId) {
  const workspace = await getWorkspaceForUserOrFail(req.user, workspaceId, res);
  if (!canMutateWorkspaceData(req.user, workspace)) {
    res.status(403);
    throw new Error(
      "You do not have permission to create or change records. Workspace members can view data only — ask an admin."
    );
  }
}

function parseDateRange(req, res) {
  const fromRaw = req.query.from || req.query.startDate;
  const toRaw = req.query.to || req.query.endDate;

  let startDate;
  let endDate;

  if (fromRaw) {
    const d = new Date(String(fromRaw));
    if (Number.isNaN(d.getTime())) {
      res.status(400);
      throw new Error("Invalid from/startDate value");
    }
    startDate = d;
  }

  if (toRaw) {
    const d = new Date(String(toRaw));
    if (Number.isNaN(d.getTime())) {
      res.status(400);
      throw new Error("Invalid to/endDate value");
    }
    endDate = d;
  }

  return { startDate, endDate };
}

function parseSort(req) {
  const sortByRaw = String(req.query.sortBy || "date").toLowerCase();
  const sortOrderRaw = String(req.query.sortOrder || "desc").toLowerCase();

  const sortBy = sortByRaw === "amount" ? "amount" : "date";
  const sortOrder = sortOrderRaw === "asc" ? 1 : -1;

  return { [sortBy]: sortOrder };
}

export async function createRecord(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);
    await assertCanMutateRecords(req, res, workspaceId);
    const { title, amount, category, date } = req.body || {};

    const trimmedTitle = String(title || "").trim();
    const trimmedCategory = String(category || "").trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      res.status(400);
      throw new Error("Title is required");
    }
    if (!trimmedCategory) {
      res.status(400);
      throw new Error("Category is required");
    }
    if (!Number.isFinite(numericAmount)) {
      res.status(400);
      throw new Error("Amount must be a number");
    }

    let recordDate = new Date();
    if (date) {
      const d = new Date(String(date));
      if (Number.isNaN(d.getTime())) {
        res.status(400);
        throw new Error("Invalid date");
      }
      recordDate = d;
    }

    const record = await Record.create({
      workspace: workspaceId,
      title: trimmedTitle,
      amount: numericAmount,
      category: trimmedCategory,
      date: recordDate,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Record created",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecords(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);

    const page = Math.max(1, Math.floor(parseNumber(req.query.page, 1)));
    const limit = Math.min(100, Math.max(1, Math.floor(parseNumber(req.query.limit, 20))));
    const skip = (page - 1) * limit;

    const { startDate, endDate } = parseDateRange(req, res);
    const search = req.query.search || req.query.q;
    const sort = parseSort(req);

    const query = buildRecordsQuery({
      workspaceId,
      search,
      startDate,
      endDate,
    });

    const [records, total] = await Promise.all([
      Record.find(query).sort(sort).skip(skip).limit(limit),
      Record.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      message: "Records fetched",
      data: {
        records,
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRecord(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);
    await assertCanMutateRecords(req, res, workspaceId);
    const recordId = String(req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400);
      throw new Error("Invalid record id");
    }

    const updates = {};
    const { title, amount, category, date } = req.body || {};

    if (title !== undefined) {
      const trimmedTitle = String(title || "").trim();
      if (!trimmedTitle) {
        res.status(400);
        throw new Error("Title cannot be empty");
      }
      updates.title = trimmedTitle;
    }

    if (category !== undefined) {
      const trimmedCategory = String(category || "").trim();
      if (!trimmedCategory) {
        res.status(400);
        throw new Error("Category cannot be empty");
      }
      updates.category = trimmedCategory;
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount)) {
        res.status(400);
        throw new Error("Amount must be a number");
      }
      updates.amount = numericAmount;
    }

    if (date !== undefined) {
      const d = new Date(String(date));
      if (Number.isNaN(d.getTime())) {
        res.status(400);
        throw new Error("Invalid date");
      }
      updates.date = d;
    }

    const record = await Record.findOneAndUpdate(
      { _id: recordId, workspace: workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.status(200).json({
      success: true,
      message: "Record updated",
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRecord(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);
    await assertCanMutateRecords(req, res, workspaceId);
    const recordId = String(req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400);
      throw new Error("Invalid record id");
    }

    const record = await Record.findOneAndDelete({ _id: recordId, workspace: workspaceId });
    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.status(200).json({
      success: true,
      message: "Record deleted",
      data: { id: recordId },
    });
  } catch (error) {
    next(error);
  }
}

