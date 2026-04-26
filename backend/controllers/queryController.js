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
          metadata: {
            recordCountInContext: records.length,
            capped: records.length >= MAX_RECORDS_FOR_CONTEXT,
          },
        },
      });
    }

    const result = await executeNlInstruction(workspaceId, instruction);
    const answer = buildAnswerString(instruction, result);

    return res.status(200).json({
      success: true,
      message: "Query processed",
      data: {
        answer,
        interpretation: instruction,
        result,
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
