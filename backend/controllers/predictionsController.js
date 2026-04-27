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
    const { text: insight, narrative, source: insightSource } = await generatePredictionInsight({
      monthly: monthly.map((m) => ({ month: m.month, totalAmount: m.totalAmount })),
      forecast: {
        predictedMonth: forecast.predictedMonth,
        predictedTotal: forecast.predictedTotal,
        growthPercent: forecast.growthPercent,
        growthLabel: forecast.growthLabel,
        method: forecast.method,
      },
    });

    const predictionValue = forecast.predictedTotal == null ? null : Number(forecast.predictedTotal);
    const growthRate = forecast.growthPercent == null ? null : Number(forecast.growthPercent);
    const confidence = forecast.confidence || "low";
    const direction =
      forecast.method === "empty"
        ? "unavailable"
        : forecast.growthLabel === "increase"
          ? "upward"
          : forecast.growthLabel === "decrease"
            ? "downward"
            : "stable";
    const explanation =
      forecast.method === "empty"
        ? "No monthly history is available yet, so a forecast cannot be produced."
        : forecast.monthsUsed < 2
          ? `Projected next period is approximately ${predictionValue}. Confidence is low because there is only ${forecast.monthsUsed} month of history.`
          : `Projected performance for the next period is approximately ${predictionValue}, representing ${
              growthRate == null ? "an uncalculated change" : `${growthRate > 0 ? "+" : ""}${growthRate}%`
            } based on a ${direction} trend. Confidence is ${confidence} based on ${forecast.monthsUsed} month(s) of history.`;

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
        confidence: forecast.confidence,
        r2: forecast.r2,
        forecastSummary: {
          prediction: predictionValue,
          growthRate,
          confidence,
          explanation,
        },
        insight: insight || null,
        insightNarrative: narrative || null,
        insightSource: insightSource,
      },
    });
  } catch (error) {
    next(error);
  }
}
