import type { AIModel, Interview, Turn, Phase, Language } from "@testmeman/core";
import { PhaseEnum, TurnRoleEnum } from "@testmeman/contracts";
import { z } from "zod";
import type { EvaluatorOutput } from "../../src/prompts/v1/evaluator.js";

/**
 * Fake AI model for development and testing.
 * Returns scripted responses matching expected LLM behavior per phase.
 */
export class FakeModel implements AIModel {
  private currentPhase: Phase = PhaseEnum.plan;
  private conversation = "";
  private turnCount = 0;

  async *chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    this.conversation = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
    this.turnCount++;

    const phase = this.determinePhaseFromContext(input.messages);
    this.currentPhase = phase;

    let response = "";
    switch (phase) {
      case PhaseEnum.intro:
        response = this.getIntroResponse();
        break;
      case PhaseEnum.problem:
        response = await this.getProblemResponse(input.messages);
        break;
      case PhaseEnum.coding:
        response = this.getCodingResponse(input.messages);
        break;
      case PhaseEnum.followUps:
        response = this.getFollowUpResponse(input.messages);
        break;
      case PhaseEnum.concepts:
        response = this.getConceptResponse(input.messages);
        break;
      case PhaseEnum.wrapUp:
        response = this.getWrapUpResponse();
        break;
      default:
        response = "I'm still planning your interview...";
    }

    // Yield word by word for streaming simulation
    for (let i = 0; i < response.length; i += 20) {
      if (input.signal?.aborted) break;
      yield response.slice(i, i + 20);
    }
  }

  async structured<T>(params: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T> {
    if (params.schema.description?.includes("Evaluator")) {
      // Return mock evaluator output
      return {
        overallScore: 3,
        rubricScores: [
          { dimension: "problemSolving", score: 3, evidence: "Candidate explained their approach clearly." },
          { dimension: "codeCorrectness", score: 4, evidence: "Solution passes all tests." },
          { dimension: "testingEdgeCases", score: 2, evidence: "Did not consider empty input case." },
          { dimension: "complexityReasoning", score: 3, evidence: "Discussed O(n) complexity." },
          { dimension: "communication", score: 4, evidence: "Clear explanations throughout." },
        ],
        strengths: ["Good problem-solving approach", "Clean code style"],
        gaps: ["Could optimize for edge cases", "Considered space complexity"],
        needsHumanReview: false,
      } as T;
    }

    // Default mock response
    return {} as T;
  }

  private determinePhaseFromContext(messages: { role: "interviewer" | "candidate"; text: string }[]): Phase {
    if (messages.length < 2) return this.currentPhase;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "candidate" && lastMessage.text.toLowerCase().includes("i'm ready")) {
      return PhaseEnum.problem;
    }
    if (this.turnCount > 5) return PhaseEnum.coding;
    return this.currentPhase;
  }

  private getIntroResponse(): string {
    return `Hello! I'm your interviewer for this technical interview.

Here's how this interview will go:
1. I'll present a coding problem
2. You'll code in the editor
3. I'll ask follow-up questions about your solution
4. Then 3 short concept questions
5. Finally, we wrap up and you get a report

The interview is 30 minutes total. Ready to begin?`;
  }

  private async getProblemResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): Promise<string> {
    const problemMessages = messages.filter((m) => m.role === "candidate");
    if (problemMessages.length > 0) {
      return `I've presented the problem. You can now start coding in your preferred language.
Type '/run' when you want to test your solution against the sample tests.`;
    }
    return `Let me present the coding problem...`;
  }

  private getCodingResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    const candidateMessage = messages.find((m) => m.role === "candidate");
    if (candidateMessage?.text.includes("done") || candidateMessage?.text.includes("/submit")) {
      return `I see your solution is complete. Let me run the hidden tests to verify.`;
    }
    if (candidateMessage?.text.includes("help") || candidateMessage?.text.includes("stuck")) {
      return `Sure, what part are you working on? Remember, try to think through it first.`;
    }
    return `Keep coding! Type '/run' to test against sample inputs.`;
  }

  private getFollowUpResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    const candidateMessage = messages.find((m) => m.role === "candidate");
    if (candidateMessage?.text.toLowerCase().includes("time complexity")) {
      return `Good question! My approach is O(n) time and O(1) space because...`;
    }
    return `Let me ask you about your solution. Why did you choose this data structure?`;
  }

  private getConceptResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    return `Quick concept question: What's the difference between a class and an object in OOP?`;
  }

  private getWrapUpResponse(): string {
    return `Thanks for your time! The interview is now complete. I'll run the evaluator to generate your report.`;
  }
}