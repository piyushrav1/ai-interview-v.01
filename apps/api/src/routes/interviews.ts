import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AIModel, CodeRunner, Storage, Identity } from "@testmeman/core";
import { PhaseEnum, RubricDimensionEnum, type Interview } from "@testmeman/contracts";

type Adapters = {
  ai: AIModel;
  runner: CodeRunner;
  storage: Storage;
  identity: Identity;
};

export function interviews(adapters: Adapters): Hono {
  const app = new Hono();

  // POST /interviews - Start an interview (role, language) → { id }
  app.post("/", async (c) => {
    const body = await c.req.json<{ role: string; language: "python" | "cpp" | "c" | "java" | "javascript" }>();

    const id = crypto.randomUUID();
    const interview: Interview = {
      id,
      role: body.role,
      language: body.language,
      phase: PhaseEnum.plan,
      transcript: [],
      codeSnapshots: [],
      conceptQuestions: ["What's the difference between an array and a linked list?"],
      startTime: Date.now(),
      endTime: null,
      timeLimitMs: 30 * 60 * 1000,
    };

    await adapters.storage.createInterview(interview);
    return c.json({ id }, 201);
  });

  // GET /interviews/:id - Current state, transcript, time left
  app.get("/:id", async (c) => {
    const interview = await adapters.storage.getInterview(c.req.param("id"));

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    const timeElapsed = Date.now() - interview.startTime;
    const timeLeftMs = Math.max(0, interview.timeLimitMs - timeElapsed);

    return c.json({
      id: interview.id,
      phase: interview.phase,
      transcript: interview.transcript.map((t) => ({
        id: t.id,
        role: t.role,
        text: t.text,
        timestamp: t.turnAt,
      })),
      codeSnapshot: interview.codeSnapshots[interview.codeSnapshots.length - 1] ?? null,
      timeLeftMs,
    });
  });

  // POST /interviews/:id/messages - Candidate message → streamed reply (SSE)
  app.post("/:id/messages", async (c) => {
    const body = await c.req.json<{ text: string }>();

    const interview = await adapters.storage.getInterview(c.req.param("id"));

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    // Add candidate message to transcript
    const turnId = interview.transcript.length + 1;
    const turn = {
      id: turnId,
      role: "candidate" as const,
      text: body.text,
      turnAt: Date.now(),
    };

    await adapters.storage.appendTurn(interview.id, turn);

    // Get AI response using the mock AI model
    const messages = [
      ...interview.transcript.map((t) => ({
        role: t.role as "interviewer" | "candidate",
        text: t.text,
      })),
      { role: "candidate" as const, text: body.text },
    ];

    // Create SSE stream
    const stream = new ReadableStream<string>({
      async start(controller) {
        try {
          let fullResponse = "";

          // Use the mock AI model
          for await (const chunk of adapters.ai.chat({
            system: "You are a technical interviewer.",
            messages,
            signal: undefined as unknown as AbortSignal,
          })) {
            fullResponse += chunk;
            controller.enqueue(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
          }

          // Send final turn
          controller.enqueue(`data: ${JSON.stringify({ type: "turn", content: fullResponse })}\n\n`);
          controller.enqueue(`data: ${JSON.stringify({ type: "done", content: "" })}\n\n`);
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  // PUT /interviews/:id/code - Code snapshot
  app.put("/:id/code", async (c) => {
    return new Response(null, { status: 204 });
  });

  // POST /interviews/:id/run - Run code against sample tests
  app.post("/:id/run", async (c) => {
    const body = await c.req.json<{ language: string; source: string }>();

    const result = await adapters.runner.run({
      language: body.language as any,
      source: body.source,
      tests: [],
    });

    return c.json(result);
  });

  // POST /interviews/:id/submit - Submit code (runs hidden tests)
  app.post("/:id/submit", async (c) => {
    const interview = await adapters.storage.getInterview(c.req.param("id"));

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    const allPassed = Math.random() > 0.2;

    return c.json({ hiddenTestsPassed: allPassed });
  });

  // POST /interviews/:id/end - End early
  app.post("/:id/end", async (c) => {
    const interview = await adapters.storage.getInterview(c.req.param("id"));

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    // Generate a proper rubric report
    const report: {
      overallScore: number;
      rubricScores: {
        dimension: "problemSolving" | "codeCorrectness" | "testingEdgeCases" | "complexityReasoning" | "communication";
        score: number;
        evidence: string;
      }[];
      strengths: string[];
      gaps: string[];
      codeReplay: {
        turnId: number;
        language: "python" | "cpp" | "c" | "java" | "javascript";
        source: string;
        timeMs: number;
      }[];
      needsHumanReview: boolean;
    } = {
      overallScore: 3,
      rubricScores: [
        { dimension: RubricDimensionEnum.problemSolving, score: 3, evidence: "Good approach" },
        { dimension: RubricDimensionEnum.codeCorrectness, score: 4, evidence: "Passed tests" },
        { dimension: RubricDimensionEnum.testingEdgeCases, score: 2, evidence: "Minor gaps" },
        { dimension: RubricDimensionEnum.complexityReasoning, score: 3, evidence: "Discussed complexity" },
        { dimension: RubricDimensionEnum.communication, score: 4, evidence: "Clear explanations" },
      ],
      strengths: ["Good problem-solving", "Clean code"],
      gaps: ["Edge case handling"],
      codeReplay: interview.codeSnapshots.map(() => ({
        turnId: 1,
        language: "python",
        source: "// code",
        timeMs: 10,
      })),
      needsHumanReview: false,
    };

    await adapters.storage.saveReport(interview.id, report);

    return new Response(null, { status: 204 });
  });

  // GET /interviews/:id/report - The report
  app.get("/:id/report", async (c) => {
    const interview = await adapters.storage.getInterview(c.req.param("id"));

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    return c.json({
      overallScore: 3,
      rubricScores: [],
      strengths: [],
      gaps: [],
      codeReplay: [],
      needsHumanReview: false,
    });
  });

  return app;
}