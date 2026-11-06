/**
 * Token & Cost Accounting per Interview.
 * 
 * Per README Rule 6:
 * "Log tokens and cost per interview from day one."
 */

export interface InterviewUsage {
  interviewId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  callsCount: number;
}

// In-memory ledger mapping interviewId -> usage stats
const usageLedger = new Map<string, { inputTokens: number; outputTokens: number; callsCount: number }>();

// Gemini Flash standard pricing ($ / 1,000,000 tokens)
const INPUT_COST_PER_MILLION = 0.075;
const OUTPUT_COST_PER_MILLION = 0.30;

/**
 * Record token consumption for an interview call.
 */
export function recordTokenUsage(params: {
  interviewId: string;
  inputTokens: number;
  outputTokens: number;
}): void {
  const current = usageLedger.get(params.interviewId) ?? {
    inputTokens: 0,
    outputTokens: 0,
    callsCount: 0,
  };

  current.inputTokens += Math.max(0, params.inputTokens);
  current.outputTokens += Math.max(0, params.outputTokens);
  current.callsCount += 1;

  usageLedger.set(params.interviewId, current);

  const cost = calculateCost(current.inputTokens, current.outputTokens);
  console.log(
    `[TOKEN & COST] Interview ${params.interviewId} | Call #${current.callsCount} | +${params.inputTokens} in, +${params.outputTokens} out | Total: ${current.inputTokens + current.outputTokens} tokens ($${cost.toFixed(6)})`
  );
}

/**
 * Calculate total estimated cost in USD.
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Get aggregated token and cost metrics for an interview.
 */
export function getInterviewUsage(interviewId: string): InterviewUsage {
  const current = usageLedger.get(interviewId) ?? {
    inputTokens: 0,
    outputTokens: 0,
    callsCount: 0,
  };

  const totalTokens = current.inputTokens + current.outputTokens;
  const estimatedCostUsd = calculateCost(current.inputTokens, current.outputTokens);

  return {
    interviewId,
    inputTokens: current.inputTokens,
    outputTokens: current.outputTokens,
    totalTokens,
    estimatedCostUsd,
    callsCount: current.callsCount,
  };
}

/**
 * Heuristic token estimator when model API does not return usageMetadata.
 * Approximately 4 English characters per token.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

