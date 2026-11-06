import { describe, it, expect } from "vitest";
import { interviews } from "../src/routes/interviews.js";
import { createDevAdapters } from "../src/adapters/dev.js";

describe("Evaluator API Routes (POST /interviews/:id/end & GET /interviews/:id/report)", () => {
  it("returns 404 when ending nonexistent interview", async () => {
    const adapters = createDevAdapters();
    const app = interviews(adapters);

    const res = await app.request("/nonexistent-id/end", {
      method: "POST",
    });

    expect(res.status).toBe(404);
  });

  it("evaluates interview, records usage, and persists report", async () => {
    const adapters = createDevAdapters();
    const app = interviews(adapters);

    // 1. Create an interview
    const createRes = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "software_engineer",
        language: "python",
        problemSlug: "two-sum",
      }),
    });
    expect(createRes.status).toBe(201);
    const { id } = await createRes.json<{ id: string }>();

    // 2. Submit code
    await app.request(`/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "python",
        source: "def twoSum(nums, target):\n    return [0, 1]",
      }),
    });

    // 3. End interview
    const endRes = await app.request(`/${id}/end`, {
      method: "POST",
    });
    expect(endRes.status).toBe(200);
    const endData = await endRes.json<{
      report: { overallScore: number; rubricScores: any[]; needsHumanReview: boolean };
      needsHumanReview: boolean;
      usage: { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number };
    }>();

    expect(endData.report).toBeDefined();
    expect(endData.report.overallScore).toBeGreaterThanOrEqual(1);
    expect(endData.report.rubricScores.length).toBe(5);
    expect(typeof endData.needsHumanReview).toBe("boolean");

    // Token & cost accounting verified
    expect(endData.usage).toBeDefined();
    expect(endData.usage.interviewId).toBe(id);
    expect(endData.usage.totalTokens).toBeGreaterThan(0);
    expect(endData.usage.estimatedCostUsd).toBeGreaterThanOrEqual(0);

    // 4. GET /report returns report and usage
    const reportRes = await app.request(`/${id}/report`, {
      method: "GET",
    });
    expect(reportRes.status).toBe(200);
    const reportData = await reportRes.json<{
      overallScore: number;
      rubricScores: any[];
      usage: { totalTokens: number };
    }>();

    expect(reportData.overallScore).toBe(endData.report.overallScore);
    expect(reportData.rubricScores.length).toBe(5);
    expect(reportData.usage.totalTokens).toBe(endData.usage.totalTokens);
  });
});

