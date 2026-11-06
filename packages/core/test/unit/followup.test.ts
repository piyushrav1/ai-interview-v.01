import { describe, it, expect } from "vitest";
import { buildFollowUpPrompt } from "../../src/prompts/v1/followup.js";
import { getProblem } from "../../src/problems/index.js";

describe("buildFollowUpPrompt", () => {
  const problem = getProblem("valid-anagram");

  it("generates failure-grounded prompt when hidden tests fail", () => {
    const prompt = buildFollowUpPrompt({
      language: "python",
      problem,
      codeSnapshot: {
        turnId: 3,
        language: "python",
        source: "def is_anagram(s, t):\n    return len(s) == len(t)",
        timeMs: 12000,
      },
      submission: {
        allPassed: false,
        passedCount: 2,
        totalCount: 6,
        failedHiddenCount: 4,
      },
    });

    expect(prompt.system).toContain("SUBMISSION STATUS: SOME TESTS FAILED");
    expect(prompt.system).toContain("CRITICAL RULES FOR SOCRATIC INTERVIEWING");
    expect(prompt.system).toContain("NEVER reveal the exact hidden test input");
    expect(prompt.system).toContain("def is_anagram(s, t):");
    expect(prompt.messages[0]?.text).toContain("### Follow-Up: Edge Case Analysis");
  });

  it("generates complexity & scaling prompt when all tests pass", () => {
    const prompt = buildFollowUpPrompt({
      language: "python",
      problem,
      codeSnapshot: {
        turnId: 4,
        language: "python",
        source: "def is_anagram(s, t):\n    return sorted(s) == sorted(t)",
        timeMs: 18000,
      },
      submission: {
        allPassed: true,
        passedCount: 6,
        totalCount: 6,
        failedHiddenCount: 0,
      },
    });

    expect(prompt.system).toContain("SUBMISSION STATUS: ALL TESTS PASSED");
    expect(prompt.system).toContain("Time Complexity and Space Complexity");
    expect(prompt.system).toContain("10^7");
    expect(prompt.messages[0]?.text).toContain("### Follow-Up: Complexity & Scaling");
  });

  it("handles compilation error appropriately", () => {
    const prompt = buildFollowUpPrompt({
      language: "cpp",
      problem,
      codeSnapshot: {
        turnId: 2,
        language: "cpp",
        source: "int trap() {",
        timeMs: 5000,
      },
      submission: {
        allPassed: false,
        passedCount: 0,
        totalCount: 6,
        compileError: "syntax error: expected '}'",
      },
    });

    expect(prompt.system).toContain("SUBMISSION STATUS: COMPILATION ERROR");
    expect(prompt.system).toContain("syntax error: expected '}'");
  });
});
