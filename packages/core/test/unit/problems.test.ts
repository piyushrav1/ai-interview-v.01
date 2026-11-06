import { describe, it, expect } from "vitest";
import {
  listProblems,
  getProblem,
  DEFAULT_PROBLEM_SLUG,
  PROBLEMS,
} from "../../src/problems/index.js";
import { ProblemSchema } from "@testmeman/contracts";

describe("Problem Bank Registry", () => {
  it("lists all available problems", () => {
    const list = listProblems();
    expect(list.length).toBeGreaterThanOrEqual(4);
    const slugs = list.map((p) => p.slug);
    expect(slugs).toContain("valid-anagram");
    expect(slugs).toContain("two-sum");
    expect(slugs).toContain("isomorphic-strings");
    expect(slugs).toContain("reverse-string");
  });

  it("retrieves default problem when slug is omitted or invalid", () => {
    const defaultProblem = getProblem();
    expect(defaultProblem.slug).toBe(DEFAULT_PROBLEM_SLUG);

    const fallbackProblem = getProblem("non-existent-slug");
    expect(fallbackProblem.slug).toBe(DEFAULT_PROBLEM_SLUG);
  });

  it("retrieves each problem by its exact slug", () => {
    for (const slug of Object.keys(PROBLEMS)) {
      const problem = getProblem(slug);
      expect(problem.slug).toBe(slug);
      expect(problem.title).toBeDefined();
      expect(problem.statement.length).toBeGreaterThan(10);
      expect(problem.examples.length).toBeGreaterThan(0);
      expect(problem.tests.length).toBeGreaterThan(0);
    }
  });

  it("validates that all problems conform to ProblemSchema", () => {
    for (const problem of Object.values(PROBLEMS)) {
      const parsed = ProblemSchema.parse(problem);
      expect(parsed.slug).toBe(problem.slug);

      // Must have at least 1 sample test and at least 1 hidden test
      const sampleTests = problem.tests.filter((t) => !t.hidden);
      const hiddenTests = problem.tests.filter((t) => t.hidden);
      expect(sampleTests.length).toBeGreaterThan(0);
      expect(hiddenTests.length).toBeGreaterThan(0);

      // Must provide starter code for all 5 target languages
      expect(problem.starterCode.python).toBeDefined();
      expect(problem.starterCode.cpp).toBeDefined();
      expect(problem.starterCode.c).toBeDefined();
      expect(problem.starterCode.java).toBeDefined();
      expect(problem.starterCode.javascript).toBeDefined();
    }
  });
});

