import type { AIModel, CodeRunner, Storage, Identity } from "@testmeman/core";
import { PhaseEnum } from "@testmeman/contracts";
import type { Phase, Language, Interview, Turn, CodeSnapshot, Report } from "@testmeman/contracts";
import { z } from "zod";

/** Mock AI model for development - returns scripted interview responses per phase. */
export class MockAIModel implements AIModel {
  async *chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    phase: Phase;
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    const response = this.responseForPhase(input.phase, input.messages);

    // Yield in chunks to simulate streaming
    for (let i = 0; i < response.length; i += 15) {
      if (input.signal?.aborted) break;
      yield response.slice(i, i + 15);
    }
  }

  async structured<T>(params: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T> {
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

  private responseForPhase(
    phase: Phase,
    messages: { role: "interviewer" | "candidate"; text: string }[],
  ): string {
    switch (phase) {
      case PhaseEnum.intro:
        return `Hello! I'm your AI interviewer. We have 30 minutes together.\n\nHere's how this interview works:\n1. I'll present a coding problem\n2. You'll code in the editor\n3. I'll ask follow-up questions\n4. Then 3 concept questions\n5. We wrap up and you get a report\n\nReady? Let's begin!`;

      case PhaseEnum.problem:
        return `### The Problem: Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

**Example 1:**
* Input: \`nums = [2, 7, 11, 15]\`, \`target = 9\`
* Output: \`[0, 1]\` (because \`nums[0] + nums[1] == 9\`)

**Example 2:**
* Input: \`nums = [3, 2, 4]\`, \`target = 6\`
* Output: \`[1, 2]\`

**Constraints:**
* \`2 <= len(nums) <= 10^4\`
* \`-10^9 <= nums[i] <= 10^9\`
* Only one valid answer exists.

The starter code is ready in your code editor. Start coding when you're ready!

[STARTER_CODE]
def two_sum(nums, target):
    # Write your solution here
    pass
[/STARTER_CODE]`;

      case PhaseEnum.coding: {
        const last = messages[messages.length - 1];
        if (last?.role === "candidate" && (last.text.includes("done") || last.text.includes("/submit"))) {
          return `I see your solution is complete. Let me run the tests...`;
        }
        return `Keep coding! Type '/run' to test your solution against sample inputs.`;
      }

      case PhaseEnum.followUps: {
        const candidateCount = messages.filter((m) => m.role === "candidate").length;
        if (candidateCount <= 5) {
          return `### Follow-Up: Time & Space Complexity\n\nGreat work getting tests to pass!\n\nCan you explain the **time and space complexity** of your approach? How would it scale if the input had \`10^6\` items?`;
        } else if (candidateCount <= 6) {
          return `### Follow-Up: Edge Case Analysis\n\nGood explanation! How does your solution handle critical edge cases?\n\n* What if the input array is empty?\n* What if there are duplicate elements or negative numbers?`;
        } else {
          return `### Follow-Up: Memory Optimization\n\nIf memory was extremely constrained (e.g. an embedded device with limited RAM), what algorithmic trade-offs would you make to reduce memory usage from \`O(N)\` to \`O(1)\`?`;
        }
      }

      case PhaseEnum.concepts: {
        const candidateCount = messages.filter((m) => m.role === "candidate").length;
        if (candidateCount <= 8) {
          return `### Concept Question: Data Structures\n\nWhat is the fundamental difference between an **Array** and a **Linked List** in terms of memory layout and access time (\`O(1)\` vs \`O(N)\`)?`;
        } else if (candidateCount <= 9) {
          return `### Concept Question: Object-Oriented Programming\n\nCan you briefly name and explain the **four core pillars** of OOP (**Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction**)?`;
        } else {
          return `### Concept Question: Database Systems\n\nWhat is a **database index**, and what are the trade-offs (query speed vs write performance) of adding indexes to a table?`;
        }
      }

      case PhaseEnum.wrapUp:
        return `Thank you for sharing your thoughts! 👋 That brings us to the end of all the interview questions.\n\nI'm now generating your performance report scored against our evaluation rubric. Please click "End & View Report" or wait a moment!`;

      case PhaseEnum.plan:
        return `I'm preparing your interview session...`;

      case PhaseEnum.evaluate:
      case PhaseEnum.done:
        return `Your interview is finished! You can view your full report by clicking the "End & View Report" button.`;

      default:
        return `Let's continue with the interview.`;
    }
  }
}

/** Mock code runner - evaluates candidate code in dev mode. */
export const mockRunner: CodeRunner = {
  async run(input: {
    language: Language;
    source: string;
    tests: { input: string; expected: string; hidden: boolean }[];
    timeLimitMs?: number;
  }) {
    const trimmed = input.source.trim();
    // Check if user has written an actual solution rather than empty / starter stub
    const isStarterOrEmpty =
      trimmed.length < 20 ||
      trimmed === "def main():\n    pass\n\nmain()" ||
      (trimmed.includes("pass") && !trimmed.includes("return") && !trimmed.includes("print")) ||
      trimmed === "// Write your code here" ||
      trimmed === "# Write your code here";

    const results = input.tests.map((test) => {
      const passed = !isStarterOrEmpty;
      return {
        passed,
        stdout: passed ? test.expected : "",
        stderr: passed ? "" : (test.hidden ? "Edge case failed" : "Assertion error: output did not match"),
        timeMs: Math.floor(12 + Math.random() * 35),
        hidden: test.hidden,
        input: test.input,
        expected: test.expected,
      };
    });

    return { results };
  },
};

/** In-memory storage implementation for development/testing. */
export class MemoryStorage implements Storage {
  private interviews = new Map<string, Interview>();
  private reports = new Map<string, Report>();

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

  async saveCodeSnapshot(id: string, snap: CodeSnapshot): Promise<void> {
    const interview = this.interviews.get(id);
    if (interview) {
      interview.codeSnapshots = [...interview.codeSnapshots, snap];
    }
  }

  async saveReport(id: string, report: Report): Promise<void> {
    this.reports.set(id, report);
  }

  getReport(id: string): Report | null {
    return this.reports.get(id) ?? null;
  }

  deleteInterview(id: string): boolean {
    this.reports.delete(id);
    return this.interviews.delete(id);
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
