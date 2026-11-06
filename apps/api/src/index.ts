import { Hono } from "hono";
import { cors } from "hono/cors";
import { interviews } from "./routes/interviews.js";
import { createDevAdapters } from "./adapters/dev.js";
import { GeminiModel } from "./adapters/gemini.js";
import { Judge0Runner, FallbackCodeRunner } from "./adapters/judge0.js";
import type { AIModel, CodeRunner, Storage, Identity } from "@testmeman/core";
import { getProblem, listProblems } from "@testmeman/core";

export interface Env {
  DATABASE_URL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL_INTERVIEWER?: string;
  GEMINI_MODEL_EVALUATOR?: string;
  CODE_RUNNER?: "mock" | "judge0";
  JUDGE0_URL?: string;
  JUDGE0_KEY?: string;
  JUDGE0_HOST?: string;
}

export type ExecutionContext = {
  waitUntil: (promise: Promise<void>) => void;
  passThroughOnException: () => void;
  props: Record<string, unknown>;
};

/**
 * Build adapters from the Cloudflare Workers env object.
 * If GEMINI_API_KEY is available, use the real GeminiModel; otherwise fall back to MockAIModel.
 * If Judge0 configuration is present, use Judge0 with fallback to dev runner.
 */
function createAdaptersFromEnv(env: Env): {
  ai: AIModel;
  runner: CodeRunner;
  storage: Storage;
  identity: Identity;
} {
  const apiKey =
    env?.GEMINI_API_KEY ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined);
  const modelName =
    env?.GEMINI_MODEL_INTERVIEWER ||
    (typeof process !== "undefined" ? process.env?.GEMINI_MODEL_INTERVIEWER : undefined) ||
    "gemini-3.1-flash-lite";

  const judge0Url =
    env?.JUDGE0_URL ||
    (typeof process !== "undefined" ? process.env?.JUDGE0_URL : undefined);
  const judge0Key =
    env?.JUDGE0_KEY ||
    (typeof process !== "undefined" ? process.env?.JUDGE0_KEY : undefined);
  const judge0Host =
    env?.JUDGE0_HOST ||
    (typeof process !== "undefined" ? process.env?.JUDGE0_HOST : undefined);

  const devAdapters = createDevAdapters();

  // Use real Gemini model if API key is present, otherwise mock
  const ai: AIModel = apiKey
    ? new GeminiModel({
        apiKey,
        modelName,
      })
    : devAdapters.ai;

  // Use Judge0 runner (with automatic fallback to mock runner if it fails)
  const runner: CodeRunner =
    judge0Url || judge0Key || env?.CODE_RUNNER === "judge0"
      ? new FallbackCodeRunner(
          new Judge0Runner({
            baseUrl: judge0Url,
            apiKey: judge0Key,
            rapidApiHost: judge0Host,
          }),
          devAdapters.runner
        )
      : devAdapters.runner;

  return {
    ai,
    runner,
    storage: devAdapters.storage,
    identity: devAdapters.identity,
  };
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response {
    const adapters = createAdaptersFromEnv(env);

    const app = new Hono();
    app.use("/*", cors());
    app.route("/interviews", interviews(adapters));
    app.get("/problems", (c) => c.json(listProblems()));
    app.get("/problems/:slug", (c) => c.json(getProblem(c.req.param("slug"))));
    app.get("/health", (c) => c.json({ ok: true }));
    app.get("/favicon.ico", (c) => c.body(null, 204));

    return app.fetch(request, env, ctx) as unknown as Response;
  },
};
