import type { CodeRunner } from "../../src/adapters.js";

/** Mock code runner for development. Never actually executes code. */
export const mockRunner: CodeRunner = {
  async run() {
    return {
      results: [
        { passed: true, stdout: "", stderr: "", timeMs: 1, hidden: false },
        { passed: true, stdout: "", stderr: "", timeMs: 1, hidden: true },
      ],
    };
  },
};