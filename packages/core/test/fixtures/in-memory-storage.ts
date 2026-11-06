import type { Storage, Interview, Turn, CodeSnapshot, Report } from "@testmeman/contracts";

/**
 * In-memory Storage implementation for tests.
 * Stores data in plain objects, not persisted.
 */
export function createInMemoryStorage(): Storage {
  const interviews = new Map<string, Interview>();

  return {
    async createInterview(i: Interview) {
      interviews.set(i.id, i);
    },

    async getInterview(id: string) {
      return interviews.get(id) ?? null;
    },

    async appendTurn(id: string, turn: Turn) {
      const interview = interviews.get(id);
      if (!interview) throw new Error("Interview not found");
      interview.transcript.push(turn);
    },

    async saveCodeSnapshot(_id: string, _snap: CodeSnapshot) {
      // no-op for tests
    },

    async saveReport(_id: string, _report: Report) {
      // no-op for tests
    },
  };
}