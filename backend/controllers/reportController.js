import Record from "../models/Record.js";
import { generateReportExplanation } from "../services/reportAiService.js";
import { buildReportFromRecords } from "../utils/reportAggregation.js";

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * GET /api/report — workspace aggregate report (summary, trends, categories, AI narrative).
 */
export async function getReport(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);

    const records = await Record.find({ workspace: workspaceId })
      .select("amount category date")
      .lean()
      .exec();

    const { summary, categoryBreakdown } = buildReportFromRecords(records);
    const { explanation, source } = await generateReportExplanation({
      summary,
      categoryBreakdown,
    });

    res.status(200).json({
      success: true,
      message: "Report ready",
      data: {
        summary,
        categoryBreakdown,
        ai: {
          explanation,
          source,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
