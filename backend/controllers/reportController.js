import { generateReportNarrative } from "../services/reportAiService.js";
import { aggregateWorkspaceReport } from "../utils/reportAggregation.js";

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * GET /api/report — workspace-scoped aggregated metrics + optional AI narrative.
 */
export async function getReport(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);
    const report = await aggregateWorkspaceReport(workspaceId);
    const ai = await generateReportNarrative(report);

    return res.status(200).json({
      success: true,
      message: "Report ready",
      data: {
        summary: {
          ...report.summary,
          narrative: {
            performanceOverview: ai.performanceOverview,
            growthOrDecline: ai.growthOrDecline,
            recommendation: ai.recommendation,
            source: ai.source,
          },
        },
        trends: report.trends,
        categories: report.categories,
      },
    });
  } catch (error) {
    next(error);
  }
}
