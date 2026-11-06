import type { AIModel, Phase } from "../../src/adapters.js";
import { PhaseEnum } from "@testmeman/contracts";
import { z } from "zod";

/**
 * Fake AI model for development and testing.
 * Returns scripted responses matching expected LLM behavior per phase.
 */
export class FakeModel implements AIModel {
  private currentPhase: Phase = PhaseEnum.plan;
  private turnCount = 0;

  async *chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    this.turnCount++;

    const phase = this.determinePhaseFromContext(input.messages);
    this.currentPhase = phase;

    let response = "";
    switch (phase) {
      case PhaseEnum.intro:
        response = this.getIntroResponse();
        break;
      case PhaseEnum.problem:
        response = this.getProblemResponse();
        break;
      case PhaseEnum.coding:
        response = this.getCodingResponse(input.messages);
        break;
      case PhaseEnum.followUps:
        response = this.getFollowUpResponse(input.messages);
        break;
      case PhaseEnum.concepts:
        response = this.getConceptResponse();
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

  async structured<T>(_params: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T> {
    // Return mock evaluator output
    return {
      overallScore: 3,
      rubricScores: [
        { dimension: "problemSolving", score: 3, evidence: "Candidate explained their approach." },
        { dimension: "codeCorrectness", score: 4, evidence: "Solution passes all tests." },
        { dimension: "testingEdgeCases", score: 2, evidence: "Missing edge case handling." },
        { dimension: "complexityReasoning", score: 3, evidence: "Discussed O(n) complexity." },
        { dimension: "communication", score: 4, evidence: "Clear explanations." },
      ],
      strengths: ["Good problem-solving", "Clean code"],
      gaps: ["Edge cases"],
      needsHumanReview: false,
    } as T;
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
    return `Hello! I'm your interviewer.

Here's how this interview will go:
1. I present a coding problem
2. You code in the editor
3. I ask follow-up questions
4. Then 3 concept questions
5. We wrap up with a report

Ready?`;
  }

  private getProblemResponse(): string {
    return `Here's your coding problem:

**Two Sum**
Given an array of integers and a target, return indices of two numbers that add up to the target.

Start coding. Type '/run' to test your solution.`;
  }

  private getCodingResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    const candidateMessage = messages.find((m) => m.role === "candidate");
    if (candidateMessage?.text.includes("done") || candidateMessage?.text.includes("/submit")) {
      return `I see your solution is complete. Running tests...`;
    }
    return `Keep coding! Type '/run' to test against sample inputs.`;
  }

  private getFollowUpResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    const candidateMessage = messages.find((m) => m.role === "candidate");
    if (candidateMessage?.text.toLowerCase().includes("time complexity")) {
      return `My approach is O(n) time - I use a hash map to store seen values.`;
    }
    return `Why did you choose this data structure? Can you discuss the time complexity?`;
  }

  private getConceptResponse(): string {
    return `Quick concept question: What's the difference between a class and an object in OOP?`;
  }

  private getWrapUpResponse(): string {
    return `Thanks for your time! Let me generate your report.`;
  }
}