import type { FC } from "react";
import type { Report, ScoreEvidence } from "@testmeman/contracts";

export interface ReportViewProps {
  report: Report;
}

const dimensionLabels: Record<string, string> = {
  problemSolving: "Problem Solving",
  codeCorrectness: "Code Correctness",
  testingEdgeCases: "Testing & Edge Cases",
  complexityReasoning: "Complexity Reasoning",
  communication: "Communication",
};

function scoreColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-blue-500";
  if (score >= 2) return "bg-yellow-500";
  return "bg-red-500";
}

function overallColor(score: number): string {
  if (score >= 4) return "text-green-400";
  if (score >= 3) return "text-blue-400";
  if (score >= 2) return "text-yellow-400";
  return "text-red-400";
}

const RubricRow: FC<{ item: ScoreEvidence }> = ({ item }) => {
  const pct = (item.score / 4) * 100;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-300">
          {dimensionLabels[item.dimension] ?? item.dimension}
        </span>
        <span className="text-sm font-bold text-gray-200">
          {item.score}/4
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full ${scoreColor(item.score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs italic text-gray-400">
        &ldquo;{item.evidence}&rdquo;
      </p>
    </div>
  );
};

export const ReportView: FC<ReportViewProps> = ({ report }) => {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Interview Report
        </h2>
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-6xl font-black ${overallColor(report.overallScore)}`}
          >
            {report.overallScore}
          </span>
          <span className="text-2xl text-gray-400">/4</span>
        </div>
        <div className="mt-3 mx-auto h-3 w-64 rounded-full bg-gray-700">
          <div
            className={`h-3 rounded-full ${scoreColor(report.overallScore)}`}
            style={{ width: `${(report.overallScore / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Rubric Scores */}
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3">
          Rubric Breakdown
        </h3>
        {report.rubricScores.map((item) => (
          <RubricRow key={item.dimension} item={item} />
        ))}
      </div>

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            ✅ Strengths
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {report.gaps.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            ⚠️ Gaps
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            {report.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Human Review Flag */}
      {report.needsHumanReview && (
        <div className="rounded-lg bg-yellow-900/30 border border-yellow-700 p-3 text-center text-yellow-300 text-sm">
          🔍 This interview has been flagged for human review.
        </div>
      )}
    </div>
  );
};
