import { z } from "zod";

export const HiddenTest = z.object({
  input: z.string(),
  expected: z.string(),
  hidden: z.literal(true),
});

export const VisibleTest = z.object({
  input: z.string(),
  expected: z.string(),
  hidden: z.literal(false),
});

export const Test = z.discriminatedUnion("hidden", [HiddenTest, VisibleTest]);

export const StarterCode = z.object({
  python: z.string(),
  cpp: z.string(),
  c: z.string(),
  java: z.string(),
  javascript: z.string(),
});

export const ProblemDifficulty = z.enum(["easy", "medium", "hard"]);

export const ProblemTopics = z.array(z.string());

export const ProblemSchema = z.object({
  slug: z.string().min(1),
  title: z.string(),
  difficulty: ProblemDifficulty,
  statement: z.string(),
  examples: z.array(z.object({ input: z.string(), output: z.string(), explanation: z.string() })),
  tests: z.array(Test),
  starterCode: StarterCode,
  topics: ProblemTopics,
  timeLimitMs: z.number().int().positive(),
});

export type Problem = z.infer<typeof ProblemSchema>;
export type Test = z.infer<typeof Test>;
export type StarterCode = z.infer<typeof StarterCode>;