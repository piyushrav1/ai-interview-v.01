import type { CodeRunner } from "@testmeman/core";
import { wrapCodeWithHarness } from "./harness.js";

export interface Judge0Options {
  baseUrl?: string | undefined;
  apiKey?: string | undefined;
  rapidApiHost?: string | undefined;
}

interface Judge0SubmissionResponse {
  token: string;
}

interface Judge0Status {
  id: number;
  description: string;
}

interface Judge0SubmissionResult {
  token: string;
  status_id: number;
  status?: Judge0Status | undefined;
  stdout?: string | null | undefined;
  stderr?: string | null | undefined;
  compile_output?: string | null | undefined;
  time?: string | null | undefined;
  memory?: number | null | undefined;
}

const LANGUAGE_MAP: Record<"python" | "cpp" | "c" | "java" | "javascript", number> = {
  python: 71, // Python 3.8.1
  cpp: 54, // C++ GCC 9.2.0
  c: 50, // C GCC 9.2.0
  java: 62, // Java OpenJDK 13.0.1
  javascript: 63, // Node.js 12.14.0
};

/** Convert string to base64 using standard cross-platform encoding */
export function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/** Decode base64 string safely */
export function fromBase64(b64: string | null | undefined): string {
  if (!b64) return "";
  try {
    const binary = atob(b64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return b64;
  }
}

type CodeRunnerInput = Parameters<CodeRunner["run"]>[0];
type CodeRunnerOutput = Awaited<ReturnType<CodeRunner["run"]>>;

/**
 * Sandboxed code execution adapter communicating with Judge0 CE / RapidAPI.
 */
export class Judge0Runner implements CodeRunner {
  private baseUrl: string;
  private apiKey: string | undefined;
  private rapidApiHost: string | undefined;

  constructor(options?: Judge0Options | undefined) {
    this.baseUrl = (options?.baseUrl || "https://ce.judge0.com").replace(/\/$/, "");
    this.apiKey = options?.apiKey;
    this.rapidApiHost = options?.rapidApiHost;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.apiKey) {
      if (this.baseUrl.includes("rapidapi.com")) {
        headers["X-RapidAPI-Key"] = this.apiKey;
        headers["X-RapidAPI-Host"] =
          this.rapidApiHost || new URL(this.baseUrl).host;
      } else {
        headers["X-Auth-Token"] = this.apiKey;
      }
    }

    return headers;
  }

  async run(input: CodeRunnerInput): Promise<CodeRunnerOutput> {
    if (input.tests.length === 0) {
      return { results: [] };
    }

    const languageId = LANGUAGE_MAP[input.language] ?? 71;
    const cpuLimit = Math.max(1, (input.timeLimitMs || 2500) / 1000);
    const sourceCodeToRun = wrapCodeWithHarness(input.language, input.source);

    // Prepare batch submissions
    const submissions = input.tests.map((test) => ({
      language_id: languageId,
      source_code: toBase64(sourceCodeToRun),
      stdin: toBase64(test.input),
      expected_output: toBase64(test.expected),
      cpu_time_limit: cpuLimit,
    }));

    // Submit batch to Judge0
    const submitUrl = `${this.baseUrl}/submissions/batch?base64_encoded=true`;
    const postRes = await fetch(submitUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ submissions }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text().catch(() => "");
      throw new Error(`Judge0 submission failed [${postRes.status}]: ${errText}`);
    }

    const tokensData = (await postRes.json()) as Judge0SubmissionResponse[];
    const tokens = tokensData.map((t) => t.token);

    if (tokens.length === 0) {
      return { results: [] };
    }

    // Poll for completion
    const resultsMap = await this.pollSubmissions(tokens);

    // Check if any test caused compilation error
    for (const token of tokens) {
      const sub = resultsMap.get(token);
      if (sub && sub.status_id === 6) {
        const compileOut = fromBase64(sub.compile_output || sub.stderr);
        return {
          results: [],
          compileError: compileOut || "Compilation Error",
        };
      }
    }

    // Build per-test results
    const results = input.tests.map((test, index) => {
      const token = tokens[index];
      const sub = token ? resultsMap.get(token) : undefined;

      if (!sub) {
        return {
          passed: false,
          stdout: "",
          stderr: "Judge0 result missing",
          timeMs: 0,
          hidden: test.hidden,
        };
      }

      const stdout = fromBase64(sub.stdout);
      let stderr = fromBase64(sub.stderr);
      const timeMs = Math.round(parseFloat(sub.time || "0") * 1000);

      // Status 3 = Accepted
      let passed = sub.status_id === 3;

      // Handle output comparison if status wasn't directly marked 3
      if (!passed) {
        const cleanActual = stdout.trim().toLowerCase();
        const cleanExpected = test.expected.trim().toLowerCase();
        if (cleanActual === cleanExpected) {
          passed = true;
        } else {
          // Normalize formatting differences (brackets, spaces)
          const normActual = cleanActual.replace(/\s+/g, "").replace(/^[\[\(]/, "").replace(/[\]\)]$/, "");
          const normExpected = cleanExpected.replace(/\s+/g, "").replace(/^[\[\(]/, "").replace(/[\]\)]$/, "");
          if (normActual === normExpected && normActual.length > 0) {
            passed = true;
          }
        }
      }

      // Time Limit Exceeded (Status 5)
      if (sub.status_id === 5) {
        stderr = stderr || "Time Limit Exceeded";
        passed = false;
      } else if (sub.status_id >= 7) {
        // Runtime Errors
        stderr = stderr || sub.status?.description || "Runtime Error";
        passed = false;
      }

      return {
        passed,
        stdout,
        stderr,
        timeMs,
        hidden: test.hidden,
        input: test.input,
        expected: test.expected,
      };
    });

    return { results };
  }

  private async pollSubmissions(
    tokens: string[]
  ): Promise<Map<string, Judge0SubmissionResult>> {
    const tokenQuery = tokens.join(",");
    const pollUrl = `${this.baseUrl}/submissions/batch?tokens=${encodeURIComponent(
      tokenQuery
    )}&base64_encoded=true&fields=token,status_id,status,stdout,stderr,compile_output,time,memory`;

    const maxWaitMs = 12000;
    const intervalMs = 400;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const getRes = await fetch(pollUrl, {
        headers: this.getHeaders(),
      });

      if (!getRes.ok) {
        const text = await getRes.text().catch(() => "");
        throw new Error(`Judge0 poll failed [${getRes.status}]: ${text}`);
      }

      const data = (await getRes.json()) as {
        submissions: Judge0SubmissionResult[];
      };
      const submissions = data.submissions || [];

      // Check if all are finished (status_id > 2)
      const allDone = submissions.every(
        (s) => s.status_id && s.status_id > 2
      );

      if (allDone) {
        const map = new Map<string, Judge0SubmissionResult>();
        for (const s of submissions) {
          map.set(s.token, s);
        }
        return map;
      }

      // Wait interval
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    // Fallback: Return whatever we have at timeout
    const timeoutRes = await fetch(pollUrl, { headers: this.getHeaders() });
    const fallbackData = (await timeoutRes.json().catch(() => ({}))) as {
      submissions?: Judge0SubmissionResult[];
    };
    const map = new Map<string, Judge0SubmissionResult>();
    for (const s of fallbackData.submissions || []) {
      map.set(s.token, s);
    }
    return map;
  }
}

/**
 * Fallback runner that executes with primary runner and smoothly
 * degrades to backup runner on failure or timeout.
 */
export class FallbackCodeRunner implements CodeRunner {
  constructor(
    private primary: CodeRunner,
    private fallback: CodeRunner
  ) {}

  async run(input: CodeRunnerInput): Promise<CodeRunnerOutput> {
    try {
      return await this.primary.run(input);
    } catch (err) {
      console.warn("Primary CodeRunner failed, using fallback:", err);
      return await this.fallback.run(input);
    }
  }
}
