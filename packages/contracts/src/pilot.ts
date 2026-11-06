import { z } from "zod";
import { RubricDimensionEnum } from "./common.js";

export const HumanEvaluationBenchmarkSchema = z.object({
  benchmarkId: z.string(),
  interviewId: z.string(),
  candidateId: z.string(),
  problemId: z.string(),
  graderId: z.string(),
  graderRole: z.string().default("Senior Software Engineer"),
  overallScore: z.number().int().min(1).max(4),
  scores: z.record(z.nativeEnum(RubricDimensionEnum), z.number().int().min(1).max(4)),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
});

export type HumanEvaluationBenchmark = z.infer<typeof HumanEvaluationBenchmarkSchema>;

export const DimensionCorrelationMetricSchema = z.object({
  dimension: z.nativeEnum(RubricDimensionEnum),
  sampleSize: z.number().int().min(0),
  pearsonR: z.number(),
  mae: z.number().min(0),
  rmse: z.number().min(0),
  cohenKappa: z.number(),
  meanHumanScore: z.number(),
  meanAiScore: z.number(),
  bias: z.number(),
});

export type DimensionCorrelationMetric = z.infer<typeof DimensionCorrelationMetricSchema>;

export const DiscrepancySessionSchema = z.object({
  interviewId: z.string(),
  candidateId: z.string(),
  problemId: z.string(),
  dimension: z.nativeEnum(RubricDimensionEnum),
  humanScore: z.number().int().min(1).max(4),
  aiScore: z.number().int().min(1).max(4),
  diff: z.number(),
  reason: z.string(),
});

export type DiscrepancySession = z.infer<typeof DiscrepancySessionSchema>;

export const PilotCohortReportSchema = z.object({
  cohortId: z.string(),
  evaluatedAt: z.string(),
  totalSessions: z.number().int().min(0),
  matchedSessions: z.number().int().min(0),
  overallAgreementIndex: z.number(),
  dimensionMetrics: z.array(DimensionCorrelationMetricSchema),
  flaggedDiscrepancies: z.array(DiscrepancySessionSchema),
  calibrationAdvice: z.array(z.string()),
  meetsPilotCriteria: z.boolean(),
});

export type PilotCohortReport = z.infer<typeof PilotCohortReportSchema>;
