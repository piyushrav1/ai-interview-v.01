import type { ZodType } from "zod";
import type { Interview, Turn, CodeSnapshot, Report } from "@testmeman/contracts";

/**
 * Talks to an LLM.
 * Dev: Gemini. Tests: a scripted fake.
 */
export interface AIModel {
  /** Streams the interviewer's next reply word-by-word. */
  chat(input: {
    system: string;
    messages: { role: "interviewer" | "candidate"; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string>;

  /** Returns JSON that matches the given schema. */
  structured<T>(params: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    temperature?: number;
  }): Promise<T>;
}

/**
 * Runs candidate code.
 * Dev: mock. Later: Judge0.
 */
export interface CodeRunner {
  run(input: {
    language: "python" | "cpp" | "c" | "java" | "javascript";
    source: string;
    tests: { input: string; expected: string; hidden: boolean }[];
    timeLimitMs?: number;
  }): Promise<{
    results: { passed: boolean; stdout: string; stderr: string; timeMs: number; hidden: boolean }[];
    compileError?: string;
  }>;
}

/**
 * Saves interviews.
 * Dev: Postgres. Tests: in memory.
 */
export interface Storage {
  createInterview(i: Interview): Promise<void>;
  getInterview(id: string): Promise<Interview | null>;
  appendTurn(id: string, turn: Turn): Promise<void>;
  saveCodeSnapshot(id: string, snap: CodeSnapshot): Promise<void>;
  saveReport(id: string, report: Report): Promise<void>;
}

/**
 * Who the candidate is.
 * Dev: fake candidates. Later: the platform's sign-in.
 */
export interface Identity {
  /** Resolves a request's credentials to a candidate id, or null. */
  candidateFor(request: Request): Promise<{ candidateId: string } | null>;
}