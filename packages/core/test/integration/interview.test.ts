import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { createInterview, advancePhase, isInterviewComplete } from "../../src/machine/index.js";
import { FakeModel } from "../fakes/fake-model.js";
import { createInMemoryStorage } from "../fixtures/in-memory-storage.js";
import { mockRunner } from "../fixtures/mock-runner.js";
import { PhaseEnum } from "@testmeman/contracts";

describe("full interview flow", () => {
  let fakeModel: FakeModel;
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    fakeModel = new FakeModel();
    storage = createInMemoryStorage();
  });

  it("creates and stores interview correctly", async () => {
    const interview = createInterview({ role: "Fresher Software Engineer", language: "python" });
    expect(interview.phase).toBe(PhaseEnum.plan);

    await storage.createInterview(interview);
    const retrieved = await storage.getInterview(interview.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(interview.id);
  });

  it("advances through phases correctly", () => {
    let phase = PhaseEnum.plan;

    // Plan -> Intro
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.intro);

    // Intro -> Problem
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.problem);

    // Problem -> Coding
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.coding);

    // Coding -> FollowUps
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.followUps);

    // FollowUps -> Concepts
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.concepts);

    // Concepts -> WrapUp
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.wrapUp);

    // WrapUp -> Evaluate
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.evaluate);

    // Evaluate -> Done (terminal)
    expect(isInterviewComplete(phase)).toBe(true);
    phase = advancePhase(phase);
    expect(phase).toBe(PhaseEnum.done);
  });

  it("runs mock code execution", async () => {
    const result = await mockRunner.run({
      language: "python",
      source: "def main(): pass",
      tests: [
        { input: "test", expected: "result", hidden: false },
        { input: "hidden", expected: "secret", hidden: true },
      ],
    });

    expect(result.results).toBeDefined();
    expect(result.results).toHaveLength(2);
  });

  it("fake model generates streaming responses", async () => {
    const chunks: string[] = [];
    for await (const chunk of fakeModel.chat({
      system: "Test system",
      messages: [{ role: "interviewer", text: "Hello" }],
    })) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join("")).toContain("interview");
  });

  it("fake model returns structured output", async () => {
    const output = await fakeModel.structured({
      system: "Eval",
      prompt: "Score this interview",
      schema: z.object({
        overallScore: z.number(),
        rubricScores: z.array(z.object({
          dimension: z.string(),
          score: z.number(),
          evidence: z.string(),
        })),
        strengths: z.array(z.string()),
        gaps: z.array(z.string()),
        needsHumanReview: z.boolean(),
      }),
    });

    expect(output.overallScore).toBe(3);
    expect(output.rubricScores).toHaveLength(5);
    expect(output.needsHumanReview).toBe(false);
  });
});