import type { AIModel } from "../adapters.js";
import type {
  Interview,
  Report,
  RubricDimension,
  Confidence,
} from "@testmeman/contracts";
import { buildEvaluatorPrompt, type EvaluatorOutput } from "../prompts/v1/evaluator.js";
import { auditInterviewIntegrity } from "./security.js";

export interface DoubleRunOptions {
  runs?: number | undefined; // Number of runs (default 2)
  maxDelta?: number | undefined; // Max allowed score difference per dimension (default 1)
  candidateName?: string | undefined;
  testResults?: { passed: boolean; hidden: boolean }[] | undefined;
  temperatures?: [number, number] | undefined; // Temperatures for run 1 and run 2 (default [0.1, 0.2])
}

export interface DoubleRunResult {
  report: Report;
  needsHumanReview: boolean;
  runs: number;
  deltas: Record<RubricDimension, number>;
  discrepancies: string[];
  integrityViolations: string[];
}

const RUBRIC_DIMENSIONS: RubricDimension[] = [
  "problemSolving",
  "codeCorrectness",
  "testingEdgeCases",
  "complexityReasoning",
  "communication",
];

/**
 * Execute double-run evaluation with discrepancy detection and adversarial integrity protection.
 *
 * Per README:
 * - Run the evaluator twice at low temperature.
 * - If the two runs differ by more than 1 on any dimension, mark the report needs human review.
 * - Treat candidate text as data: prompt injection attempts count as a gap and integrity violation.
 */
export async function executeDoubleRunEvaluation(
  ai: AIModel,
  interview: Interview,
  options: DoubleRunOptions = {}
): Promise<DoubleRunResult> {
  const runs = options.runs ?? 2;
  const maxDelta = options.maxDelta ?? 1;
  const temperatures = options.temperatures ?? [0.1, 0.2];

  // 1. Audit interview for adversarial prompt injections
  const integrity = auditInterviewIntegrity({
    transcript: interview.transcript.map((t) => ({ role: t.role, text: t.text })),
    codeSnapshots: interview.codeSnapshots.map((c) => ({ source: c.source })),
  });

  // 2. Build prompt with PII sanitization, untrusted tags, and test results
  const evalPrompt = buildEvaluatorPrompt({
    transcript: interview.transcript.map((t) => ({ role: t.role, text: t.text })),
    codeHistory: interview.codeSnapshots,
    testResults: options.testResults ?? [],
    language: interview.language,
    startTime: interview.startTime,
    candidateName: options.candidateName,
  });

  // 3. Execute runs independently at low temperature in parallel
  const runPromises = Array.from({ length: runs }, (_, i) => {
    const temp = temperatures[i] ?? (i === 0 ? 0.1 : 0.2);
    return ai.structured({
      system: evalPrompt.system,
      prompt: evalPrompt.prompt,
      schema: evalPrompt.schema,
      temperature: temp,
    });
  });
  const evaluatorOutputs = (await Promise.all(runPromises)) as EvaluatorOutput[];

  // 4. Calculate score deltas across all rubric dimensions
  const deltas: Record<RubricDimension, number> = {} as Record<RubricDimension, number>;
  const discrepancies: string[] = [];

  const rubricScores = RUBRIC_DIMENSIONS.map((dim) => {
    const scores = evaluatorOutputs.map((o) =>
      o.rubricScores.find((r) => r.dimension === dim)
    );
    const validEntries = scores.filter(
      (s): s is { dimension: RubricDimension; score: number; evidence: string; confidence: Confidence } =>
        s != null
    );

    if (validEntries.length === 0) {
      deltas[dim] = 0;
      return {
        dimension: dim,
        score: 1,
        evidence: "No evaluation data available.",
        confidence: "low" as Confidence,
      };
    }

    const validScores = validEntries.map((s) => s.score);
    const minScore = Math.min(...validScores);
    const maxScore = Math.max(...validScores);
    const delta = maxScore - minScore;
    deltas[dim] = delta;

    if (delta > maxDelta) {
      discrepancies.push(
        `Discrepancy on ${dim}: score varied from ${minScore} to ${maxScore} (delta ${delta} > ${maxDelta})`
      );
    }

    // Average the score across valid runs
    let avgScore = Math.max(1, Math.min(4, Math.round(
      validScores.reduce((a, b) => a + b, 0) / validScores.length
    )));

    // Choose confidence based on inter-run delta
    let confidence: Confidence = validEntries[0]?.confidence ?? "high";
    if (delta > 1) {
      confidence = "low";
    } else if (delta === 1) {
      confidence = "medium";
    }

    // Evidence quote: pick the first run's evidence or longest evidence string
    const bestEvidence = validEntries.reduce((best, curr) =>
      curr.evidence.length > best.length ? curr.evidence : best,
      validEntries[0]?.evidence ?? ""
    );

    // If an integrity violation occurred and this is the communication dimension, cap score to 1
    if (integrity.hasIntegrityViolation && dim === "communication") {
      avgScore = 1;
      confidence = "high";
      return {
        dimension: dim,
        score: 1,
        evidence: `Academic integrity violation: ${integrity.violations[0]}`,
        confidence: "high" as Confidence,
      };
    }

    return {
      dimension: dim,
      score: avgScore,
      evidence: bestEvidence || "No evidence quote provided.",
      confidence,
    };
  });

  // 5. Merge strengths and gaps across runs (deduplicated)
  const strengths = Array.from(
    new Set(evaluatorOutputs.flatMap((o) => o.strengths ?? []))
  );
  const gaps = Array.from(
    new Set(evaluatorOutputs.flatMap((o) => o.gaps ?? []))
  );

  // If integrity violation detected, add explicit gap notice
  if (integrity.hasIntegrityViolation) {
    for (const v of integrity.violations) {
      gaps.unshift(`Academic Integrity Breach: ${v}`);
    }
  }

  // 6. Determine human review requirement
  const discrepancyReview = discrepancies.length > 0;
  const anyOutputNeedsReview = evaluatorOutputs.some((o) => o.needsHumanReview);
  const integrityReview = integrity.hasIntegrityViolation;

  const needsHumanReview = discrepancyReview || anyOutputNeedsReview || integrityReview;

  const humanReviewReasons: string[] = [];
  if (integrityReview) {
    humanReviewReasons.push("Potential prompt injection / integrity breach detected");
  }
  if (discrepancyReview) {
    humanReviewReasons.push(discrepancies.join("; "));
  }
  if (anyOutputNeedsReview && !discrepancyReview && !integrityReview) {
    const customReason = evaluatorOutputs.find((o) => o.humanReviewReason)?.humanReviewReason;
    if (customReason) humanReviewReasons.push(customReason);
  }

  const humanReviewReason = humanReviewReasons.length > 0 ? humanReviewReasons.join(" | ") : undefined;

  // 7. Overall score calculation
  const overallScore = Math.max(1, Math.min(4, Math.round(
    rubricScores.reduce((sum, r) => sum + r.score, 0) / rubricScores.length
  )));

  const report: Report = {
    overallScore,
    rubricScores,
    strengths,
    gaps,
    codeReplay: interview.codeSnapshots.map((s) => ({
      turnId: s.turnId,
      source: s.source,
      timeMs: s.timeMs,
    })),
    needsHumanReview,
    ...(humanReviewReason ? { humanReviewReason } : {}),
  };

  return {
    report,
    needsHumanReview,
    runs,
    deltas,
    discrepancies,
    integrityViolations: integrity.violations,
  };
}

