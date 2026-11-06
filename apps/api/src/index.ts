import { Hono } from "hono";
import { cors } from "hono/cors";
import { interviews } from "./routes/interviews.js";
import { createDevAdapters } from "./adapters/dev.js";

export interface Env {
  DATABASE_URL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL_INTERVIEWER?: string;
  GEMINI_MODEL_EVALUATOR?: string;
  CODE_RUNNER: "mock" | "judge0";
  JUDGE0_URL?: string;
  JUDGE0_KEY?: string;
}

export type ExecutionContext = {
  waitUntil: (promise: Promise<void>) => void;
  passThroughOnException: () => void;
  props: Record<string, unknown>;
};

// Create adapters for this environment
const adapters = createDevAdapters();

const app = new Hono();
app.use("/interviews/*", cors());
app.route("/interviews", interviews(adapters));
app.get("/health", (c) => c.json({ ok: true }));

export default {
  fetch(request: Request, _env: Env, _ctx: ExecutionContext): Response {
    return app.fetch(request) as Response;
  },
};