import type { AIModel, CodeRunner, Storage, Identity } from "@testmeman/core";
import { getProblem, PROBLEMS } from "@testmeman/core";
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
    const response = this.responseForPhase(input.phase, input.messages, input.system);

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
    system?: string,
  ): string {
    switch (phase) {
      case PhaseEnum.plan:
        return `### Technical Interview Roadmap & Plan\n\nWelcome to your technical assessment! Here is our 30-minute agenda:\n1. **Introduction (2 mins):** Quick greeting & expectations\n2. **Problem Presentation (3 mins):** Problem breakdown, examples, constraints\n3. **Live Coding (15 mins):** Writing and testing your solution\n4. **Follow-ups (4 mins):** Algorithmic complexity & edge cases\n5. **CS Fundamentals (4 mins):** Interactive MCQ & written concepts\n6. **Wrap-Up & Evaluation (2 mins):** Comprehensive scorecard\n\nClick **"I understand the plan, let's begin!"** below to proceed!`;

      case PhaseEnum.intro:
        return `Hello! I'm your AI technical interviewer for this session.\n\nWelcome! I'm excited to collaborate with you. In this session we will work through an algorithmic problem together, discuss your code and design choices, and touch on fundamental CS concepts.\n\nWhen you're ready to see the problem statement, click **"I am ready for the problem!"**!`;

      case PhaseEnum.problem: {
        let problem = getProblem();
        if (system) {
          const match = /presenting the coding problem "([^"]+)"/i.exec(system);
          if (match && match[1]) {
            const found = Object.values(PROBLEMS).find(
              (p) => p.title.toLowerCase() === match[1]?.toLowerCase()
            );
            if (found) problem = found;
          }
        }

        const langMatch = system ? /in (python|javascript|cpp|java|c)/i.exec(system) : null;
        const lang = (langMatch ? langMatch[1] : "python") as Language;
        const starterCode = problem.starterCode[lang] ?? problem.starterCode.python ?? "";

        const examples = problem.examples
          .map(
            (e, i) =>
              `**Example ${i + 1}:**\n* Input: \`${e.input}\`\n* Output: \`${e.output}\`${
                e.explanation ? `\n* Explanation: ${e.explanation}` : ""
              }`
          )
          .join("\n\n");

        return `### The Problem: ${problem.title} (${problem.difficulty.toUpperCase()})

${problem.statement}

${examples}

The starter code is ready in your code editor. Start coding when you're ready!

[STARTER_CODE]
${starterCode}
[/STARTER_CODE]`;
      }

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
        const conceptQuestionsAsked = messages.filter(
          (m) => m.role === "interviewer" && m.text.includes("### Concept Question")
        ).length;
        if (conceptQuestionsAsked === 0) {
          return `### Concept Question (MCQ): Data Structures

What is the worst-case time complexity of inserting an element into a Hash Table that resolves collisions using Separate Chaining?

[MCQ]
{"topic":"DSA","question":"What is the worst-case time complexity of inserting an element into a Hash Table that resolves collisions using Separate Chaining?","options":["A) O(1)","B) O(log N)","C) O(N)","D) O(N^2)"]}
[/MCQ]

*Select an option using the buttons below, or write your choice with a brief rationale.*`;
        } else if (conceptQuestionsAsked === 1) {
          return `### Concept Question (Written): Object-Oriented Programming

Can you briefly explain the difference between **Method Overloading** (Compile-time) and **Method Overriding** (Runtime) in Object-Oriented Programming?

*Please provide a concise 2–3 sentence explanation with examples.*`;
        } else {
          return `### Concept Question (MCQ): Operating Systems

What is the primary difference in resource sharing between Threads of the same process versus separate Processes?

[MCQ]
{"topic":"OS","question":"What is the primary difference in resource sharing between Threads of the same process versus separate Processes?","options":["A) Threads share the same address space and memory; processes have isolated memory.","B) Processes share heap memory; threads only share stack memory.","C) Threads cannot execute in parallel on multi-core CPUs.","D) Processes require no kernel scheduling overhead."]}
[/MCQ]

*Select an option using the buttons below, or write your choice with a brief rationale.*`;
        }
      }

      case PhaseEnum.wrapUp:
        return `Thank you for sharing your thoughts! That brings us to the end of all the interview questions.\n\nI'm now generating your performance report scored against our evaluation rubric. Please click "End & View Report" or wait a moment!`;

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

  async updatePhase(id: string, phase: Phase): Promise<void> {
    const interview = this.interviews.get(id);
    if (interview) {
      interview.phase = phase;
    }
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
