import { useState, useEffect, type FC } from "react";
import type { Report, ScoreEvidence, Confidence } from "@testmeman/contracts";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  History,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Cpu,
  DollarSign,
} from "lucide-react";

export interface ReportViewProps {
  report: Report & {
    usage?: {
      totalTokens?: number;
      estimatedCostUsd?: number;
      callsCount?: number;
    };
  };
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

function confidenceBadge(conf: Confidence = "high"): { text: string; classes: string } {
  switch (conf) {
    case "high":
      return {
        text: "High Confidence",
        classes: "bg-emerald-950 text-emerald-300 border-emerald-800",
      };
    case "medium":
      return {
        text: "Medium Confidence",
        classes: "bg-amber-950 text-amber-300 border-amber-800",
      };
    case "low":
      return {
        text: "Low Confidence",
        classes: "bg-rose-950 text-rose-300 border-rose-800",
      };
  }
}

function formatTimeMs(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const RubricRow: FC<{ item: ScoreEvidence }> = ({ item }) => {
  const pct = (item.score / 4) * 100;
  const confBadge = confidenceBadge(item.confidence);

  return (
    <div className="mb-5 rounded-lg border border-gray-800 bg-gray-900/60 p-3.5 transition hover:border-gray-700">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-200">
            {dimensionLabels[item.dimension] ?? item.dimension}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${confBadge.classes}`}
          >
            {confBadge.text}
          </span>
        </div>
        <span className="text-sm font-bold text-gray-200">
          {item.score}/4
        </span>
      </div>

      {/* Score Progress Bar */}
      <div className="h-2 w-full rounded-full bg-gray-800">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${scoreColor(item.score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Verbatim Evidence Quote Box */}
      {item.evidence && (
        <div className="mt-2.5 rounded-r border-l-2 border-blue-500 bg-gray-950/80 px-3 py-1.5 text-xs text-gray-300">
          <span className="block text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-0.5">
            Verbatim Transcript / Code Evidence:
          </span>
          <span className="italic leading-relaxed text-gray-300">
            &ldquo;{item.evidence}&rdquo;
          </span>
        </div>
      )}
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
      {/* Prominent Human Review Flag Banner */}
      {report.needsHumanReview && (
        <div className="rounded-xl border border-amber-600/70 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 p-4 shadow-lg text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 tracking-wide uppercase text-xs rounded bg-amber-900/80 px-2 py-0.5 border border-amber-700">
                  Human Review Required
                </span>
                <span className="text-xs text-amber-400/80">Evaluator Flag</span>
              </div>
              <p className="text-sm font-medium text-amber-200">
                {report.humanReviewReason ||
                  "This interview has been flagged for human review due to evaluator run divergence or integrity alerts."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score Header */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold text-gray-100 mb-1">
          Technical Interview Report
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Independent dual-run rubric evaluation with quote evidence
        </p>

        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-6xl font-black ${overallColor(report.overallScore)}`}
          >
            {report.overallScore}
          </span>
          <span className="text-2xl text-gray-500 font-semibold">/4</span>
        </div>
        <div className="mt-3 mx-auto h-3 w-64 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${scoreColor(report.overallScore)}`}
            style={{ width: `${(report.overallScore / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Rubric Dimension Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-400" /> Rubric Dimensions
          </h3>
          <span className="text-xs text-gray-400">
            5 Core Evaluator Criteria
          </span>
        </div>
        {report.rubricScores.map((item) => (
          <RubricRow key={item.dimension} item={item} />
        ))}
      </div>

      {/* Strengths & Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {report.strengths.length > 0 && (
          <div className="rounded-lg border border-green-900/60 bg-green-950/20 p-4">
            <h3 className="text-base font-semibold text-green-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Candidate Strengths
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-300 text-sm">
              {report.strengths.map((s, i) => (
                <li key={i} className="leading-snug">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {report.gaps.length > 0 && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4">
            <h3 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-400" /> Areas for Growth / Gaps
            </h3>
            <ul className="space-y-1.5 text-gray-300 text-sm">
              {report.gaps.map((g, i) => {
                const isIntegrity = g.toLowerCase().includes("integrity");
                return (
                  <li
                    key={i}
                    className={`leading-snug flex items-start gap-2 ${
                      isIntegrity ? "font-semibold text-rose-300" : ""
                    }`}
                  >
                    <span className="text-xs text-red-400 mt-1">•</span>
                    <span>{g}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Code Evolution Timeline & Playback Scrubber */}
      {report.codeReplay && report.codeReplay.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-400" /> Code Evolution Timeline
              </h3>
              <p className="text-xs text-gray-400">
                Scrub through code revisions across the interview duration
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-xs font-medium text-white transition"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Play Replay
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={activeSnapIndex === 0}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveSnapIndex((prev) => Math.max(0, prev - 1));
                }}
                className="inline-flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 p-1 text-xs text-gray-300 disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
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
                className="inline-flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 p-1 text-xs text-gray-300 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
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

      {/* Token & Cost Accounting Ledger (README Rule 6) */}
      {report.usage && report.usage.totalTokens && (
        <div className="border-t border-gray-800 pt-3 flex items-center justify-between text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-gray-400" />
            <span><strong>Token Telemetry:</strong> {report.usage.totalTokens.toLocaleString()} tokens</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            <span><strong>Estimated Cost:</strong> ${report.usage.estimatedCostUsd ? report.usage.estimatedCostUsd.toFixed(6) : "0.000000"} USD</span>
          </span>
        </div>
      )}
    </div>
  );
};
