import { describe, it, expect } from "vitest";
import {
  calculatePearsonR,
  calculateMAE,
  calculateRMSE,
  calculateQuadraticWeightedKappa,
  compareCohortEvaluations,
} from "../../src/pilot/index.js";
import {
  RubricDimensionEnum,
  type Report,
  type HumanEvaluationBenchmark,
} from "@testmeman/contracts";

describe("Pilot Statistical Computation Engine", () => {
  describe("calculatePearsonR", () => {
    it("returns 1.0 for perfectly positively correlated series", () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(calculatePearsonR(x, y)).toBe(1.0);
    });

    it("returns -1.0 for perfectly negatively correlated series", () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      expect(calculatePearsonR(x, y)).toBe(-1.0);
    });

    it("handles textbook series with known correlation", () => {
      // Known data: x=[1, 2, 3, 4], y=[2, 3, 5, 7]
      // meanX=2.5, meanY=4.25
      // diffX=[-1.5, -0.5, 0.5, 1.5], diffY=[-2.25, -1.25, 0.75, 2.75]
      // cov = 3.375 + 0.625 + 0.375 + 4.125 = 8.5
      // ssX = 2.25 + 0.25 + 0.25 + 2.25 = 5.0
      // ssY = 5.0625 + 1.5625 + 0.5625 + 7.5625 = 14.75
      // denom = sqrt(5 * 14.75) = sqrt(73.75) ≈ 8.58778
      // r = 8.5 / 8.58778 ≈ 0.9898
      const r = calculatePearsonR([1, 2, 3, 4], [2, 3, 5, 7]);
      expect(r).toBeCloseTo(0.9898, 3);
    });

    it("handles zero variance: identical constant series returns 1.0", () => {
      expect(calculatePearsonR([3, 3, 3, 3], [3, 3, 3, 3])).toBe(1.0);
    });

    it("handles zero variance: constant series vs varying series returns 0.0", () => {
      expect(calculatePearsonR([3, 3, 3, 3], [1, 2, 3, 4])).toBe(0.0);
      expect(calculatePearsonR([1, 2, 3, 4], [2, 2, 2, 2])).toBe(0.0);
    });

    it("handles minimal arrays (n=1 and n=0)", () => {
      expect(calculatePearsonR([3], [3])).toBe(1.0);
      expect(calculatePearsonR([3], [4])).toBe(0.0);
      expect(calculatePearsonR([], [])).toBe(0.0);
    });

    it("throws when array lengths mismatch", () => {
      expect(() => calculatePearsonR([1, 2], [1, 2, 3])).toThrow("Array lengths must match");
    });
  });

  describe("calculateMAE", () => {
    it("returns 0.0 for identical series", () => {
      expect(calculateMAE([1, 2, 3, 4], [1, 2, 3, 4])).toBe(0.0);
    });

    it("calculates exact mean absolute difference", () => {
      // |1-1| + |2-3| + |3-5| = 0 + 1 + 2 = 3 / 3 = 1.0
      expect(calculateMAE([1, 2, 3], [1, 3, 5])).toBe(1.0);
    });

    it("handles empty arrays", () => {
      expect(calculateMAE([], [])).toBe(0.0);
    });

    it("throws on mismatched lengths", () => {
      expect(() => calculateMAE([1], [1, 2])).toThrow("Array lengths must match");
    });
  });

  describe("calculateRMSE", () => {
    it("returns 0.0 for identical series", () => {
      expect(calculateRMSE([1, 2, 3], [1, 2, 3])).toBe(0.0);
    });

    it("calculates exact root mean squared error", () => {
      // (1-1)^2 + (2-3)^2 + (3-5)^2 = 0 + 1 + 4 = 5 / 3 ≈ 1.6667
      // sqrt(1.6667) ≈ 1.2910
      expect(calculateRMSE([1, 2, 3], [1, 3, 5])).toBeCloseTo(1.291, 3);
    });

    it("handles empty arrays", () => {
      expect(calculateRMSE([], [])).toBe(0.0);
    });

    it("throws on mismatched lengths", () => {
      expect(() => calculateRMSE([1], [1, 2])).toThrow("Array lengths must match");
    });
  });

  describe("calculateQuadraticWeightedKappa", () => {
    it("returns 1.0 for perfect agreement", () => {
      const actual = [1, 2, 3, 4, 2, 3, 1, 4];
      const predicted = [1, 2, 3, 4, 2, 3, 1, 4];
      expect(calculateQuadraticWeightedKappa(actual, predicted, 1, 4)).toBe(1.0);
    });

    it("returns high kappa (>0.80) for near agreement with minor adjacent differences", () => {
      const actual = [1, 2, 3, 4, 2, 3, 1, 4, 3, 2];
      const predicted = [1, 2, 3, 3, 2, 3, 1, 4, 4, 2]; // only two 1-off ratings
      const kappa = calculateQuadraticWeightedKappa(actual, predicted, 1, 4);
      expect(kappa).toBeGreaterThan(0.85);
    });

    it("penalizes 3-point disagreements heavily compared to 1-point disagreements", () => {
      // 1-point diff
      const kappaSmallDiff = calculateQuadraticWeightedKappa([1, 2, 3, 4], [2, 2, 3, 3], 1, 4);
      // 3-point diff
      const kappaLargeDiff = calculateQuadraticWeightedKappa([1, 2, 3, 4], [4, 2, 3, 1], 1, 4);
      expect(kappaSmallDiff).toBeGreaterThan(kappaLargeDiff);
    });

    it("handles empty arrays without error", () => {
      expect(calculateQuadraticWeightedKappa([], [])).toBe(1.0);
    });
  });
});

