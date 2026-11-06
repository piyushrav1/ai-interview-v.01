import { RubricDimensionEnum } from "@testmeman/contracts";
import type {
  RubricDimension,
  Report,
  HumanEvaluationBenchmark,
  DimensionCorrelationMetric,
  DiscrepancySession,
  PilotCohortReport,
} from "@testmeman/contracts";
import {
  calculatePearsonR,
  calculateMAE,
  calculateRMSE,
  calculateQuadraticWeightedKappa,
} from "./statistics.js";

export interface AiEvaluationRecord {
  interviewId: string;
  report: Report;
  candidateId?: string;
  problemId?: string;
}

export interface CompareCohortOptions {
  cohortId?: string;
  benchmarks: HumanEvaluationBenchmark[];
  aiEvaluations: AiEvaluationRecord[];
  /** Minimum acceptable Pearson r for pilot passing. Default: 0.85 */
  minPearsonR?: number;
  /** Maximum acceptable MAE for pilot passing. Default: 0.40 */
  maxMAE?: number;
  /** Minimum acceptable Cohen's Kappa for pilot passing. Default: 0.75 */
  minKappa?: number;
  /** Threshold for flagging individual discrepancies. Default: 1.0 */
  discrepancyThreshold?: number;
}

const ALL_DIMENSIONS: RubricDimension[] = [
  RubricDimensionEnum.problemSolving,
  RubricDimensionEnum.codeCorrectness,
  RubricDimensionEnum.testingEdgeCases,
  RubricDimensionEnum.complexityReasoning,
  RubricDimensionEnum.communication,
];

/**
 * Compares automated AI evaluations against independent human benchmark ratings
 * across all 5 rubric dimensions, calculating statistical correlation and discrepancy alerts.
 */
