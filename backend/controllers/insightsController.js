import Record from "../models/Record.js";
import { generateInsightSummary } from "../services/aiInsightService.js";
import { buildInsightStatsFromRecords } from "../utils/insightAggregation.js";

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * GET /api/insights — workspace-scoped analytics + AI or mock summary.
 */
export async function getInsights(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);

    const records = await Record.find({ workspace: workspaceId })
      .select("amount category date")
      .lean()
      .exec();

    const stats = buildInsightStatsFromRecords(records);
    const { summary, narrative, executiveSummary, source } = await generateInsightSummary(stats);

    res.status(200).json({
      success: true,
      message: "Insights ready",
      data: {
        executiveSummary,
        summary,
        narrative,
        keyStats: {
          totalAmount: stats.totalAmount,
          recordCount: stats.recordCount,
          topCategory: stats.topCategory,
          monthlyTrends: stats.monthlyTrends,
          periodComparison: stats.periodComparison,
          driverCategory: stats.driverCategory,
        },
        source,
      },
    });
  } catch (error) {
    next(error);
  }
}
