import { z } from "zod";
import { RubricDimensionEnum } from "./common.js";

export const ConfidenceEnum = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;

export type Confidence = (typeof ConfidenceEnum)[keyof typeof ConfidenceEnum];

export const ScoreEvidenceSchema = z.object({
  dimension: z.nativeEnum(RubricDimensionEnum),
  score: z.number().int().min(1).max(4),
  evidence: z.string(),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
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
  humanReviewReason: z.string().optional(),
});

export type Report = z.infer<typeof ReportSchema>;;