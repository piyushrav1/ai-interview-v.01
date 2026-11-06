import { useState, useEffect, type FC } from "react";
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

function formatTimeMs(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
  const [activeSnapIndex, setActiveSnapIndex] = useState(
    report.codeReplay && report.codeReplay.length > 0 ? report.codeReplay.length - 1 : 0
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || !report.codeReplay || report.codeReplay.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSnapIndex((prev) => {
        if (prev >= report.codeReplay.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, report.codeReplay]);

  const currentSnap = report.codeReplay?.[activeSnapIndex];

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

      {/* Code Evolution Timeline & Playback Scrubber (Phase 4 & 5) */}
      {report.codeReplay && report.codeReplay.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-200">
                🎞️ Code Evolution Timeline
              </h3>
              <p className="text-xs text-gray-400">
                Scrub through code revisions across the interview duration
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-medium text-white transition"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play Replay"}
              </button>
              <button
                type="button"
                disabled={activeSnapIndex === 0}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveSnapIndex((prev) => Math.max(0, prev - 1));
                }}
                className="rounded bg-gray-800 hover:bg-gray-700 px-2 py-1 text-xs text-gray-300 disabled:opacity-40 transition"
              >
                ◀
              </button>
              <span className="text-xs font-mono text-gray-300 px-1">
                {activeSnapIndex + 1} / {report.codeReplay.length}
              </span>
              <button
                type="button"
                disabled={activeSnapIndex === report.codeReplay.length - 1}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveSnapIndex((prev) => Math.min(report.codeReplay.length - 1, prev + 1));
                }}
                className="rounded bg-gray-800 hover:bg-gray-700 px-2 py-1 text-xs text-gray-300 disabled:opacity-40 transition"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={report.codeReplay.length - 1}
              value={activeSnapIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveSnapIndex(Number(e.target.value));
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>Start (00:00)</span>
              <span className="text-blue-400 font-mono font-medium">
                Timestamp: {formatTimeMs(currentSnap?.timeMs || 0)}
              </span>
              <span>
                Final: {formatTimeMs(report.codeReplay[report.codeReplay.length - 1]?.timeMs || 0)}
              </span>
            </div>
          </div>

          {/* Monospace Code Snapshot Viewer */}
          <div className="relative rounded-md border border-gray-800 bg-gray-900 overflow-hidden">
            <pre className="p-3 text-xs font-mono text-gray-200 max-h-60 overflow-y-auto overflow-x-auto whitespace-pre">
              <code>{currentSnap?.source || "(Empty snapshot)"}</code>
            </pre>
          </div>
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
