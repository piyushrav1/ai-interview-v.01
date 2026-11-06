import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeTranscript,
  sanitizeCode,
} from "../../src/evaluator/sanitizer.js";

describe("Evaluator PII Sanitizer", () => {
  describe("Email Redaction", () => {
    it("redacts standard email addresses", () => {
      const input = "You can contact me at candidate@example.com for further questions.";
      const result = sanitizeText(input);
      expect(result).not.toContain("candidate@example.com");
      expect(result).toContain("[REDACTED_EMAIL]");
    });

    it("redacts complex and plus-aliased email addresses", () => {
      const input = "Reach out to john.doe+interview-test@subdomain.univ.edu or admin@tech.co.in";
      const result = sanitizeText(input);
      expect(result).not.toContain("john.doe+interview-test@subdomain.univ.edu");
      expect(result).not.toContain("admin@tech.co.in");
      expect(result).toBe("Reach out to [REDACTED_EMAIL] or [REDACTED_EMAIL]");
    });
  });

  describe("Phone Number Redaction", () => {
    it("redacts US and international phone formats", () => {
      const inputs = [
        "Call me at +1-800-555-0199 anytime.",
        "My cell is (555) 123-4567.",
        "Number: 555-555-5555.",
      ];
      for (const input of inputs) {
        const result = sanitizeText(input);
        expect(result).toContain("[REDACTED_PHONE]");
        expect(result).not.toMatch(/\d{3}[-.]\d{4}/);
      }
    });

    it("preserves regular algorithm numbers and constants in text", () => {
      const input = "The array has 1000 elements and max value is 999999.";
      const result = sanitizeText(input);
      expect(result).toBe("The array has 1000 elements and max value is 999999.");
    });
  });

  describe("College / University Redaction", () => {
    it("redacts top universities and colleges", () => {
      const inputs = [
        "I am currently studying at Stanford University.",
        "I recently graduated from Harvard University.",
        "I am a student at IIT Bombay in computer science.",
        "I studied at BITS Pilani.",
        "I did research at MIT.",
      ];

      for (const input of inputs) {
        const result = sanitizeText(input);
        expect(result).toContain("[REDACTED_COLLEGE]");
        expect(result).not.toContain("Stanford");
        expect(result).not.toContain("Harvard");
        expect(result).not.toContain("IIT Bombay");
        expect(result).not.toContain("BITS Pilani");
        expect(result).not.toContain("MIT");
      }
    });

    it("redacts generic university and college phrases", () => {
      const input = "I graduated from California Institute of Technology and ABC College of Engineering.";
      const result = sanitizeText(input);
      expect(result).not.toContain("California Institute of Technology");
      expect(result).not.toContain("ABC College of Engineering");
      expect(result).toContain("[REDACTED_COLLEGE]");
    });
  });

  describe("Name Intro Redaction", () => {
    it("redacts candidate self-introductions", () => {
      expect(sanitizeText("Hi, my name is Alice Smith.")).toContain("[REDACTED_NAME]");
      expect(sanitizeText("Hi, my name is Alice Smith.")).not.toContain("Alice Smith");

      expect(sanitizeText("Hello, I am Bob Johnson and I am ready.")).toContain("[REDACTED_NAME]");
      expect(sanitizeText("Hello, I am Bob Johnson and I am ready.")).not.toContain("Bob Johnson");
      // "ready" should be preserved!
      expect(sanitizeText("Hello, I am Bob Johnson and I am ready.")).toContain("ready");

      expect(sanitizeText("I'm Charlie and I will solve this.")).toContain("[REDACTED_NAME]");
      expect(sanitizeText("I'm Charlie and I will solve this.")).not.toContain("Charlie");
    });

    it("does not redact common phrases like 'I am ready' or 'I am coding'", () => {
      const inputs = [
        "I am ready to start.",
        "I am coding the solution now.",
        "I am done with the code.",
        "I am thinking about the edge cases.",
      ];
      for (const input of inputs) {
        expect(sanitizeText(input)).toBe(input);
      }
    });

    it("redacts explicitly provided candidateName option", () => {
      const input = "Piyush explained that the hashmap lookup is O(1). Piyush used two pointers.";
      const result = sanitizeText(input, { candidateName: "Piyush" });
      expect(result).not.toContain("Piyush");
      expect(result).toContain("[REDACTED_NAME]");
    });
  });

  describe("Code Comment Redaction", () => {
    it("redacts author and candidate annotations in code", () => {
      const code = `
// Author: Alice Wonder <alice@example.com>
// College: IIT Delhi
function twoSum(nums, target) {
  // Let's implement hash table
  return [];
}
      `.trim();

      const result = sanitizeCode(code);
      expect(result).not.toContain("Alice Wonder");
      expect(result).not.toContain("alice@example.com");
      expect(result).not.toContain("IIT Delhi");
      expect(result).toContain("[REDACTED_NAME]");
      expect(result).toContain("[REDACTED_EMAIL]");
      expect(result).toContain("[REDACTED_COLLEGE]");
    });
  });

  describe("Full Transcript Sanitization", () => {
    it("sanitizes an array of transcript turns", () => {
      const transcript = [
        { role: "interviewer", text: "Welcome! Tell me about yourself." },
        { role: "candidate", text: "Hi, I am John Doe from MIT. Contact me at john@mit.edu" },
        { role: "interviewer", text: "Great, let's look at the problem." },
        { role: "candidate", text: "I am ready. I'll use a hashmap." },
      ];

      const sanitized = sanitizeTranscript(transcript);
      expect(sanitized[1].text).not.toContain("John Doe");
      expect(sanitized[1].text).not.toContain("MIT");
      expect(sanitized[1].text).not.toContain("john@mit.edu");
      expect(sanitized[1].text).toContain("[REDACTED_NAME]");
      expect(sanitized[1].text).toContain("[REDACTED_COLLEGE]");
      expect(sanitized[1].text).toContain("[REDACTED_EMAIL]");

      // Preserves normal answers
      expect(sanitized[3].text).toBe("I am ready. I'll use a hashmap.");
    });
  });
});

