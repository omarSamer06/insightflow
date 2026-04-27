/**
 * Shared narrative schema helpers for AI + fallback copy.
 *
 * Narrative shape (all strings):
 * - metric: the key number/percentage
 * - explanation: why it moved / what drove it
 * - implication: what it means operationally
 * - recommendation: next action
 */

/**
 * @param {any} n
 * @returns {{ metric: string, explanation: string, implication: string, recommendation: string }}
 */
export function coerceNarrative(n) {
  const metric = String(n?.metric || "").trim();
  const explanation = String(n?.explanation || "").trim();
  const implication = String(n?.implication || "").trim();
  const recommendation = String(n?.recommendation || "").trim();

  return {
    metric: metric || "Metric unavailable.",
    explanation: explanation || "Explanation unavailable.",
    implication: implication || "Implication unavailable.",
    recommendation: recommendation || "Recommendation unavailable.",
  };
}

/**
 * @param {{ metric: string, explanation: string, implication: string, recommendation: string }} narrative
 */
export function narrativeToText(narrative) {
  const n = coerceNarrative(narrative);
  return [n.metric, n.explanation, n.implication, `Recommendation: ${n.recommendation}`].join("\n\n");
}

