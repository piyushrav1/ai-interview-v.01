import type { AIModel, CodeRunner, Storage, Identity } from "@testmeman/core";
import { z } from "zod";
import type { Language, Interview, Turn, CodeSnapshot, Report } from "@testmeman/contracts";

/** Mock AI model for development - returns scripted interview responses. */
export class MockAIModel implements AIModel {
  private turnIndex = 0;

  async *chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    const responses = this.generateMockResponse(input.messages);

    // Yield word by word to simulate streaming
    for (let i = 0; i < responses.length; i += 15) {
      if (input.signal?.aborted) break;
      yield responses.slice(i, i + 15);
    }
  }

  async structured<T>(params: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T> {
    // Generate a valid structured response matching the schema
    const mockEvaluatorOutput = {
      overallScore: 3,
      rubricScores: [
        { dimension: "problemSolving", score: 3, evidence: "Candidate explained approach clearly." },
        { dimension: "codeCorrectness", score: 4, evidence: "Solution passed tests." },
        { dimension: "testingEdgeCases", score: 2, evidence: "Edge case handling could improve." },
        { dimension: "complexityReasoning", score: 3, evidence: "Discussed algorithmic complexity." },
        { dimension: "communication", score: 4, evidence: "Clear explanations throughout." },
      ],
      strengths: ["Good problem-solving approach", "Clean coding style"],
      gaps: ["Could handle more edge cases"],
      needsHumanReview: false,
    };

    try {
      return params.schema.parse(mockEvaluatorOutput);
    } catch {
      return mockEvaluatorOutput as T;
    }
  }

  private generateMockResponse(messages: { role: "interviewer" | "candidate"; text: string }[]): string {
    const lastTurn = messages[messages.length - 1];

    if (lastTurn?.role === "candidate" && lastTurn.text.toLowerCase().includes("ready")) {
      return `Hello! I\'m your AI interviewer. We have 30 minutes today. Let\'s start with a coding problem...`;
    }

    if (messages.some((m) => m.role === "interviewer" && m.text.includes("problem"))) {
      return `Here\'s your problem:

**Two Sum**
Given an array of integers and a target, return indices of two numbers adding up to the target.

Start coding!`;
    }

    this.turnIndex++;
    if (this.turnIndex > 10) {
      return `That\'s enough for now. Time for a concept question: What\'s the difference between an array and a linked list?`;
    }

    return `Keep coding! Type '/run' to test your solution.`;
  }
}

/** Mock code runner - simulates runs without actual execution. */
export const mockRunner: CodeRunner = {
  async run(input: {
    language: Language;
    source: string;
    tests: { input: string; expected: string; hidden: boolean }[];
    timeLimitMs?: number;
  }) {
    // Simulate running against all tests
    const results = input.tests.map((test, i) => ({
      passed: !test.hidden && i < input.tests.filter((t) => !t.hidden).length,
      stdout: test.expected,
      stderr: "",
      timeMs: 10 + Math.random() * 50,
      hidden: test.hidden,
    }));

    // If there are hidden tests, simulate some failures
    const hiddenTests = results.filter((r) => r.hidden);
    if (hiddenTests.length > 0 && Math.random() > 0.3) {
      const firstHidden = hiddenTests[0];
      if (firstHidden) {
        firstHidden.passed = false;
        firstHidden.stderr = "Edge case: empty input";
      }
    }

    return { results };
  },
};

/** In-memory storage implementation for development/testing. */
class MemoryStorage implements Storage {
  private interviews = new Map<string, Interview>();

  async createInterview(i: Interview): Promise<void> {
    this.interviews.set(i.id, { ...i });
  }

  async getInterview(id: string): Promise<Interview | null> {
    return this.interviews.get(id) ?? null;
  }

  async appendTurn(id: string, turn: Turn): Promise<void> {
    const interview = this.interviews.get(id);
    if (interview) {
      interview.transcript = [...interview.transcript, turn];
    }
  }

  async saveCodeSnapshot(_id: string, _snap: CodeSnapshot): Promise<void> {
    // In-memory, no-op
  }

  async saveReport(id: string, report: Report): Promise<void> {
    const interview = this.interviews.get(id);
    if (interview) {
      // Would save in real implementation
    }
  }
}

export const devStorage = new MemoryStorage();

/** Fake identity for development. */
export const devIdentity: Identity = {
  async candidateFor() {
    return { candidateId: "dev-candidate" };
  },
};

/** Create all dev adapters. */
export function createDevAdapters(): { ai: AIModel; runner: CodeRunner; storage: Storage; identity: Identity } {
  return {
    ai: new MockAIModel(),
    runner: mockRunner,
    storage: devStorage,
    identity: devIdentity,
  };
}