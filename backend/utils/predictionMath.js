import { getNextMonthKey } from "./monthlyAmountSeries.js";

/**
 * Simple least-squares line through (0,y0), (1,y1), ... (n-1, y_{n-1}).
 * @param {number[]} y - monthly totals in chronological order
 * @returns {{ slope: number, intercept: number, predict: (x: number) => number }}
 */
export function fitLinearTrend(y) {
  const n = y.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, predict: () => 0 };
  }
  if (n === 1) {
    const v = y[0];
    return { slope: 0, intercept: v, predict: () => v };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i;
    const yi = y[i];
    sumX += x;
    sumY += yi;
    sumXX += x * x;
    sumXY += x * yi;
  }

  const den = n * sumXX - sumX * sumX;
  const slope = den === 0 ? 0 : (n * sumXY - sumX * sumY) / den;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x) => slope * x + intercept,
  };
}

/**
 * R^2 goodness-of-fit for a simple linear model on y.
 * @param {number[]} y
 * @param {(x:number)=>number} predict
 */
export function computeR2(y, predict) {
  const n = y.length;
  if (!n) return null;
  const mean = y.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i += 1) {
    const yi = y[i];
    const diff = yi - mean;
    ssTot += diff * diff;
    const err = yi - predict(i);
    ssRes += err * err;
  }
  if (ssTot === 0) return null;
  const r2 = 1 - ssRes / ssTot;
  // Clamp for numerical stability
  return Math.max(-1, Math.min(1, Math.round(r2 * 1000) / 1000));
}

/**
 * @param {Array<{ month: string, totalAmount: number }>} monthly - sorted asc
 * @returns {{
 *   predictedMonth: string,
 *   predictedTotal: number,
 *   growthPercent: number | null,
 *   growthLabel: "increase" | "decrease" | "flat",
 *   method: "linear_regression" | "naive_last" | "empty",
 *   monthsUsed: number,
 *   confidence: "low" | "medium" | "high",
 *   r2: number | null,
 * }}
 */
export function forecastNextMonthFromSeries(monthly) {
  if (!monthly || monthly.length === 0) {
    return {
      predictedMonth: null,
      predictedTotal: null,
      growthPercent: null,
      growthLabel: "flat",
      method: "empty",
      monthsUsed: 0,
      confidence: "low",
      r2: null,
    };
  }

  const amounts = monthly.map((m) => Number(m.totalAmount) || 0);
  const lastMonth = monthly[monthly.length - 1].month;
  const predictedMonth = getNextMonthKey(lastMonth);
  const lastAmount = amounts[amounts.length - 1];

  if (monthly.length === 1) {
    const pred = round2(Math.max(0, lastAmount));
    return {
      predictedMonth,
      predictedTotal: pred,
      growthPercent: null,
      growthLabel: "flat",
      method: "naive_last",
      monthsUsed: 1,
      confidence: "low",
      r2: null,
    };
  }

  const { predict } = fitLinearTrend(amounts);
  const r2 = computeR2(amounts, predict);
  const xNext = amounts.length;
  let predictedTotal = round2(Math.max(0, predict(xNext)));

  let growthPercent = null;
  let growthLabel = "flat";
  if (lastAmount > 0) {
    growthPercent = round2(((predictedTotal - lastAmount) / lastAmount) * 100);
    if (Math.abs(growthPercent) < 0.5) {
      growthLabel = "flat";
    } else if (growthPercent > 0) {
      growthLabel = "increase";
    } else {
      growthLabel = "decrease";
    }
  } else if (predictedTotal > 0) {
    growthLabel = "increase";
  }

  return {
    predictedMonth,
    predictedTotal,
    growthPercent,
    growthLabel,
    method: "linear_regression",
    monthsUsed: monthly.length,
    confidence: estimateConfidence(monthly.length, r2),
    r2,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {number} monthsUsed
 * @param {number | null} r2
 * @returns {"low" | "medium" | "high"}
 */
function estimateConfidence(monthsUsed, r2) {
  if (monthsUsed <= 2) return "low";
  if (monthsUsed <= 4) {
    if (r2 != null && r2 >= 0.75) return "medium";
    return "low";
  }
  if (r2 == null) return "medium";
  if (r2 >= 0.85) return "high";
  if (r2 >= 0.6) return "medium";
  return "low";
}
