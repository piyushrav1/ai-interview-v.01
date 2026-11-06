import { describe, it, expect } from "vitest";
import { LanguageEnum, PhaseEnum } from "../src/common.ts";
import { ProblemSchema } from "../src/problems.ts";

describe("common types", () => {
  it("exports Language enum", () => {
    expect(LanguageEnum.python).toBe("python");
    expect(LanguageEnum.cpp).toBe("cpp");
  });

  it("exports Phase enum", () => {
    expect(PhaseEnum.plan).toBe("plan");
    expect(PhaseEnum.done).toBe("done");
  });
});

describe("Problem schema", () => {
  it("parses a valid problem", () => {
    const problem = {
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy",
      statement: "Given an array of integers and a target, return the indices of the two numbers that add up to the target.",
      examples: [{ input: "4\n2 7 11 15\n9", output: "0 1", explanation: "2 + 7 = 9" }],
      tests: [{ input: "4\n2 7 11 15\n9", expected: "0 1", hidden: false }],
      starterCode: { python: "def main():\n    pass\n\nmain()", cpp: "int main() { }", c: "int main() { }", java: "class Main { }", javascript: "" },
      topics: ["arrays", "hashing"],
      timeLimitMs: 2000,
    };
    const parsed = ProblemSchema.parse(problem);
    expect(parsed.slug).toBe("two-sum");
  });
});