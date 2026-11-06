import { useState } from "react";
import { CheckCircle2, ArrowRight, Layers } from "lucide-react";

export interface MCQData {
  topic?: string;
  question?: string;
  options: string[];
}

interface InteractiveMCQProps {
  data: MCQData;
  onSelectOption?: ((answer: string) => void) | undefined;
  disabled?: boolean | undefined;
}

export function InteractiveMCQ({ data, onSelectOption, disabled = false }: InteractiveMCQProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [rationale, setRationale] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedIdx === null || !onSelectOption || disabled || submitted) return;
    const chosen = data.options[selectedIdx];
    if (!chosen) return;
    const finalAnswer = rationale.trim()
      ? `I select ${chosen} — Rationale: ${rationale.trim()}`
      : `I select ${chosen}`;
    setSubmitted(true);
    onSelectOption(finalAnswer);
  };

  return (
    <div className="my-3 rounded-xl border border-blue-500/30 bg-gray-900/90 p-4 shadow-lg backdrop-blur-sm">
      {data.topic && (
        <div className="mb-2.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30">
            <Layers size={11} />
            {data.topic}
          </span>
          <span className="text-xs text-gray-400">Multiple Choice Question</span>
        </div>
      )}

      {data.question && (
        <p className="mb-3 font-medium text-gray-100 text-sm leading-relaxed">
          {data.question}
        </p>
      )}

      <div className="space-y-2">
        {data.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const letter = opt.slice(0, 2); // e.g. "A)"
          const label = opt.slice(2).trim();

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || submitted}
              onClick={() => setSelectedIdx(idx)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-950/50 text-white ring-2 ring-blue-500/30 shadow-md"
                  : "border-gray-800 bg-gray-950/60 text-gray-300 hover:border-gray-700 hover:bg-gray-800/50"
              } ${disabled || submitted ? "cursor-default opacity-85" : "cursor-pointer"}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 group-hover:bg-gray-700"
                }`}
              >
                {letter.replace(")", "")}
              </span>
              <span className="flex-1 leading-snug">{label || opt}</span>
            </button>
          );
        })}
      </div>

      {!submitted && onSelectOption && (
        <div className="mt-3.5 pt-3 border-t border-gray-800/80">
          <div className="mb-2">
            <input
              type="text"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Optional: add 1-sentence rationale or explanation..."
              disabled={disabled || selectedIdx === null}
              className="w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-40"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={disabled || selectedIdx === null}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>Submit Answer</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <CheckCircle2 size={13} />
          <span>Answer submitted</span>
        </div>
      )}
    </div>
  );
}