describe("Cohort Comparison & Calibration Module", () => {
  const mockBenchmark: (id: string, scores: Record<string, number>) => HumanEvaluationBenchmark = (id, scores) => ({
    benchmarkId: `bm-${id}`,
    interviewId: `int-${id}`,
    candidateId: `cand-${id}`,
    problemId: "two-sum",
    graderId: "grader-senior-1",
    graderRole: "Senior Software Engineer",
    overallScore: 3,
    scores: {
      problemSolving: scores.problemSolving ?? 3,
      codeCorrectness: scores.codeCorrectness ?? 3,
      testingEdgeCases: scores.testingEdgeCases ?? 3,
      complexityReasoning: scores.complexityReasoning ?? 3,
      communication: scores.communication ?? 3,
    },
    notes: "Solid performance on sample cases.",
  });

  const mockReport: (scores: Record<string, number>) => Report = (scores) => ({
    overallScore: 3,
    rubricScores: [
      { dimension: RubricDimensionEnum.problemSolving, score: scores.problemSolving ?? 3, evidence: "Good explanation." },
      { dimension: RubricDimensionEnum.codeCorrectness, score: scores.codeCorrectness ?? 3, evidence: "All tests pass." },
      { dimension: RubricDimensionEnum.testingEdgeCases, score: scores.testingEdgeCases ?? 3, evidence: "Boundary checks included." },
      { dimension: RubricDimensionEnum.complexityReasoning, score: scores.complexityReasoning ?? 3, evidence: "Identified O(N) time." },
      { dimension: RubricDimensionEnum.communication, score: scores.communication ?? 3, evidence: "Clear structured thought." },
    ],
    strengths: ["Clean logic"],
    gaps: ["Could test empty array"],
    codeReplay: [],
    needsHumanReview: false,
  });

  it("produces valid correlation report and meets pilot criteria when cohorts align well", () => {
    // 6 candidate sessions
    const benchmarks = [
      mockBenchmark("1", { problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 3, complexityReasoning: 4, communication: 4 }),
      mockBenchmark("2", { problemSolving: 3, codeCorrectness: 3, testingEdgeCases: 2, complexityReasoning: 3, communication: 3 }),
      mockBenchmark("3", { problemSolving: 2, codeCorrectness: 2, testingEdgeCases: 1, complexityReasoning: 2, communication: 2 }),
      mockBenchmark("4", { problemSolving: 4, codeCorrectness: 3, testingEdgeCases: 3, complexityReasoning: 4, communication: 3 }),
      mockBenchmark("5", { problemSolving: 1, codeCorrectness: 1, testingEdgeCases: 1, complexityReasoning: 1, communication: 1 }),
      mockBenchmark("6", { problemSolving: 3, codeCorrectness: 4, testingEdgeCases: 2, complexityReasoning: 3, communication: 4 }),
    ];

    const aiEvaluations = [
      { interviewId: "int-1", report: mockReport({ problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 3, complexityReasoning: 4, communication: 4 }) },
      { interviewId: "int-2", report: mockReport({ problemSolving: 3, codeCorrectness: 3, testingEdgeCases: 2, complexityReasoning: 3, communication: 3 }) },
      { interviewId: "int-3", report: mockReport({ problemSolving: 2, codeCorrectness: 2, testingEdgeCases: 1, complexityReasoning: 2, communication: 2 }) },
      { interviewId: "int-4", report: mockReport({ problemSolving: 4, codeCorrectness: 3, testingEdgeCases: 3, complexityReasoning: 4, communication: 3 }) },
      { interviewId: "int-5", report: mockReport({ problemSolving: 1, codeCorrectness: 1, testingEdgeCases: 1, complexityReasoning: 1, communication: 1 }) },
      { interviewId: "int-6", report: mockReport({ problemSolving: 3, codeCorrectness: 4, testingEdgeCases: 2, complexityReasoning: 3, communication: 4 }) },
    ];

    const result = compareCohortEvaluations({
      benchmarks,
      aiEvaluations,
    });

    expect(result.matchedSessions).toBe(6);
    expect(result.flaggedDiscrepancies).toHaveLength(0);
    expect(result.overallAgreementIndex).toBe(1.0);
    expect(result.meetsPilotCriteria).toBe(true);
    expect(result.dimensionMetrics).toHaveLength(5);
    for (const metric of result.dimensionMetrics) {
      expect(metric.pearsonR).toBe(1.0);
      expect(metric.mae).toBe(0.0);
      expect(metric.cohenKappa).toBe(1.0);
    }
  });

  it("detects and flags discrepancies exceeding 1.0 points", () => {
    const benchmarks = [
      mockBenchmark("1", { problemSolving: 1, codeCorrectness: 1, testingEdgeCases: 1, complexityReasoning: 1, communication: 1 }),
      mockBenchmark("2", { problemSolving: 2, codeCorrectness: 2, testingEdgeCases: 2, complexityReasoning: 2, communication: 2 }),
      mockBenchmark("3", { problemSolving: 3, codeCorrectness: 3, testingEdgeCases: 3, complexityReasoning: 3, communication: 3 }),
      mockBenchmark("4", { problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 4, complexityReasoning: 4, communication: 4 }),
      mockBenchmark("5", { problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 4, complexityReasoning: 4, communication: 4 }),
    ];

    // Candidate 1 has massive discrepancy on problemSolving (Human=1, AI=4)
    const aiEvaluations = [
      { interviewId: "int-1", report: mockReport({ problemSolving: 4, codeCorrectness: 1, testingEdgeCases: 1, complexityReasoning: 1, communication: 1 }) },
      { interviewId: "int-2", report: mockReport({ problemSolving: 2, codeCorrectness: 2, testingEdgeCases: 2, complexityReasoning: 2, communication: 2 }) },
      { interviewId: "int-3", report: mockReport({ problemSolving: 3, codeCorrectness: 3, testingEdgeCases: 3, complexityReasoning: 3, communication: 3 }) },
      { interviewId: "int-4", report: mockReport({ problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 4, complexityReasoning: 4, communication: 4 }) },
      { interviewId: "int-5", report: mockReport({ problemSolving: 4, codeCorrectness: 4, testingEdgeCases: 4, complexityReasoning: 4, communication: 4 }) },
    ];

    const result = compareCohortEvaluations({
      benchmarks,
      aiEvaluations,
    });

    expect(result.flaggedDiscrepancies).toHaveLength(1);
    const flagged = result.flaggedDiscrepancies[0]!;
    expect(flagged.interviewId).toBe("int-1");
    expect(flagged.dimension).toBe("problemSolving");
    expect(flagged.diff).toBe(3);
  });

  it("warns and fails pilot criteria when sample size is below threshold (<5)", () => {
    const benchmarks = [
      mockBenchmark("1", { problemSolving: 3 }),
      mockBenchmark("2", { problemSolving: 4 }),
    ];

    const aiEvaluations = [
      { interviewId: "int-1", report: mockReport({ problemSolving: 3 }) },
      { interviewId: "int-2", report: mockReport({ problemSolving: 4 }) },
    ];

    const result = compareCohortEvaluations({
      benchmarks,
      aiEvaluations,
    });

    expect(result.matchedSessions).toBe(2);
    expect(result.meetsPilotCriteria).toBe(false);
    expect(result.calibrationAdvice.some((a) => a.includes("Insufficient cohort sample size"))).toBe(true);
  });

  it("handles unmatched sessions gracefully without throwing", () => {
    const benchmarks = [
      mockBenchmark("missing-in-ai", { problemSolving: 3 }),
    ];

    const aiEvaluations = [
      { interviewId: "int-other", report: mockReport({ problemSolving: 3 }) },
    ];

    const result = compareCohortEvaluations({
      benchmarks,
      aiEvaluations,
    });

    expect(result.totalSessions).toBe(1);
    expect(result.matchedSessions).toBe(0);
    expect(result.meetsPilotCriteria).toBe(false);
  });
});
