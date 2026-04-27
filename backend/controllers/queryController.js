import Record from "../models/Record.js";
import { requestNlQueryInterpretation } from "../services/nlQueryAiService.js";
import { executeNlInstruction } from "../services/nlQueryExecutor.js";
import { validateAndNormalizeInstruction } from "../services/nlQueryValidation.js";
import { buildRecordMetadata } from "../utils/recordMetadataSummary.js";

const MAX_RECORDS_FOR_CONTEXT = 5000;

/**
 * @param {object} instruction
 * @param {object} result
 */
function buildAnswerString(instruction, result) {
  if (!result) return "No result.";
  if (result.kind === "message") return result.text;
  if (result.kind === "summary") {
    if (result.metric === "max_month" && result.value) {
      return `The month with the highest total is ${result.value} (${result.amount} total).`;
    }
    if (result.metric === "top_category" && result.value) {
      return `Top category by amount is ${result.value} (${result.amount} total).`;
    }
    if (result.label && result.value != null) {
      return `${result.label}: ${result.value}.`;
    }
  }
  if (result.kind === "records") {
    const n = result.count;
    return `Found ${n} record${n === 1 ? "" : "s"} (limit ${result.limit}).`;
  }
  return "Done.";
}

function buildUnifiedResponse(instruction, result) {
  // Required shape: { type: "summary" | "list", explanation: string, data: [...] }
  // We also support "aggregation" and keep backward-compatible fields elsewhere.
  if (!result) {
    return {
      type: "summary",
      explanation: "No result was returned.",
      data: [],
    };
  }

  if (result.kind === "records") {
    const explanation = `Returned ${result.count} record${result.count === 1 ? "" : "s"} (limit ${result.limit}).`;
    return { type: "list", explanation, data: result.records || [] };
  }

  if (result.kind === "aggregation") {
    const explanation =
      result.groupBy === "month"
        ? "Aggregated totals by month (highest first)."
        : "Aggregated totals by category (highest first).";
    return { type: "aggregation", explanation, data: result.rows || [] };
  }

  if (result.kind === "summary") {
    // Premium explanations for supported summaries.
    if (result.metric === "max_month" && result.value) {
      const driver = result.detail?.driverCategory?.name;
      const driverText = driver ? ` primarily driven by ${driver} activity` : "";
      return {
        type: "summary",
        explanation: `The highest-performing month was ${result.value}, with a total value of ${result.amount}${driverText}.`,
        data: [result],
      };
    }
    if (result.metric === "top_category" && result.value) {
      return {
        type: "summary",
        explanation: `Top category was ${result.value}, contributing ${result.amount} in total value.`,
        data: [result],
      };
    }
    if (result.metric === "period_performance" && result.detail?.month) {
      const d = result.detail;
      const pct =
        d.percentChange == null ? "an uncalculated change (no prior baseline)" : `${d.percentChange > 0 ? "+" : ""}${d.percentChange}%`;
      const trend = d.deltaAmount > 0 ? "growth" : d.deltaAmount < 0 ? "decline" : "stable";
      const cat = d.topCategory?.name ? `, primarily driven by ${d.topCategory.name}` : "";
      return {
        type: "summary",
        explanation: `Last month (${d.month}) performance was ${result.value} vs ${d.previousMonth} at ${d.previousTotalAmount} (${pct}); trend is ${trend}${cat}.`,
        data: [result],
      };
    }
    const base = result.label && result.value != null ? `${result.label}: ${result.value}.` : "Summary computed.";
    return { type: "summary", explanation: base, data: [result] };
  }

  // message / unsupported
  const suggestions = [
    "Try: “highest month”",
    "Try: “last month performance”",
    "Try: “top category”",
    "Try: “list records from last month”",
    "Try: “monthly totals”",
  ];
  const explanation = `${result.text || "I couldn’t map that request safely."} ${suggestions.join(" ")}`.trim();
  return { type: "summary", explanation, data: [] };
}

function getWorkspaceId(req, res) {
  const workspaceId = req.user?.workspace;
  if (!workspaceId) {
    res.status(403);
    throw new Error("User is not assigned to a workspace");
  }
  return workspaceId;
}

/**
 * POST /api/query — natural language → validated JSON instruction → safe DB ops.
 * Body: { userQuery: string }
 */
export async function postNaturalLanguageQuery(req, res, next) {
  try {
    const workspaceId = getWorkspaceId(req, res);
    const userQuery = String(req.body?.userQuery ?? "").trim();

    if (!userQuery) {
      res.status(400);
      throw new Error("userQuery is required");
    }
    if (userQuery.length > 4000) {
      res.status(400);
      throw new Error("userQuery is too long");
    }

    const records = await Record.find({ workspace: workspaceId })
      .select("title amount category date")
      .limit(MAX_RECORDS_FOR_CONTEXT)
      .lean();

    const metadata = buildRecordMetadata(records);
    const ai = await requestNlQueryInterpretation(userQuery, metadata);

    if (!ai.ok) {
      return res.status(200).json({
        success: true,
        message: ai.fallbackMessage,
        data: {
          answer: ai.fallbackMessage,
          interpretation: null,
          result: null,
          aiErrorDetail: ai.detail,
          metadata: {
            recordCountInContext: records.length,
            capped: records.length >= MAX_RECORDS_FOR_CONTEXT,
          },
        },
      });
    }

    const instruction = validateAndNormalizeInstruction(ai.parsed);
    if (!instruction) {
      return res.status(200).json({
        success: true,
        message: "The model returned a format that could not be applied safely.",
        data: {
          answer:
            "I could not understand that in a safe, structured way. Try asking for a total, average, or filtered list using categories or recent dates.",
          interpretation: null,
          rawModelOutput: process.env.NODE_ENV === "development" ? ai.parsed : undefined,
          result: null,
          unified: {
            type: "summary",
            explanation:
              "I couldn’t map that request to a safe operation. Try: “highest month”, “last month performance”, “top category”, or “list records from last month”.",
            data: [],
          },
          metadata: {
            recordCountInContext: records.length,
            capped: records.length >= MAX_RECORDS_FOR_CONTEXT,
          },
        },
      });
    }

    const result = await executeNlInstruction(workspaceId, instruction);
    const answer = buildAnswerString(instruction, result);
    const unified = buildUnifiedResponse(instruction, result);

    return res.status(200).json({
      success: true,
      message: "Query processed",
      data: {
        answer,
        interpretation: instruction,
        interpretationSource: ai.source || "heuristic",
        result,
        unified,
        metadata: {
          recordCountInContext: records.length,
          capped: records.length >= MAX_RECORDS_FOR_CONTEXT,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
