import { PhaseEnum, type Phase, type Language } from "@testmeman/contracts";

/** All valid phases in order. */
const PHASE_ORDER: Phase[] = [
  PhaseEnum.plan,
  PhaseEnum.intro,
  PhaseEnum.problem,
  PhaseEnum.coding,
  PhaseEnum.followUps,
  PhaseEnum.concepts,
  PhaseEnum.wrapUp,
  PhaseEnum.evaluate,
];

/** Create a new interview in the 'plan' phase. */
export function createInterview(params: { role: string; language: Language; problemSlug?: string }): {
  id: string;
  phase: Phase;
  problemSlug: string;
} {
  return {
    id: crypto.randomUUID(),
    phase: PhaseEnum.plan,
    problemSlug: params.problemSlug ?? "valid-anagram",
  };
}

/** Advance to the next phase in the state machine. */
export function advancePhase(current: Phase): Phase {
  const currentIdx = PHASE_ORDER.indexOf(current);
  if (currentIdx < 0) {
    return PhaseEnum.done;
  }
  if (currentIdx >= PHASE_ORDER.length - 1) {
    return PhaseEnum.done;
  }
  return PHASE_ORDER[currentIdx + 1]!;
}

/** Check if interview is complete (evaluate or done phase). */
export function isInterviewComplete(phase: Phase): boolean {
  return phase === PhaseEnum.evaluate || phase === PhaseEnum.done;
}

/** Check if phase allows code submission (coding or followUps). */
export function isCodeSubmissionAllowed(phase: Phase): boolean {
  return phase === PhaseEnum.coding || phase === PhaseEnum.followUps;
}