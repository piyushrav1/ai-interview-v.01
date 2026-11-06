import { describe, it, expect } from "vitest";
import {
  measureStreamingTTFT,
  measureEvaluationTurnaround,
  calculateLatencyPercentiles,
  generateSlaComplianceReport,
} from "../../src/pilot/sla.js";
import type { AIModel } from "../../src/adapters.js";
import {
  PhaseEnum,
  RubricDimensionEnum,
  type Interview,
} from "@testmeman/contracts";

describe("SLA Benchmark & Latency Verification Engine", () => {
  describe("calculateLatencyPercentiles", () => {
    it("accurately computes percentiles for a 10-item series", () => {
      // 10 items: 100 to 1000
      const latencies = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      const result = calculateLatencyPercentiles(latencies);

      expect(result.min).toBe(100);
      expect(result.max).toBe(1000);
      expect(result.p50).toBe(500);
      expect(result.p90).toBe(900);
      expect(result.p95).toBe(1000);
      expect(result.p99).toBe(1000);
      expect(result.mean).toBe(550);
    });

    it("handles single-item and empty arrays without error", () => {
      const empty = calculateLatencyPercentiles([]);
      expect(empty.p50).toBe(0);
      expect(empty.mean).toBe(0);

      const single = calculateLatencyPercentiles([340]);
      expect(single.min).toBe(340);
      expect(single.max).toBe(340);
      expect(single.p50).toBe(340);
      expect(single.p95).toBe(340);
      expect(single.mean).toBe(340);
    });

    it("handles unordered array input properly", () => {
      const unordered = [900, 100, 500, 300, 700];
      const result = calculateLatencyPercentiles(unordered);
      expect(result.min).toBe(100);
      expect(result.max).toBe(900);
      expect(result.p50).toBe(500);
    });
  });

  describe("measureStreamingTTFT", () => {
    it("measures time-to-first-token accurately on streaming chat", async () => {
      const simulatedDelayMs = 25;
      const fakeAi: AIModel = {
        async *chat() {
          await new Promise((r) => setTimeout(r, simulatedDelayMs));
          yield "Hello";
          yield " ";
          yield "candidate!";
        },
        async structured() {
          throw new Error("Not used in chat test");
        },
      };

      const result = await measureStreamingTTFT({
        ai: fakeAi,
        system: "You are an interviewer.",
        messages: [{ role: "candidate", text: "Hi" }],
        phase: PhaseEnum.intro,
      });

      expect(result.firstChunk).toBe("Hello");
      expect(result.fullResponse).toBe("Hello candidate!");
      expect(result.chunkCount).toBe(3);
      // TTFT should be approximately simulatedDelayMs (at least 20ms)
      expect(result.ttftMs).toBeGreaterThanOrEqual(18);
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(result.ttftMs);
    });
  });

  describe("measureEvaluationTurnaround", () => {
    it("measures end-to-end multi-agent evaluation execution duration", async () => {
      const mockInterview: Interview = {
        id: "int-sla-test",
        problemId: "valid-anagram",
        language: "python",
        phase: "evaluate",
        startTime: Date.now() - 60000,
        transcript: [
          { role: "interviewer", text: "Let us start.", timeMs: 0 },
          { role: "candidate", text: "I will use a hash map for O(N) time.", timeMs: 1000 },
        ],
        codeSnapshots: [
          {
            turnId: 1,
            source: "def isAnagram(s, t):\n    return sorted(s) == sorted(t)",
            timeMs: 2000,
          },
        ],
      };

      const mockOutput = {
        overallScore: 3,
        rubricScores: [
          { dimension: RubricDimensionEnum.problemSolving, score: 3, evidence: "Used sorting approach.", confidence: "high" as const },
          { dimension: RubricDimensionEnum.codeCorrectness, score: 3, evidence: "Passes sample cases.", confidence: "high" as const },
          { dimension: RubricDimensionEnum.testingEdgeCases, score: 3, evidence: "Considered anagram lengths.", confidence: "high" as const },
          { dimension: RubricDimensionEnum.complexityReasoning, score: 3, evidence: "Noted sorting time complexity.", confidence: "high" as const },
          { dimension: RubricDimensionEnum.communication, score: 3, evidence: "Clear communication.", confidence: "high" as const },
        ],
        strengths: ["Clean code"],
        gaps: ["Can optimize to O(N) using frequency count"],
        needsHumanReview: false,
      };

      const fakeAi: AIModel = {
        async *chat() {
          yield "";
        },
        async structured() {
          await new Promise((r) => setTimeout(r, 20));
          return mockOutput as any;
        },
      };

      const { durationMs, result } = await measureEvaluationTurnaround(fakeAi, mockInterview);

      expect(durationMs).toBeGreaterThanOrEqual(15);
      expect(result.report.overallScore).toBe(3);
      expect(result.report.rubricScores).toHaveLength(5);
      expect(result.needsHumanReview).toBe(false);
    });
  });

  describe("generateSlaComplianceReport", () => {
    it("reports overall compliance when TTFT and evaluation times are within limits", () => {
      const ttftLatencies = [150, 200, 250, 300, 400, 500, 600, 750, 900, 1100];
      const evalDurationMs = 15400; // 15.4s < 60s

      const report = generateSlaComplianceReport({
        ttftLatenciesMs: ttftLatencies,
        evalDurationMs,
      });

      expect(report.meetsTtftSla).toBe(true);
      expect(report.meetsEvalSla).toBe(true);
      expect(report.overallSlaCompliant).toBe(true);
      expect(report.summary).toContain("SLA Compliant");
    });

    it("flags failure when TTFT exceeds 1.5s (1500ms)", () => {
      const ttftLatencies = [200, 400, 600, 800, 1600]; // 1600ms exceeds 1500ms
      const evalDurationMs = 20000;

      const report = generateSlaComplianceReport({
        ttftLatenciesMs: ttftLatencies,
        evalDurationMs,
      });

      expect(report.meetsTtftSla).toBe(false);
      expect(report.overallSlaCompliant).toBe(false);
      expect(report.summary).toContain("SLA Non-Compliant");
    });

    it("flags failure when evaluation duration exceeds 60s (60000ms)", () => {
      const ttftLatencies = [200, 300, 400];
      const evalDurationMs = 65000; // 65s exceeds 60s

      const report = generateSlaComplianceReport({
        ttftLatenciesMs: ttftLatencies,
        evalDurationMs,
      });

      expect(report.meetsEvalSla).toBe(false);
      expect(report.overallSlaCompliant).toBe(false);
      expect(report.summary).toContain("Evaluation=65000ms exceeds 60000ms");
    });
  });

  describe("Full SLA Benchmark Simulation (20 Candidate Turns)", () => {
    it(
      "verifies synthetic 20-turn cohort adheres strictly to p95 < 1400ms and max < 1500ms SLA",
      async () => {
        // Simulate 20 concurrent candidate turns with distributed delays (50ms to 450ms)
        const simulatedDelays = [
          50, 70, 85, 100, 115, 130, 150, 170, 190, 210,
          230, 250, 275, 300, 325, 350, 380, 410, 440, 480,
        ];

        const latencies = await Promise.all(
          simulatedDelays.map(async (delay) => {
            const fakeAi: AIModel = {
              async *chat() {
                await new Promise((r) => setTimeout(r, delay));
                yield "Token";
              },
              async structured() {
                throw new Error("Unused");
              },
            };

            const res = await measureStreamingTTFT({
              ai: fakeAi,
              system: "Interviewer",
              messages: [{ role: "candidate", text: "Test turn" }],
              phase: PhaseEnum.coding,
            });

            return res.ttftMs;
          })
        );

        const percentiles = calculateLatencyPercentiles(latencies);

        // Verify SLA contracts
        expect(percentiles.p50).toBeLessThan(800); // Target <800ms
        expect(percentiles.p95).toBeLessThan(1400); // Target <1400ms
        expect(percentiles.max).toBeLessThan(1500); // Hard SLA <1500ms (1.5s)

        const slaReport = generateSlaComplianceReport({
          ttftLatenciesMs: latencies,
          evalDurationMs: 8500, // 8.5s
        });

        expect(slaReport.overallSlaCompliant).toBe(true);
      },
      15000
    );
  });
});
