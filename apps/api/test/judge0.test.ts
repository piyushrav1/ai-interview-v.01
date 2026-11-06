import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Judge0Runner,
  FallbackCodeRunner,
  toBase64,
  fromBase64,
} from "../src/adapters/judge0.js";
import type { CodeRunner } from "@testmeman/core";

describe("Judge0 Base64 Helpers", () => {
  it("encodes and decodes ascii strings", () => {
    const input = "print('hello world')";
    const encoded = toBase64(input);
    expect(encoded).toBe(btoa(input));
    expect(fromBase64(encoded)).toBe(input);
  });

  it("handles null or undefined safely", () => {
    expect(fromBase64(null)).toBe("");
    expect(fromBase64(undefined)).toBe("");
    expect(fromBase64("")).toBe("");
  });

  it("encodes and decodes unicode and multiline strings", () => {
    const input = "def solve():\n    return '🚀 success'\n";
    const encoded = toBase64(input);
    expect(fromBase64(encoded)).toBe(input);
  });
});

describe("Judge0Runner", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns empty results for empty test suite", async () => {
    const runner = new Judge0Runner();
    const res = await runner.run({
      language: "python",
      source: "print(1)",
      tests: [],
    });
    expect(res.results).toEqual([]);
    expect(res.compileError).toBeUndefined();
  });

  it("submits batch and polls for successful execution", async () => {
    const mockTokens = [{ token: "tok-1" }, { token: "tok-2" }];
    const mockPollResponse = {
      submissions: [
        {
          token: "tok-1",
          status_id: 3, // Accepted
          stdout: toBase64("0 1\n"),
          stderr: null,
          time: "0.024",
        },
        {
          token: "tok-2",
          status_id: 3, // Accepted
          stdout: toBase64("1 2\n"),
          stderr: null,
          time: "0.031",
        },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/submissions/batch?base64_encoded=true")) {
        return new Response(JSON.stringify(mockTokens), { status: 201 });
      }
      if (url.includes("/submissions/batch?tokens=")) {
        return new Response(JSON.stringify(mockPollResponse), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    const runner = new Judge0Runner({ baseUrl: "https://mock.judge0.com" });
    const output = await runner.run({
      language: "python",
      source: "def solve(): pass",
      tests: [
        { input: "4\n2 7 11 15\n9", expected: "0 1", hidden: false },
        { input: "3\n3 2 4\n6", expected: "1 2", hidden: true },
      ],
    });

    expect(output.compileError).toBeUndefined();
    expect(output.results).toHaveLength(2);
    expect(output.results[0]?.passed).toBe(true);
    expect(output.results[0]?.stdout).toBe("0 1\n");
    expect(output.results[0]?.timeMs).toBe(24);
    expect(output.results[0]?.hidden).toBe(false);

    expect(output.results[1]?.passed).toBe(true);
    expect(output.results[1]?.hidden).toBe(true);
  });

  it("surfaces compilation errors", async () => {
    const mockTokens = [{ token: "tok-compile-err" }];
    const mockPollResponse = {
      submissions: [
        {
          token: "tok-compile-err",
          status_id: 6, // Compilation Error
          compile_output: toBase64("SyntaxError: invalid syntax on line 3"),
          stdout: null,
          stderr: null,
        },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/submissions/batch?base64_encoded=true")) {
        return new Response(JSON.stringify(mockTokens), { status: 201 });
      }
      if (url.includes("/submissions/batch?tokens=")) {
        return new Response(JSON.stringify(mockPollResponse), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    const runner = new Judge0Runner();
    const output = await runner.run({
      language: "cpp",
      source: "int main() { broken }",
      tests: [{ input: "", expected: "0", hidden: false }],
    });

    expect(output.results).toEqual([]);
    expect(output.compileError).toContain("SyntaxError: invalid syntax on line 3");
  });

  it("handles Time Limit Exceeded (TLE) correctly", async () => {
    const mockTokens = [{ token: "tok-tle" }];
    const mockPollResponse = {
      submissions: [
        {
          token: "tok-tle",
          status_id: 5, // TLE
          stdout: null,
          stderr: null,
          time: "2.500",
        },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/submissions/batch?base64_encoded=true")) {
        return new Response(JSON.stringify(mockTokens), { status: 201 });
      }
      if (url.includes("/submissions/batch?tokens=")) {
        return new Response(JSON.stringify(mockPollResponse), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    const runner = new Judge0Runner();
    const output = await runner.run({
      language: "python",
      source: "while True: pass",
      tests: [{ input: "", expected: "0", hidden: false }],
    });

    expect(output.results).toHaveLength(1);
    expect(output.results[0]?.passed).toBe(false);
    expect(output.results[0]?.stderr).toBe("Time Limit Exceeded");
  });
});

describe("FallbackCodeRunner", () => {
  it("uses primary runner when primary succeeds", async () => {
    const primary: CodeRunner = {
      run: vi.fn().mockResolvedValue({
        results: [{ passed: true, stdout: "ok", stderr: "", timeMs: 10, hidden: false }],
      }),
    };
    const fallback: CodeRunner = {
      run: vi.fn(),
    };

    const runner = new FallbackCodeRunner(primary, fallback);
    const res = await runner.run({
      language: "python",
      source: "print('ok')",
      tests: [{ input: "", expected: "ok", hidden: false }],
    });

    expect(res.results[0]?.passed).toBe(true);
    expect(primary.run).toHaveBeenCalledTimes(1);
    expect(fallback.run).not.toHaveBeenCalled();
  });

  it("falls back when primary runner throws", async () => {
    const primary: CodeRunner = {
      run: vi.fn().mockRejectedValue(new Error("Judge0 rate limit 429")),
    };
    const fallback: CodeRunner = {
      run: vi.fn().mockResolvedValue({
        results: [{ passed: true, stdout: "fallback pass", stderr: "", timeMs: 5, hidden: false }],
      }),
    };

    const runner = new FallbackCodeRunner(primary, fallback);
    const res = await runner.run({
      language: "python",
      source: "print('ok')",
      tests: [{ input: "", expected: "ok", hidden: false }],
    });

    expect(res.results[0]?.stdout).toBe("fallback pass");
    expect(primary.run).toHaveBeenCalledTimes(1);
    expect(fallback.run).toHaveBeenCalledTimes(1);
  });
});

