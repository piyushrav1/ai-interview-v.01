import type { AIModel } from "@testmeman/core";

/**
 * Mock AI model for development/testing.
 * Returns scripted responses for deterministic tests.
 */
export class MockAIModel implements AIModel {
  async *chat() {
    yield "Mock interviewer response";
  }

  async structured<T>(_params: { system: string; prompt: string; schema: import("zod").ZodType<T>; temperature?: number }): Promise<T> {
    return {} as T;
  }
}