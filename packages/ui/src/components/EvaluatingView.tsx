import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";

const EVALUATION_STEPS = [
  { label: "Redacting Candidate PII & Sanitizing Transcript", detail: "Email, phone, and entity masking applied" },
  { label: "Validating Code Correctness & Test Results", detail: "Evaluating sample & hidden test execution telemetry" },
  { label: "Executing Dual Rubric Evaluation Run (T <= 0.2)", detail: "Independent scoring of 5 technical dimensions" },
  { label: "Analyzing Consistency & Verification Bounds", detail: "Checking |Score1 - Score2| <= 1 discrepancy thresholds" },
  { label: "Finalizing Comprehensive Scorecard & Evidence", detail: "Compiling actionable strengths, gaps, and code scrubber" },
];

export function EvaluatingView() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev <= EVALUATION_STEPS.length ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 p-6 text-gray-100">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-4 animate-pulse">
            <BrainCircuit size={32} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Generating Technical Evaluation
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Our multi-agent evaluator is rigorously analyzing your interview session against standardized rubrics.
          </p>
        </div>

        <div className="space-y-4">
          {EVALUATION_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                  isCurrent
                    ? "border-blue-500/60 bg-blue-950/30 ring-1 ring-blue-500/20"
                    : isCompleted
                      ? "border-emerald-500/30 bg-emerald-950/10 text-gray-300"
                      : "border-gray-800/60 bg-gray-950/40 text-gray-500"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 size={13} />
                    </span>
                  ) : isCurrent ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      <Loader2 size={12} className="animate-spin" />
                    </span>
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-gray-500 text-xs font-bold">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-blue-300"
                        : isCompleted
                          ? "text-gray-200"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {step.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-blue-400 font-medium">
            {activeStep >= EVALUATION_STEPS.length ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-emerald-300">Verification complete — rendering scorecard...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                <span>Double-run LLM verification in progress (temperature ≤ 0.2)...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
