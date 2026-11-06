import type { Phase } from "@testmeman/contracts";
import { ArrowRight, Sparkles, HelpCircle } from "lucide-react";

interface QuickActionBarProps {
  phase: Phase | "not-started";
  streaming: boolean;
  onSend: (text: string) => void;
  onEndInterview?: (() => void) | undefined;
}

export function QuickActionBar({ phase, streaming, onSend, onEndInterview }: QuickActionBarProps) {
  if (streaming || phase === "not-started" || phase === "evaluate" || phase === "done") {
    return null;
  }

  const getActionsForPhase = (p: Phase): { label: string; text: string; primary?: boolean; icon?: "sparkles" | "help"; isEndAction?: boolean }[] => {
    switch (p) {
      case "plan":
        return [
          { label: "Acknowledge plan & begin", text: "I have read and understood the plan. Let's begin the interview.", primary: true },
          { label: "Clarify 30-min time allocation", text: "Can you briefly explain how the 30-minute time allocation is tracked?" },
        ];
      case "intro":
        return [
          { label: "I am ready for the problem!", text: "I am ready for the problem!", primary: true },
          { label: "Check runtime environment", text: "What runtime environment or compiler version will my code be evaluated on?" },
        ];
      case "problem":
        return [
          { label: "I understand, start coding now", text: "I understand the problem statement and constraints. I will begin writing my solution in the editor.", primary: true },
          { label: "Clarify Example 1 walkthrough", text: "Could you walk through Example 1 in a bit more detail?" },
          { label: "Check boundary & input constraints", text: "Are there any specific constraints on maximum input size or negative numbers?" },
        ];
      case "coding":
        return [
          { label: "Request an approach hint", text: "Could you provide a small Socratic hint to help guide my approach?", icon: "help" },
          { label: "Review edge cases to test", text: "What edge cases should I consider before submitting my code?" },
          { label: "Analyze time complexity tradeoffs", text: "How can I improve the time or space complexity of my current code?", icon: "sparkles" },
        ];
      case "followUps":
        return [
          { label: "Time complexity: O(N) linear", text: "My solution runs in O(N) linear time because each element is visited a constant number of times." },
          { label: "Space complexity: O(1) auxiliary", text: "The auxiliary space complexity is O(1) constant space since I only maintain a few primitive pointers/variables." },
          { label: "Ready for next follow-up question", text: "I have explained my approach and complexity. Ready for the next question!" },
        ];
      case "concepts":
        return [
          { label: "Thinking through concept...", text: "Let me think through this concept for a moment..." },
          { label: "Ready for next concept question", text: "Ready for the next concept question!" },
        ];
      case "wrapUp":
        return [
          { label: "Generate Evaluation Report", text: "Thank you for the interview. I would like to view my evaluation report.", primary: true, icon: "sparkles", isEndAction: true },
          { label: "Thank interviewer & complete", text: "Thank you for conducting this interview. It was a great learning experience." },
        ];
      default:
        return [];
    }
  };

  const actions = getActionsForPhase(phase as Phase);
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-gray-900/50 border-t border-gray-800/60 no-scrollbar">
      <span className="shrink-0 text-xs text-gray-500 font-medium">Quick responses:</span>
      <div className="flex items-center gap-1.5 flex-nowrap">
        {actions.map((act, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (act.isEndAction && onEndInterview) {
                onEndInterview();
              } else {
                onSend(act.text);
              }
            }}
            className={`group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
              act.primary
                ? "bg-blue-600/90 hover:bg-blue-600 text-white shadow-sm hover:scale-[1.01] border border-blue-400/30"
                : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/60"
            }`}
          >
            {act.icon === "sparkles" && <Sparkles size={11} className="text-blue-300" />}
            {act.icon === "help" && <HelpCircle size={11} className="text-gray-400" />}
            <span>{act.label}</span>
            <ArrowRight size={11} className="opacity-60 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

