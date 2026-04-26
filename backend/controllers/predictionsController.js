import Record from "../models/Record.js";
import { generatePredictionInsight } from "../services/predictionInsightService.js";
import { buildMonthlyAmountSeries } from "../utils/monthlyAmountSeries.js";
import { forecastNextMonthFromSeries } from "../utils/predictionMath.js";

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * GET /api/predictions — workspace-scoped monthly series + next-month forecast.
 */
export async function getPredictions(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);

    const records = await Record.find({ workspace: workspaceId })
      .select("amount date")
      .lean()
      .exec();

    const monthly = buildMonthlyAmountSeries(records);
    const forecast = forecastNextMonthFromSeries(monthly);
    const { text: insight, source: insightSource } = await generatePredictionInsight({
      monthly: monthly.map((m) => ({ month: m.month, totalAmount: m.totalAmount })),
      forecast: {
        predictedMonth: forecast.predictedMonth,
        predictedTotal: forecast.predictedTotal,
        growthPercent: forecast.growthPercent,
        growthLabel: forecast.growthLabel,
        method: forecast.method,
      },
    });

    res.status(200).json({
      success: true,
      message: "Predictions ready",
      data: {
        monthly: monthly.map((m) => ({
          month: m.month,
          totalAmount: m.totalAmount,
          recordCount: m.recordCount,
        })),
        predictedNextMonth: {
          month: forecast.predictedMonth,
          totalAmount: forecast.predictedTotal,
        },
        growthPercent: forecast.growthPercent,
        growthLabel: forecast.growthLabel,
        method: forecast.method,
        monthsUsed: forecast.monthsUsed,
        insight: insight || null,
        insightSource: insightSource,
      },
    });
  } catch (error) {
    next(error);
  }
}
