import { z } from "zod";
import { RubricDimensionEnum } from "./common.js";

export const ScoreEvidenceSchema = z.object({
  dimension: z.nativeEnum(RubricDimensionEnum),
  score: z.number().int().min(1).max(4),
  evidence: z.string(),
});

export type ScoreEvidence = z.infer<typeof ScoreEvidenceSchema>;

export const ReportSchema = z.object({
  overallScore: z.number().int().min(1).max(4),
  rubricScores: z.array(ScoreEvidenceSchema),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  codeReplay: z.array(
    z.object({
      turnId: z.number().int(),
      source: z.string(),
      timeMs: z.number().int(),
    })
  ),
  needsHumanReview: z.boolean().default(false),
});

export type Report = z.infer<typeof ReportSchema>;;