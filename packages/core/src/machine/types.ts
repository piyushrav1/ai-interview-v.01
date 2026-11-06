import type { Phase, CodeSnapshot, Interview } from "@testmeman/contracts";

export interface InterviewState extends Interview {
  phase: Phase;
}

export type PhaseDuration = {
  intro: number;
  problem: number;
  coding: number;
  followUps: number;
  concepts: number;
  wrapUp: number;
  evaluate: number;
};

export const DEFAULT_TIME_LIMIT_MS: PhaseDuration = {
  intro: 2 * 60 * 1000, // 2 min
  problem: 5 * 60 * 1000, // 5 min
  coding: 15 * 60 * 1000, // 15 min
  followUps: 5 * 60 * 1000, // 5 min
  concepts: 5 * 60 * 1000, // 5 min
  wrapUp: 1 * 60 * 1000, // 1 min
  evaluate: 1 * 60 * 1000, // 1 min
};

export const TOTAL_TIME_MS = Object.values(DEFAULT_TIME_LIMIT_MS).reduce(
  (sum, v) => sum + v,
  0
);

export type InterviewContext = {
  state: InterviewState;
  turnId: number;
  codeSnapshot?: CodeSnapshot;
};