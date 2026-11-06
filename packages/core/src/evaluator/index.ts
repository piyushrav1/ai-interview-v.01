import type { AIModel } from "../adapters.js";
import type { Interview } from "@testmeman/contracts";
import {
  executeDoubleRunEvaluation,
  type DoubleRunOptions,
  type DoubleRunResult,
} from "./double-run.js";

export * from "./sanitizer.js";
export * from "./security.js";
export * from "./double-run.js";

export type EvaluateOptions = DoubleRunOptions;
export type EvaluateResult = DoubleRunResult;

/**
 * Evaluate an interview by running the evaluator multiple times at low
 * temperature. If any rubric dimension differs by more than `maxDelta`
 * between runs, or if an academic integrity violation is detected,
 * the report is flagged `needsHumanReview: true`.
 */
export async function evaluateInterview(
  ai: AIModel,
  interview: Interview,
  options: EvaluateOptions = {}
): Promise<EvaluateResult> {
  return executeDoubleRunEvaluation(ai, interview, options);
}