export function compareCohortEvaluations(options: CompareCohortOptions): PilotCohortReport {
  const {
    cohortId = `pilot-${new Date().toISOString().slice(0, 10)}`,
    benchmarks,
    aiEvaluations,
    minPearsonR = 0.85,
    maxMAE = 0.4,
    minKappa = 0.75,
    discrepancyThreshold = 1.0,
  } = options;

  // Build lookup map for AI evaluations by interviewId (and candidateId fallback)
  const aiByInterviewId = new Map<string, AiEvaluationRecord>();
  const aiByCandidateId = new Map<string, AiEvaluationRecord>();
  for (const ai of aiEvaluations) {
    aiByInterviewId.set(ai.interviewId, ai);
    if (ai.candidateId) {
      aiByCandidateId.set(ai.candidateId, ai);
    }
  }

  // Pair benchmarks with AI reports
  interface MatchedPair {
    benchmark: HumanEvaluationBenchmark;
    ai: AiEvaluationRecord;
    aiDimensionScores: Record<RubricDimension, number>;
  }

  const matchedPairs: MatchedPair[] = [];
  const flaggedDiscrepancies: DiscrepancySession[] = [];

  for (const bench of benchmarks) {
    const ai = aiByInterviewId.get(bench.interviewId) ?? (bench.candidateId ? aiByCandidateId.get(bench.candidateId) : undefined);
    if (!ai) continue;

    const aiDimensionScores: Partial<Record<RubricDimension, number>> = {};
    for (const scoreEvidence of ai.report.rubricScores) {
      aiDimensionScores[scoreEvidence.dimension] = scoreEvidence.score;
    }

    // Ensure all 5 dimensions exist in AI report
    let hasAllDimensions = true;
    for (const dim of ALL_DIMENSIONS) {
      if (typeof aiDimensionScores[dim] !== "number") {
        hasAllDimensions = false;
        break;
      }
    }

    if (hasAllDimensions) {
      matchedPairs.push({
        benchmark: bench,
        ai,
        aiDimensionScores: aiDimensionScores as Record<RubricDimension, number>,
      });
    }
  }

  // Compute metrics per dimension
  const dimensionMetrics: DimensionCorrelationMetric[] = [];
  const calibrationAdvice: string[] = [];
  let sumKappa = 0;
  let allDimensionsPassCriteria = matchedPairs.length >= 5;

  for (const dim of ALL_DIMENSIONS) {
    const humanScores: number[] = [];
    const aiScores: number[] = [];

    for (const pair of matchedPairs) {
      const hScore = pair.benchmark.scores[dim];
      const aScore = pair.aiDimensionScores[dim];

      if (typeof hScore === "number" && typeof aScore === "number") {
        humanScores.push(hScore);
        aiScores.push(aScore);

        const diff = Math.round((aScore - hScore) * 100) / 100;
        if (Math.abs(diff) > discrepancyThreshold) {
          flaggedDiscrepancies.push({
            interviewId: pair.benchmark.interviewId,
            candidateId: pair.benchmark.candidateId,
            problemId: pair.benchmark.problemId,
            dimension: dim,
            humanScore: hScore,
            aiScore: aScore,
            diff,
            reason: `Discrepancy of ${Math.abs(diff)} points on ${dim} exceeds threshold (${discrepancyThreshold}). Human: ${hScore}, AI: ${aScore}.`,
          });
        }
      }
    }

    const n = humanScores.length;
    if (n === 0) {
      dimensionMetrics.push({
        dimension: dim,
        sampleSize: 0,
        pearsonR: 0,
        mae: 0,
        rmse: 0,
        cohenKappa: 0,
        meanHumanScore: 0,
        meanAiScore: 0,
        bias: 0,
      });
      allDimensionsPassCriteria = false;
      continue;
    }

    const pearsonR = calculatePearsonR(humanScores, aiScores);
    const mae = calculateMAE(humanScores, aiScores);
    const rmse = calculateRMSE(humanScores, aiScores);
    const kappa = calculateQuadraticWeightedKappa(humanScores, aiScores, 1, 4);

    const meanHuman = Math.round((humanScores.reduce((a, b) => a + b, 0) / n) * 100) / 100;
    const meanAi = Math.round((aiScores.reduce((a, b) => a + b, 0) / n) * 100) / 100;
    const bias = Math.round((meanAi - meanHuman) * 100) / 100;

    sumKappa += kappa;

    dimensionMetrics.push({
      dimension: dim,
      sampleSize: n,
      pearsonR,
      mae,
      rmse,
      cohenKappa: kappa,
      meanHumanScore: meanHuman,
      meanAiScore: meanAi,
      bias,
    });

    // Check pass criteria
    const passesDimension = (pearsonR >= minPearsonR || mae <= maxMAE) && mae <= maxMAE && kappa >= minKappa;
    if (!passesDimension) {
      allDimensionsPassCriteria = false;
    }

    // Calibration Advice Generation
    if (bias > 0.3) {
      calibrationAdvice.push(
        `AI systematically overscores by +${bias.toFixed(2)} on ${dim}. Calibrate prompt to enforce stricter deductions.`
      );
    } else if (bias < -0.3) {
      calibrationAdvice.push(
        `AI systematically underscores by ${bias.toFixed(2)} on ${dim}. Calibrate prompt to grant partial credit more generously.`
      );
    }

    if (pearsonR < minPearsonR && mae > maxMAE) {
      calibrationAdvice.push(
        `Low correlation on ${dim} (r=${pearsonR.toFixed(2)} < ${minPearsonR}). Review evidence quote requirements in rubric.`
      );
    }
  }

  const overallAgreementIndex =
    dimensionMetrics.length > 0 ? Math.round((sumKappa / dimensionMetrics.length) * 10000) / 10000 : 0;

  if (matchedPairs.length < 5) {
    calibrationAdvice.unshift(
      `Insufficient cohort sample size (${matchedPairs.length}/5 minimum matched pairs). Ingest more benchmark sessions before pilot sign-off.`
    );
  }

  const meetsPilotCriteria = allDimensionsPassCriteria && matchedPairs.length >= 5 && overallAgreementIndex >= minKappa;

  return {
    cohortId,
    evaluatedAt: new Date().toISOString(),
    totalSessions: benchmarks.length,
    matchedSessions: matchedPairs.length,
    overallAgreementIndex,
    dimensionMetrics,
    flaggedDiscrepancies,
    calibrationAdvice,
    meetsPilotCriteria,
  };
}
