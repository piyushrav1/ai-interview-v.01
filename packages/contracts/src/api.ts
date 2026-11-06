import { z } from "zod";
import { PhaseEnum } from "./common.js";
import { ReportSchema } from "./report.js";

// POST /interviews
export const StartInterviewRequest = z.object({
  role: z.string(),
  language: z.enum(["python", "cpp", "c", "java", "javascript"] as const),
});

export const StartInterviewResponse = z.object({
  id: z.string().uuid(),
});

// GET /interviews/:id
export const GetInterviewResponse = z.object({
  id: z.string().uuid(),
  phase: z.nativeEnum(PhaseEnum),
  transcript: z.array(
    z.object({
      id: z.number().int(),
      role: z.enum(["interviewer", "candidate"]),
      text: z.string(),
      timestamp: z.number().int(),
    })
  ),
  codeSnapshot: z
    .object({
      language: z.enum(["python", "cpp", "c", "java", "javascript"]),
      source: z.string(),
    })
    .nullish(),
  timeLeftMs: z.number().int().nonnegative(),
});

// POST /interviews/:id/messages
export const SubmitMessageRequest = z.object({
  text: z.string(),
});

export const MessageEventType = z.enum(["delta", "turn", "phase", "done"]);

export const MessageEvent = z.object({
  type: MessageEventType,
  content: z.string(),
});

// PUT /interviews/:id/code
export const SubmitCodeRequest = z.object({
  language: z.enum(["python", "cpp", "c", "java", "javascript"] as const),
  source: z.string(),
});

// POST /interviews/:id/run
export const RunCodeResponse = z.object({
  results: z.array(
    z.object({
      passed: z.boolean(),
      stdout: z.string(),
      stderr: z.string(),
      timeMs: z.number().int(),
      hidden: z.boolean(),
    })
  ),
  compileError: z.string().optional(),
});

// POST /interviews/:id/submit
export const SubmitCodeResponse = z.object({
  hiddenTestsPassed: z.boolean(),
});

// GET /interviews/:id/report
export const GetReportResponse = ReportSchema;