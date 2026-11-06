import { z } from "zod";
import { PhaseEnum, TurnRoleEnum } from "./common.js";

export const TurnSchema = z.object({
  id: z.number().int(),
  role: z.enum([TurnRoleEnum.interviewer, TurnRoleEnum.candidate]),
  text: z.string(),
  turnAt: z.number().int().nonnegative(),
});

export type Turn = z.infer<typeof TurnSchema>;

export const CodeSnapshotSchema = z.object({
  turnId: z.number().int(),
  language: z.enum(["python", "cpp", "c", "java", "javascript"] as const),
  source: z.string(),
  timeMs: z.number().int().nonnegative(),
});

export type CodeSnapshot = z.infer<typeof CodeSnapshotSchema>;

export const InterviewSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  language: z.enum(["python", "cpp", "c", "java", "javascript"] as const),
  phase: z.nativeEnum(PhaseEnum),
  transcript: z.array(TurnSchema),
  codeSnapshots: z.array(CodeSnapshotSchema),
  conceptQuestions: z.array(z.string()),
  startTime: z.number().int(),
  endTime: z.number().int().nullable(),
  timeLimitMs: z.number().int(),
});

export type Interview = z.infer<typeof InterviewSchema>;