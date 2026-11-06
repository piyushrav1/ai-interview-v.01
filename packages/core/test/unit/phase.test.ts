import { describe, it, expect } from "vitest";
import { PhaseEnum } from "@testmeman/contracts";
import {
  createInterview,
  advancePhase,
  isInterviewComplete,
  isCodeSubmissionAllowed,
} from "../../src/machine/index.js";

describe("phase machine", () => {
  describe("createInterview", () => {
    it("creates an interview in plan phase", () => {
      const result = createInterview({ role: "candidate", language: "python" });
      expect(result.phase).toBe(PhaseEnum.plan);
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe("advancePhase", () => {
    it("advances from plan to intro", () => {
      expect(advancePhase(PhaseEnum.plan)).toBe(PhaseEnum.intro);
    });

    it("advances from intro to problem", () => {
      expect(advancePhase(PhaseEnum.intro)).toBe(PhaseEnum.problem);
    });

    it("advances from problem to coding", () => {
      expect(advancePhase(PhaseEnum.problem)).toBe(PhaseEnum.coding);
    });

    it("advances from coding to followUps", () => {
      expect(advancePhase(PhaseEnum.coding)).toBe(PhaseEnum.followUps);
    });

    it("advances from followUps to concepts", () => {
      expect(advancePhase(PhaseEnum.followUps)).toBe(PhaseEnum.concepts);
    });

    it("advances from concepts to wrapUp", () => {
      expect(advancePhase(PhaseEnum.concepts)).toBe(PhaseEnum.wrapUp);
    });

    it("advances from wrapUp to evaluate", () => {
      expect(advancePhase(PhaseEnum.wrapUp)).toBe(PhaseEnum.evaluate);
    });

    it("advances from evaluate to done", () => {
      expect(advancePhase(PhaseEnum.evaluate)).toBe(PhaseEnum.done);
    });

    it("returns done from done phase (terminal)", () => {
      expect(advancePhase(PhaseEnum.done)).toBe(PhaseEnum.done);
    });
  });

  describe("isInterviewComplete", () => {
    it("returns true for evaluate phase", () => {
      expect(isInterviewComplete(PhaseEnum.evaluate)).toBe(true);
    });

    it("returns true for done phase", () => {
      expect(isInterviewComplete(PhaseEnum.done)).toBe(true);
    });

    it("returns false for other phases", () => {
      expect(isInterviewComplete(PhaseEnum.plan)).toBe(false);
      expect(isInterviewComplete(PhaseEnum.coding)).toBe(false);
    });
  });

  describe("isCodeSubmissionAllowed", () => {
    it("returns true for coding phase", () => {
      expect(isCodeSubmissionAllowed(PhaseEnum.coding)).toBe(true);
    });

    it("returns true for followUps phase", () => {
      expect(isCodeSubmissionAllowed(PhaseEnum.followUps)).toBe(true);
    });

    it("returns false for other phases", () => {
      expect(isCodeSubmissionAllowed(PhaseEnum.plan)).toBe(false);
      expect(isCodeSubmissionAllowed(PhaseEnum.problem)).toBe(false);
      expect(isCodeSubmissionAllowed(PhaseEnum.concepts)).toBe(false);
    });
  });
});