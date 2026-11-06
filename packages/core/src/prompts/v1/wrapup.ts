import { TurnRoleEnum } from "@testmeman/contracts";

/** Build wrap-up prompt. */
export function buildWrapUpPrompt(params: { startTime: number }): { system: string; messages: { role: "interviewer" | "candidate"; text: string; turnAt?: number }[] } {
  const system = `You are wrapping up an interview. Thank the candidate and explain what happens next.` as const;

  const message = `Thanks for your time today!

That's the end of our interview. Here's what happens next:
1. The evaluator will score your performance
2. You'll receive a report with strengths, gaps, and an overall score
3. If you'd like to retake, you can

Good luck with your job search!` as const;

  return {
    system,
    messages: [
      {
        role: TurnRoleEnum.interviewer,
        text: message,
        turnAt: params.startTime,
      },
    ],
  };
}