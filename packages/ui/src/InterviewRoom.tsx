import { useState, useEffect, useRef, useCallback } from "react";
import type { Phase, Language, Report } from "@testmeman/contracts";
import { CodeEditor } from "./components/CodeEditor.js";
import { Timer } from "./components/Timer.js";
import { ReportView } from "./components/ReportView.js";
import { MarkdownMessage } from "./components/MarkdownMessage.js";

interface TranscriptEntry {
  id: number;
  role: "interviewer" | "candidate";
  text: string;
}

const PHASE_LABELS: Record<Phase, string> = {
  plan: "📋 Planning",
  intro: "👋 Introduction",
  problem: "🧩 Problem Statement",
  coding: "💻 Coding",
  followUps: "❓ Follow-up Questions",
  concepts: "📚 Concept Questions",
  wrapUp: "🎁 Wrap Up",
  evaluate: "📊 Evaluating",
  done: "✅ Done",
};

const PHASE_ORDER: Phase[] = [
  "plan",
  "intro",
  "problem",
  "coding",
  "followUps",
  "concepts",
  "wrapUp",
  "evaluate",
  "done",
];

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="loading-dot h-2 w-2 rounded-full bg-blue-400 inline-block" />
      <span className="loading-dot h-2 w-2 rounded-full bg-blue-400 inline-block" />
      <span className="loading-dot h-2 w-2 rounded-full bg-blue-400 inline-block" />
    </span>
  );
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PHASE_ORDER.map((p, idx) => {
        const isCurrent = p === phase;
        const isPast = idx < currentIdx;
        return (
          <div key={p} className="flex items-center gap-1">
            {idx > 0 && (
              <div
                className={`h-0.5 w-4 ${
                  isPast ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            )}
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-blue-600 text-white"
                  : isPast
                    ? "bg-blue-900 text-blue-300"
                    : "bg-gray-800 text-gray-500"
              }`}
            >
              {PHASE_LABELS[p]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InterviewRoom() {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase | "not-started">("not-started");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [message, setMessage] = useState("");
  const [consented, setConsented] = useState(false);
  const [code, setCode] = useState(
    "# Write your code here\ndef main():\n    pass\n\nmain()",
  );
  const [language, setLanguage] = useState<Language>("python");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<
    {
      name: string;
      passed: boolean;
      stdout?: string;
      stderr?: string;
      timeMs?: number;
      hidden?: boolean;
      input?: string;
      expected?: string;
    }[] | null
  >(null);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [submissionSummary, setSubmissionSummary] = useState<{
    allPassed: boolean;
    message: string;
  } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [timeLimitMs, setTimeLimitMs] = useState(45 * 60 * 1000);
  const [role, setRole] = useState("Fresher Software Engineer");
  const [problemSlug, setProblemSlug] = useState("valid-anagram");
  const [problemData, setProblemData] = useState<{
    slug: string;
    title: string;
    difficulty: string;
    statement: string;
    starterCode?: Record<string, string>;
  } | null>(null);
  const [availableProblems, setAvailableProblems] = useState<
    Array<{ slug: string; title: string; difficulty: string }>
  >([]);
  const codeByLangRef = useRef<Record<string, string>>({});

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, streamText]);

  // Fetch available problems for the selector
  useEffect(() => {
    fetch("/problems")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableProblems(data);
        }
      })
      .catch((err) => console.error("Failed to load problems:", err));
  }, []);

  // Fetch active problem details and set starter code
  useEffect(() => {
    if (!problemSlug) return;
    fetch(`/problems/${problemSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.starterCode) {
          setProblemData(data);
          // Pre-populate starter codes for all 5 languages
          for (const [langKey, sc] of Object.entries(data.starterCode)) {
            if (!codeByLangRef.current[langKey]) {
              codeByLangRef.current[langKey] = sc as string;
            }
          }
          if (data.starterCode[language]) {
            setCode(data.starterCode[language]);
          }
        }
      })
      .catch((err) => console.error("Failed to load problem details:", err));
  }, [problemSlug]);

  const handleLanguageChange = (newLang: Language) => {
    // 1. Save current code for current language
    codeByLangRef.current[language] = code;
    setLanguage(newLang);

    // 2. Load code for new language
    const nextCode =
      codeByLangRef.current[newLang] ||
      problemData?.starterCode?.[newLang] ||
      "";
    setCode(nextCode);
    codeByLangRef.current[newLang] = nextCode;
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    codeByLangRef.current[language] = newCode;
  };

  const fetchState = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/interviews/${id}`);
      const data = await res.json();
      setPhase(data.phase as Phase);
      if (data.problemSlug) {
        setProblemSlug(data.problemSlug);
      }
      if (data.problem && data.problem.starterCode) {
        setProblemData(data.problem);
        for (const [langKey, sc] of Object.entries(data.problem.starterCode)) {
          if (!codeByLangRef.current[langKey]) {
            codeByLangRef.current[langKey] = sc as string;
          }
        }
      }
      setTranscript(data.transcript ?? []);
      if (data.codeSnapshot && data.codeSnapshot.source) {
        // Only set code if it matches current language or if nothing was edited for current language yet
        if (data.codeSnapshot.language === language || !codeByLangRef.current[language]) {
          setCode(data.codeSnapshot.source);
          codeByLangRef.current[data.codeSnapshot.language] = data.codeSnapshot.source;
        }
      }
      // Derive timer from timeLeftMs
      if (data.timeLeftMs != null) {
        setTimeLimitMs(data.timeLeftMs);
        setStartTime(Date.now());
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  }, [language]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, language, problemSlug }),
      });
      const data = await res.json();
      setInterviewId(data.id as string);
      setStartTime(Date.now());
      await fetchState(data.id as string);
    } catch (e) {
      console.error("Failed to start:", e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewId || !message.trim() || streaming) return;

    const userText = message;
    setMessage("");
    setTranscript((prev) => [
      ...prev,
      { id: prev.length + 1, role: "candidate", text: userText },
    ]);

    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch(`/interviews/${interviewId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          // Keep incomplete last line in buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.substring(6));
                if (parsed.type === "delta") {
                  aiResponse += parsed.content;
                  // Filter out [STARTER_CODE] during streaming so it doesn't appear in the chat
                  const displayStream = aiResponse
                    .replace(/\[STARTER_CODE\][\s\S]*?(?:\[\/STARTER_CODE\]|$)/i, "")
                    .trim();
                  setStreamText(displayStream);
                } else if (parsed.type === "starterCode") {
                  if (typeof parsed.content === "string" && parsed.content.trim()) {
                    const sc = parsed.content.trim();
                    setCode(sc);
                    codeByLangRef.current[language] = sc;
                  }
                } else if (parsed.type === "turn") {
                  aiResponse = parsed.content as string;
                  const displayTurn = aiResponse
                    .replace(/\[STARTER_CODE\][\s\S]*?\[\/STARTER_CODE\]/i, "")
                    .trim();
                  setStreamText(displayTurn);
                } else if (parsed.type === "phase") {
                  setPhase(parsed.content as Phase);
                }
              } catch {
                // Partial JSON, ignore
              }
            }
          }
        }
      }

      setStreaming(false);
      setStreamText("");
      if (aiResponse) {
        let cleanText = aiResponse;
        let extractedStarter = "";

        // 1. Extract [STARTER_CODE] if present
        const starterMatch = /\[STARTER_CODE\]([\s\S]*?)\[\/STARTER_CODE\]/i.exec(aiResponse);
        if (starterMatch && starterMatch[1]) {
          extractedStarter = starterMatch[1].trim();
          cleanText = cleanText.replace(/\[STARTER_CODE\][\s\S]*?\[\/STARTER_CODE\]/i, "").trim();
        }

        // 2. If problem presentation, extract any markdown code blocks directly to editor
        const isProblemPresentation =
          cleanText.toLowerCase().includes("problem") ||
          cleanText.includes("Example 1") ||
          cleanText.includes("Constraints");

        if (isProblemPresentation) {
          const fenceMatch = /```(?:[a-zA-Z]*)\n([\s\S]*?)```/i.exec(cleanText);
          if (fenceMatch && fenceMatch[1]) {
            if (!extractedStarter) {
              extractedStarter = fenceMatch[1].trim();
            }
            // Remove code block from chatbox presentation
            cleanText = cleanText.replace(/```(?:[a-zA-Z]*)\n[\s\S]*?```/i, "").trim();
          }
        }

        // Load extracted starter code into editor
        if (extractedStarter) {
          setCode(extractedStarter);
          codeByLangRef.current[language] = extractedStarter;
        }

        setTranscript((prev) => [
          ...prev,
          { id: prev.length + 1, role: "interviewer", text: cleanText },
        ]);
      }
      await fetchState(interviewId);
    } catch (e) {
      console.error("Send failed:", e);
      setStreaming(false);
      setStreamText("");
    }

    inputRef.current?.focus();
  };

  const saveCode = async () => {
    if (!interviewId) return;
    try {
      await fetch(`/interviews/${interviewId}/code`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, source: code }),
      });
    } catch (e) {
      console.error("Save code failed:", e);
    }
  };

  // Periodic auto-save debounced snapshot (Phase 4.1)
  useEffect(() => {
    if (!interviewId || phase === "not-started" || phase === "done") return;
    const t = setTimeout(() => {
      saveCode();
    }, 15000);
    return () => clearTimeout(t);
  }, [code, interviewId, phase]);

  const runCode = async () => {
    if (!interviewId) return;
    setOutput("Running test cases...");
    setTestResults(null);
    setSubmissionSummary(null);
    setActiveTestIndex(0);
    try {
      await saveCode();
      const res = await fetch(`/interviews/${interviewId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, source: code }),
      });
      const data = await res.json();
      if (data.compileError) {
        setOutput(`Compile Error:\n${data.compileError}`);
      } else if (data.results) {
        setTestResults(
          data.results.map(
            (r: { passed: boolean; stdout: string; stderr: string; timeMs: number; hidden: boolean; input?: string; expected?: string }, i: number) => ({
              name: `Test Case ${i + 1}`,
              passed: r.passed,
              stdout: r.stdout,
              stderr: r.stderr,
              timeMs: r.timeMs,
              hidden: r.hidden,
              input: r.input,
              expected: r.expected,
            })
          )
        );
        setOutput("");
      } else {
        setOutput(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setOutput(`Error: ${String(e)}`);
    }
  };

  const submitCode = async () => {
    if (!interviewId) return;
    setOutput("Evaluating submission against test suite...");
    setTestResults(null);
    setSubmissionSummary(null);
    setActiveTestIndex(0);
    try {
      await saveCode();
      const res = await fetch(`/interviews/${interviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, source: code }),
      });
      const data = await res.json();
      const allPassed = Boolean(data.hiddenTestsPassed);
      setSubmissionSummary({
        allPassed,
        message: allPassed
          ? "Accepted — All sample & hidden tests passed!"
          : "Some hidden test cases failed. Consider edge cases and boundary inputs.",
      });

      if (Array.isArray(data.results)) {
        setTestResults(
          data.results.map(
            (r: { passed: boolean; stdout: string; stderr: string; timeMs: number; hidden?: boolean; input?: string; expected?: string }, i: number) => ({
              name: r.hidden ? `Hidden Case ${i + 1}` : `Sample Case ${i + 1}`,
              passed: r.passed,
              stdout: r.stdout,
              stderr: r.stderr,
              timeMs: r.timeMs,
              hidden: Boolean(r.hidden),
              input: r.input,
              expected: r.expected,
            })
          )
        );
      }
      setOutput("");
      if (data.phase) {
        setPhase(data.phase as Phase);
      }
      await fetchState(interviewId);
    } catch (e) {
      setOutput(`Error: ${String(e)}`);
    }
  };

  const endInterview = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      await fetch(`/interviews/${interviewId}/end`, { method: "POST" });
      const res = await fetch(`/interviews/${interviewId}/report`);
      const data: Report = await res.json();
      setReport(data);
      setPhase("done");
    } catch (e) {
      console.error("End interview failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    void endInterview();
  }, [interviewId]);

  const deleteInterviewData = async () => {
    if (!interviewId) return;
    try {
      await fetch(`/interviews/${interviewId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Delete failed:", e);
    }
    setInterviewId(null);
    setReport(null);
    setTranscript([]);
    setPhase("not-started");
    setCode("# Write your code here\ndef main():\n    pass\n\nmain()");
    setOutput("");
  };

  // ── Landing page ──────────────────────────────────────────────
  if (!interviewId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-gray-100 p-4">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-center">
          TestMeMan <span className="text-blue-500">AI Interviewer</span>
        </h1>
        <p className="mb-8 text-gray-400 text-center">
          Practice technical coding interviews with live AI evaluation.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Coding Problem
            </label>
            <select
              value={problemSlug}
              onChange={(e) => {
                setProblemSlug(e.target.value);
                codeByLangRef.current = {};
              }}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              {availableProblems.length > 0 ? (
                availableProblems.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title} ({p.difficulty.toUpperCase()})
                  </option>
                ))
              ) : (
                <>
                  <option value="valid-anagram">Valid Anagram (EASY)</option>
                  <option value="two-sum">Two Sum (EASY)</option>
                  <option value="isomorphic-strings">Isomorphic Strings (EASY)</option>
                  <option value="reverse-string">Reverse String (EASY)</option>
                  <option value="contains-duplicate">Contains Duplicate (EASY)</option>
                  <option value="valid-palindrome">Valid Palindrome (EASY)</option>
                  <option value="maximum-subarray">Maximum Subarray (MEDIUM)</option>
                  <option value="longest-substring-without-repeating-characters">
                    Longest Substring Without Repeating Characters (MEDIUM)
                  </option>
                  <option value="coin-change">Coin Change (MEDIUM)</option>
                  <option value="merge-intervals">Merge Intervals (MEDIUM)</option>
                  <option value="trapping-rain-water">Trapping Rain Water (HARD)</option>
                  <option value="median-of-two-sorted-arrays">
                    Median of Two Sorted Arrays (HARD)
                  </option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>

          {/* Privacy & Consent Notice (README Rule 7) */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 text-xs text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Candidate Privacy Notice</p>
            <p className="mb-2">
              Your interview dialogue, code snapshot timeline, and test executions are collected strictly for rubric scoring. You may delete this record at any time.
            </p>
            <label className="flex items-start gap-2 cursor-pointer text-gray-300 select-none">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-0"
              />
              <span>I consent to recording my interview for rubric evaluation.</span>
            </label>
          </div>

          <button
            onClick={startInterview}
            disabled={loading || !consented}
            className="mt-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Starting…" : "Start Interview"}
          </button>
        </div>
      </div>
    );
  }

  // ── Report view ───────────────────────────────────────────────
  if (report) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="mx-auto max-w-3xl">
          <ReportView report={report} />
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setInterviewId(null);
                setReport(null);
                setTranscript([]);
                setPhase("not-started");
                setCode("# Write your code here\ndef main():\n    pass\n\nmain()");
                setOutput("");
              }}
              className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Start New Interview
            </button>
            <button
              onClick={deleteInterviewData}
              className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300 transition hover:bg-red-900/60"
            >
              Delete Interview Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main interview view ───────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">
            TestMeMan <span className="text-blue-500">AI</span>
          </h1>
          <span className="rounded bg-gray-800 border border-gray-700 px-2.5 py-0.5 text-xs text-blue-300 font-medium">
            Problem: {problemData?.title ?? problemSlug} {problemData?.difficulty ? `(${problemData.difficulty.toUpperCase()})` : ""}
          </span>
        </div>
        {startTime > 0 && (
          <Timer
            startTime={startTime}
            timeLimitMs={timeLimitMs}
            onTimeUp={handleTimeUp}
          />
        )}
        <button
          onClick={endInterview}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Ending…" : "End & Report"}
        </button>
      </header>

      {/* Phase Indicator */}
      <div className="border-b border-gray-800 px-4">
        <PhaseIndicator phase={phase as Phase} />
      </div>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Chat ──────────────────────────────────────── */}
        <div className="flex w-1/2 flex-col border-r border-gray-800">
          {/* Transcript */}
          <div className="transcript-scroll flex-1 overflow-y-auto p-4 space-y-3">
            {transcript.length === 0 && !streaming && (
              <p className="text-center text-gray-500 mt-12">
                No messages yet. Type below to start the interview.
              </p>
            )}
            {transcript.map((t) => (
              <div
                key={t.id}
                className={`flex ${t.role === "candidate" ? "justify-end" : "justify-start"}`}
              >
                {t.role === "candidate" ? (
                  <div className="max-w-[85%] rounded-2xl bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white whitespace-pre-wrap shadow-sm">
                    {t.text}
                  </div>
                ) : (
                  <div className="max-w-[92%] rounded-2xl bg-gray-800/95 border border-gray-700/60 p-4 text-sm leading-relaxed text-gray-200 shadow-md">
                    <div className="mb-2 flex items-center justify-between border-b border-gray-700/50 pb-1.5 text-xs">
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <span>🤖</span> AI Technical Interviewer
                      </span>
                    </div>
                    <MarkdownMessage
                      content={t.text}
                      onLoadCode={(starterCode) => setCode(starterCode)}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming text */}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl bg-gray-800/95 border border-gray-700/60 p-4 text-sm leading-relaxed text-gray-200 shadow-md">
                  <div className="mb-2 flex items-center gap-1.5 border-b border-gray-700/50 pb-1.5 text-xs font-semibold text-blue-400">
                    <span>🤖</span> AI Technical Interviewer <span className="text-gray-500 font-normal">(streaming...)</span>
                  </div>
                  {streamText ? (
                    <MarkdownMessage
                      content={streamText}
                      onLoadCode={(starterCode) => setCode(starterCode)}
                    />
                  ) : (
                    <LoadingDots />
                  )}
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Input */}
          {phase === "evaluate" || phase === "done" ? (
            <div className="flex items-center justify-between border-t border-gray-800 p-3 bg-gray-900/60">
              <span className="text-sm text-green-400 font-medium">
                Interview completed! Ready to see your evaluation.
              </span>
              <button
                type="button"
                onClick={endInterview}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Generating Report…" : "View Report 📊"}
              </button>
            </div>
          ) : (
            <form
              onSubmit={sendMessage}
              className="flex gap-2 border-t border-gray-800 p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message…"
                disabled={streaming}
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !message.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* ── Right: Code Editor + Output ─────────────────────── */}
        <div className="flex w-1/2 flex-col">
          {/* Language selector + actions */}
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:outline-none"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                ▶ Run
              </button>
              <button
                onClick={submitCode}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
            />
          </div>

          {/* HackerRank / LeetCode Style Execution Console */}
          <div className="border-t border-gray-800 bg-[#0d1117] flex flex-col h-56">
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-4 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <span>💻</span> Execution Console
                </span>
                {submissionSummary && (
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                      submissionSummary.allPassed
                        ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-400"
                        : "border-red-500/50 bg-red-950/60 text-red-400"
                    }`}
                  >
                    {submissionSummary.allPassed ? "✓ Accepted" : "✗ Wrong Answer"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {submissionSummary && (
                  <span className="text-[11px] text-gray-400">
                    {submissionSummary.message}
                  </span>
                )}
                {(output || testResults || submissionSummary) && (
                  <button
                    onClick={() => {
                      setOutput("");
                      setTestResults(null);
                      setSubmissionSummary(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Test Case Navigation Tabs (if testResults exist) */}
            {testResults && testResults.length > 0 && (
              <div className="flex items-center gap-1 border-b border-gray-800 bg-[#12161f] px-3 py-1 overflow-x-auto">
                {testResults.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestIndex(idx)}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                      activeTestIndex === idx
                        ? "bg-gray-800 text-white border border-gray-700 shadow-sm"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        t.passed ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    {t.name}
                    {t.hidden && <span className="text-[10px] text-gray-500">(hidden)</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Console Content */}
            <div className="flex-1 overflow-y-auto p-3 text-xs font-mono">
              {testResults && testResults[activeTestIndex] ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        testResults[activeTestIndex].passed
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      <span>{testResults[activeTestIndex].passed ? "✓ Passed" : "✗ Failed"}</span>
                      {testResults[activeTestIndex].hidden && (
                        <span className="text-[11px] text-gray-500 font-normal">(Hidden Test)</span>
                      )}
                    </span>
                    {testResults[activeTestIndex].timeMs != null && (
                      <span className="text-gray-500 text-[11px]">
                        Runtime: {testResults[activeTestIndex].timeMs} ms
                      </span>
                    )}
                  </div>

                  {/* Input Card */}
                  {testResults[activeTestIndex].input && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                        Input:
                      </span>
                      <pre className="rounded bg-black/50 border border-gray-800 p-2 font-mono text-gray-200 whitespace-pre-wrap">
                        {testResults[activeTestIndex].input}
                      </pre>
                    </div>
                  )}

                  {/* Your Output Card */}
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Your Output:
                    </span>
                    <pre
                      className={`rounded border p-2 font-mono whitespace-pre-wrap ${
                        testResults[activeTestIndex].passed
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-200"
                          : "bg-black/50 border-gray-800 text-gray-200"
                      }`}
                    >
                      {testResults[activeTestIndex].stdout?.trim() || "(no stdout)"}
                    </pre>
                  </div>

                  {/* Expected Output Card */}
                  {testResults[activeTestIndex].expected && (
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                        Expected Output:
                      </span>
                      <pre className="rounded bg-emerald-950/30 border border-emerald-800/40 p-2 font-mono text-emerald-200 whitespace-pre-wrap">
                        {testResults[activeTestIndex].expected}
                      </pre>
                    </div>
                  )}

                  {/* Errors */}
                  {testResults[activeTestIndex].stderr && (
                    <div>
                      <span className="text-[11px] font-semibold text-red-400 block mb-1">
                        Errors:
                      </span>
                      <pre className="rounded bg-red-950/20 border border-red-900/40 p-2 text-red-300 whitespace-pre-wrap">
                        {testResults[activeTestIndex].stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : output ? (
                <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {output}
                </pre>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <p>Click "▶ Run" to execute sample tests, or "Submit" to run the full test suite.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
