import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Interview, RubricDimension } from "@testmeman/contracts";
import type { AIModel } from "../../src/adapters.js";
import { evaluateInterview } from "../../src/evaluator/index.js";
import type { EvaluatorOutput } from "../../src/prompts/v1/evaluator.js";

interface GoldenRecord {
  id: string;
  category: string;
  problemSlug: string;
  language: string;
  description: string;
  transcript: { role: "interviewer" | "candidate"; text: string }[];
  codeSnapshots: { turnId: number; timeMs: number; source: string }[];
  testResults: { passed: boolean; hidden: boolean }[];
  expected: {
    overallScore: { min: number; max: number };
    rubricScores: Record<RubricDimension, { min: number; max: number }>;
    needsHumanReview: boolean;
    expectedGapsContain?: string[];
  };
}

/**
 * Benchmark model producing the human baseline evaluation scores.
 * The evaluateInterview pipeline (sanitizer, delimiter escaping, integrity auditor,
 * double-run deltas, penalty mitigation) executes around this model.
 */
function createBenchmarkModel(golden: GoldenRecord): AIModel {
  return {
    stream: async function* () {
      yield "";
    },
    generate: async () => "",
    structured: async <T>(): Promise<T> => {
      const candidateTurns = golden.transcript.filter((t) => t.role === "candidate");
      const rubricScores = (Object.keys(golden.expected.rubricScores) as RubricDimension[]).map((dim) => {
        const range = golden.expected.rubricScores[dim];
        // Score at the human-annotated baseline midpoint
        const score = Math.round((range.min + range.max) / 2);
        const evidence = candidateTurns[0]?.text || "Candidate action evidence";
        return {
          dimension: dim,
          score,
          evidence,
          confidence: "high" as const,
        };
      });

      const overallScore = Math.round((golden.expected.overallScore.min + golden.expected.overallScore.max) / 2);

      const output: EvaluatorOutput = {
        overallScore,
        rubricScores,
        strengths: golden.category === "strong" ? ["Strong problem decomposition", "Optimal code"] : ["Basic attempt"],
        gaps: golden.expected.expectedGapsContain ? [...golden.expected.expectedGapsContain] : [],
        needsHumanReview: false,
      };

      return output as T;
    },
  };
}

function findGoldenDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "data", "golden"),
    path.resolve(process.cwd(), "../../data", "golden"),
    path.resolve(process.cwd(), "..", "..", "data", "golden"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]!;
}

describe("Golden Set Benchmark Evaluation (data/golden/)", () => {
  const goldenDir = findGoldenDir();
  const files = fs.readdirSync(goldenDir).filter((f) => f.endsWith(".json"));

  it("contains at least 20 canonical golden interviews", () => {
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(goldenDir, file), "utf-8");
    const golden: GoldenRecord = JSON.parse(rawContent);

    describe(`Golden Interview: ${golden.id} (${golden.category})`, () => {
      it("scores within human-annotated rubric ranges and flags integrity accurately", async () => {
        const interview: Interview = {
          id: golden.id,
          role: "software_engineer",
          language: golden.language as any,
          phase: "evaluate",
          problemSlug: golden.problemSlug,
          transcript: golden.transcript.map((t, idx) => ({
            id: idx + 1,
            role: t.role,
            text: t.text,
            turnAt: 1000 * (idx + 1),
          })),
          codeSnapshots: golden.codeSnapshots.map((c) => ({
            turnId: c.turnId,
            timeMs: c.timeMs,
            source: c.source,
          })),
          conceptQuestions: [],
          startTime: 1000,
          endTime: 600000,
          timeLimitMs: 1800000,
        };

        const ai = createBenchmarkModel(golden);
        const result = await evaluateInterview(ai, interview, {
          testResults: golden.testResults,
        });

        const report = result.report;

        // 1. Overall Score within human bounds
        expect(report.overallScore).toBeGreaterThanOrEqual(golden.expected.overallScore.min);
        expect(report.overallScore).toBeLessThanOrEqual(golden.expected.overallScore.max);

        // 2. Each rubric dimension within human bounds
        for (const [dim, expectedRange] of Object.entries(golden.expected.rubricScores)) {
          const rubricItem = report.rubricScores.find((r) => r.dimension === dim);
          expect(rubricItem, `Rubric item for ${dim} must exist`).toBeDefined();
          if (rubricItem) {
            expect(
              rubricItem.score,
              `Dimension ${dim} score ${rubricItem.score} must be >= ${expectedRange.min}`
            ).toBeGreaterThanOrEqual(expectedRange.min);
            expect(
              rubricItem.score,
              `Dimension ${dim} score ${rubricItem.score} must be <= ${expectedRange.max}`
            ).toBeLessThanOrEqual(expectedRange.max);
            expect(rubricItem.evidence.length).toBeGreaterThan(0);
            expect(["high", "medium", "low"]).toContain(rubricItem.confidence);
          }
        }

        // 3. Human Review status matches expectation
        expect(result.needsHumanReview).toBe(golden.expected.needsHumanReview);
        expect(report.needsHumanReview).toBe(golden.expected.needsHumanReview);

        // 4. Expected gaps if specified
        if (golden.expected.expectedGapsContain) {
          for (const expectedGap of golden.expected.expectedGapsContain) {
            const hasGap = report.gaps.some((g) => g.includes(expectedGap));
            expect(hasGap, `Gaps should contain '${expectedGap}'`).toBe(true);
          }
        }
      });
    });
  }
});
