/** Language the candidate codes in (README v1: Python 3, C++, C, Java, JavaScript). */
export const LanguageEnum = {
  python: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  javascript: "javascript",
} as const;

export type Language = (typeof LanguageEnum)[keyof typeof LanguageEnum];

/** Interview state machine phases from the README. */
export const PhaseEnum = {
  plan: "plan",
  intro: "intro",
  problem: "problem",
  coding: "coding",
  followUps: "followUps",
  concepts: "concepts",
  wrapUp: "wrapUp",
  evaluate: "evaluate",
  done: "done",
} as const;

export type Phase = (typeof PhaseEnum)[keyof typeof PhaseEnum];

/** Roles that can appear in the transcript. */
export const TurnRoleEnum = {
  interviewer: "interviewer",
  candidate: "candidate",
} as const;

export type TurnRole = (typeof TurnRoleEnum)[keyof typeof TurnRoleEnum];

/** Rubric dimensions that the evaluator scores (1–4 each). */
export const RubricDimensionEnum = {
  problemSolving: "problemSolving",
  codeCorrectness: "codeCorrectness",
  testingEdgeCases: "testingEdgeCases",
  complexityReasoning: "complexityReasoning",
  communication: "communication",
} as const;

export type RubricDimension = (typeof RubricDimensionEnum)[keyof typeof RubricDimensionEnum];

/** Candidate / interviewer identity for reports. */
export const RoleEnum = {
  candidate: "candidate",
  interviewer: "interviewer",
} as const;

export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];