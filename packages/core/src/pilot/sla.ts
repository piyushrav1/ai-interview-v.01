import type {
  SlaLatencyPercentiles,
  SlaComplianceReport,
  Interview,
  Phase,
} from "@testmeman/contracts";
import type { AIModel } from "../adapters.js";
import { evaluateInterview, type EvaluateOptions, type EvaluateResult } from "../evaluator/index.js";

export interface MeasureTtftOptions {
  ai: AIModel;
  system: string;
  messages: { role: "interviewer" | "candidate"; text: string }[];
  phase: Phase;
  signal?: AbortSignal;
}

export interface MeasureTtftResult {
  ttftMs: number;
  totalDurationMs: number;
  chunkCount: number;
  firstChunk: string;
  fullResponse: string;
}

/**
 * Accurately measures the Time-To-First-Token (TTFT) and full streaming duration
 * using high-resolution performance timers.
 */
export async function measureStreamingTTFT(options: MeasureTtftOptions): Promise<MeasureTtftResult> {
  const startTime = performance.now();
  let firstTokenTime: number | null = null;
  let firstChunk = "";
  let fullResponse = "";
  let chunkCount = 0;

  const stream = options.ai.chat({
    system: options.system,
    messages: options.messages,
    phase: options.phase,
    ...(options.signal ? { signal: options.signal } : {}),
  });

  for await (const chunk of stream) {
    if (firstTokenTime === null) {
      firstTokenTime = performance.now();
      firstChunk = chunk;
    }
    fullResponse += chunk;
    chunkCount++;
  }

  const endTime = performance.now();
  const ttftMs = firstTokenTime !== null ? Math.round((firstTokenTime - startTime) * 100) / 100 : 0;
  const totalDurationMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    ttftMs,
    totalDurationMs,
    chunkCount,
    firstChunk,
    fullResponse,
  };
}

/**
 * Measures end-to-end multi-agent evaluation execution duration.
 */
export async function measureEvaluationTurnaround(
  ai: AIModel,
  interview: Interview,
  options?: EvaluateOptions
): Promise<{ durationMs: number; result: EvaluateResult }> {
  const startTime = performance.now();
  const result = await evaluateInterview(ai, interview, options);
  const endTime = performance.now();
  const durationMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    durationMs,
    result,
  };
}

/**
 * Computes statistical percentiles (p50, p90, p95, p99, min, max, mean) for an array of latency numbers.
 */
export function calculateLatencyPercentiles(latencies: number[]): SlaLatencyPercentiles {
  if (latencies.length === 0) {
    return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p: number): number => {
    const idx = Math.ceil((p / 100) * n) - 1;
    const clampedIdx = Math.max(0, Math.min(n - 1, idx));
    return sorted[clampedIdx] ?? 0;
  };

  const min = sorted[0] ?? 0;
  const max = sorted[n - 1] ?? 0;
  const mean = Math.round((sorted.reduce((a, b) => a + b, 0) / n) * 100) / 100;

  return {
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    min,
    max,
    mean,
  };
}

/**
 * Generates an SLA compliance report assessing whether the system meets
 * TTFT (<1.5s) and evaluation turnaround (<60s) requirements.
 */
export function generateSlaComplianceReport(params: {
  ttftLatenciesMs: number[];
  evalDurationMs: number;
  ttftTargetMs?: number;
  evalTargetMs?: number;
}): SlaComplianceReport {
  const {
    ttftLatenciesMs,
    evalDurationMs,
    ttftTargetMs = 1500,
    evalTargetMs = 60000,
  } = params;

  const percentiles = calculateLatencyPercentiles(ttftLatenciesMs);
  const meetsTtftSla = percentiles.p95 <= ttftTargetMs && percentiles.max <= ttftTargetMs;
  const meetsEvalSla = evalDurationMs <= evalTargetMs;
  const overallSlaCompliant = meetsTtftSla && meetsEvalSla;

  const summary = overallSlaCompliant
    ? `SLA Compliant: TTFT p95=${percentiles.p95}ms (target <${ttftTargetMs}ms), Evaluation=${evalDurationMs}ms (target <${evalTargetMs}ms)`
    : `SLA Non-Compliant: ${!meetsTtftSla ? `TTFT p95=${percentiles.p95}ms exceeds ${ttftTargetMs}ms; ` : ""}${!meetsEvalSla ? `Evaluation=${evalDurationMs}ms exceeds ${evalTargetMs}ms;` : ""}`.trim();

  return {
    testedAt: new Date().toISOString(),
    ttftTargetMs,
    evalTargetMs,
    ttftPercentiles: percentiles,
    evalDurationMs,
    meetsTtftSla,
    meetsEvalSla,
    overallSlaCompliant,
    summary,
  };
}
