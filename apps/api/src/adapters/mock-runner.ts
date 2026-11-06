import type { CodeRunner } from "@testmeman/core";

/** Mock code runner for development. Never actually executes code. */
export const mockRunner: CodeRunner = {
  async run() {
    return {
      results: [],
    };
  },
};