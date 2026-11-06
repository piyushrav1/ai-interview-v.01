import { Hono } from "hono";

// TODO (week 1, phase 4): wire all routes to core + dev adapters.
// These are minimal stubs returning correct shapes.

export function interviews(): Hono {
  const app = new Hono();

  // POST /interviews - Start an interview (role, language) → { id }
  app.post("/", (c) => {
    const id = crypto.randomUUID();
    return c.json({ id }, 201);
  });

  // GET /interviews/:id - Current state, transcript, time left
  app.get("/:id", (c) => {
    return c.json({
      id: c.req.param("id"),
      phase: "plan",
      transcript: [],
      codeSnapshot: null,
      timeLeftMs: 1800000,
    });
  });

  // POST /interviews/:id/messages - Candidate message → streamed reply (SSE)
  app.post("/:id/messages", (c) => {
    c.header("Content-Type", "text/event-stream");
    return c.text("data: {\"type\":\"done\",\"content\":\"stub\"}\n\n");
  });

  // PUT /interviews/:id/code - Code snapshot
  app.put("/:id/code", (c) => {
    return new Response(null, { status: 204 });
  });

  // POST /interviews/:id/run - Run code against sample tests
  app.post("/:id/run", (c) => {
    return c.json({ results: [] });
  });

  // POST /interviews/:id/submit - Submit code (runs hidden tests)
  app.post("/:id/submit", (c) => {
    return c.json({ hiddenTestsPassed: true });
  });

  // POST /interviews/:id/end - End early
  app.post("/:id/end", (c) => {
    return new Response(null, { status: 204 });
  });

  // GET /interviews/:id/report - The report
  app.get("/:id/report", (c) => {
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