import Record from "../models/Record.js";
import { interpretQueryWithOpenAI } from "../services/nlQueryService.js";
import { buildNlRecordQuery } from "../utils/buildNlRecordQuery.js";

const LIST_LIMIT = 100;

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * POST /api/query — natural language → OpenAI-structured filters → workspace records.
 * Body: { userQuery: string }
 */
export async function postNaturalLanguageQuery(req, res, next) {
  try {
    const userQuery = String(req.body?.userQuery ?? "").trim();
    if (!userQuery) {
      res.status(400);
      throw new Error("userQuery is required");
    }

    const workspaceId = getWorkspaceId(req, res);

    const interpreted = await interpretQueryWithOpenAI(userQuery);

    if (interpreted.ok === false) {
      if (interpreted.error === "OPENAI_NOT_CONFIGURED") {
        return res.status(200).json({
          success: true,
          message:
            "Natural language search is not available. Configure OPENAI_API_KEY on the server to enable it.",
          data: {
            mode: "unavailable",
            userQuery,
            responseType: null,
            filters: null,
            records: [],
            summary: null,
          },
        });
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("NL query parse failed:", interpreted.error);
      }
      return res.status(200).json({
        success: true,
        message:
          "We could not interpret that question safely. Try rephrasing, or use explicit filters in the app.",
        data: {
          mode: "fallback",
          userQuery,
          responseType: null,
          filters: null,
          records: [],
          summary: null,
        },
      });
    }

    const { responseType, filters } = interpreted.value;
    const match = buildNlRecordQuery(workspaceId, filters);

    if (responseType === "summary") {
      const [agg] = await Record.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      const byCategory = await Record.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 20 },
      ]);

      return res.status(200).json({
        success: true,
        message: "Query processed",
        data: {
          mode: "ok",
          userQuery,
          responseType: "summary",
          filters,
          records: null,
          summary: {
            count: agg?.count ?? 0,
            totalAmount: round2(agg?.totalAmount ?? 0),
            byCategory: byCategory.map((c) => ({
              category: c._id,
              count: c.count,
              totalAmount: round2(c.totalAmount),
            })),
          },
        },
      });
    }

    const records = await Record.find(match)
      .sort({ date: -1 })
      .limit(LIST_LIMIT)
      .lean()
      .exec();

    return res.status(200).json({
      success: true,
      message: "Query processed",
      data: {
        mode: "ok",
        userQuery,
        responseType: "records",
        filters,
        records,
        summary: null,
        meta: { limit: LIST_LIMIT, returned: records.length },
      },
    });
  } catch (error) {
    next(error);
  }
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
