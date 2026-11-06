# Week 4 Implementation Plan: Running Code & Grounded Follow-Ups

> **Goal:** Transition from simulated/mock execution to real sandboxed code execution, evaluate both sample and hidden test suites, drive AI follow-up questions directly from failing test cases, and record the candidate's code evolution timeline.

---

## Progress Overview

- [x] **Phase 1: Real Code Execution Adapter (Judge0 Integration)**
- [x] **Phase 2: Dynamic Problem Bank & Multi-Tier Test Suite**
- [x] **Phase 3: Socratic Follow-Up Generation Grounded in Code & Failures**
- [x] **Phase 4: Code Evolution Timeline & Snapshot Tracking**
- [x] **Phase 5: UI Polish & Timeline Playback Viewer**

---

## Detailed Checklists

### Phase 1: Real Code Execution Adapter (Judge0 Integration)
- [x] **1.1 Judge0 Client Adapter (`apps/api/src/adapters/judge0.ts`)**
  - [x] Implement the `CodeRunner` interface conforming to `@testmeman/core`.
  - [x] Support language ID mapping:
    - [x] Python 3 (`71` / `92`)
    - [x] C++ 17 (`54` / `105`)
    - [x] C (`50` / `103`)
    - [x] Java OpenJDK (`62` / `91`)
    - [x] JavaScript Node.js (`63` / `93`)
  - [x] Batch execution (`POST /submissions/batch?base64_encoded=true`) with polling (`GET /submissions/batch`).
  - [x] Handle stdout, stderr, compile errors, Time Limit Exceeded (TLE), Memory Limit Exceeded (MLE), and runtime exceptions.
- [x] **1.2 Runner Fallback & Environment Configuration**
  - [x] Read `JUDGE0_URL`, `JUDGE0_KEY`, and `JUDGE0_HOST` from environment variables / `.dev.vars`.
  - [x] Gracefully fall back to local/dev mock runner via `FallbackCodeRunner` when Judge0 is unconfigured or offline.
- [x] **1.3 Tests**
  - [x] Add unit tests mocking Judge0 API responses and fallback handling in `apps/api/test/judge0.test.ts`.

---

### Phase 2: Dynamic Problem Bank & Multi-Tier Test Suite
- [x] **2.1 Problem Bank Registry & Test Harness (`apps/api/src/adapters/harness.ts`)**
  - [x] Automated driver harness to invoke candidate functions across all 5 languages (`python`, `javascript`, `cpp`, `java`, `c`).
  - [x] 12 Canonical problem suites (Easy, Medium, Hard):
    - [x] `valid-anagram` (Easy - Strings, Hash Table)
    - [x] `two-sum` (Easy - Arrays, Hashing)
    - [x] `isomorphic-strings` (Easy - Strings, Hash Table)
    - [x] `reverse-string` (Easy - Strings, Two Pointers)
    - [x] `contains-duplicate` (Easy - Arrays, Hash Table)
    - [x] `valid-palindrome` (Easy - Strings, Two Pointers)
    - [x] `maximum-subarray` (Medium - DP, Divide & Conquer)
    - [x] `longest-substring-without-repeating-characters` (Medium - Sliding Window)
    - [x] `coin-change` (Medium - DP, BFS)
    - [x] `merge-intervals` (Medium - Sorting, Intervals)
    - [x] `trapping-rain-water` (Hard - Two Pointers, Stack, DP)
    - [x] `median-of-two-sorted-arrays` (Hard - Binary Search, Divide & Conquer)
- [x] **2.2 Execution Partitioning in API Routes (`apps/api/src/routes/interviews.ts`)**
  - [x] **Sample Test Run (`POST /interviews/:id/run`):**
    - [x] Executes visible sample tests matching the problem being solved.
    - [x] Returns `input`, `expected`, `stdout`, and `passed`.
  - [x] **Full Test Submission (`POST /interviews/:id/submit`):**
    - [x] Executes both sample and hidden test suites.
    - [x] Redacts hidden test inputs/outputs from candidate-facing response (`(hidden input)`).
    - [x] Records `lastSubmission` in interview state.
    - [x] Automatically transitions interview phase to `followUps`.
- [x] **2.3 HackerRank/LeetCode Console UI Display (`packages/ui/src/InterviewRoom.tsx`)**
  - [x] Shows `Input:`, `Your Output:`, and `Expected Output:` on test case tabs.
  - [x] Highlights differences with clean styling and error diagnostics.

---

### Phase 3: Socratic Follow-Up Generation Grounded in Code & Failures
- [x] **3.1 Failure-Grounded Prompt Engine (`packages/core/src/prompts/v1/followup.ts`)**
  - [x] Inject candidate's actual submitted code snapshot into the system prompt context.
  - [x] Inject diagnostics of failed hidden test cases (boundary conditions, empty input, negative numbers, duplicates).
  - [x] Direct the AI interviewer to ask targeted Socratic questions probing *why* their code failed the specific edge case without revealing the test input outright.
- [x] **3.2 Algorithmic Scaling & Complexity Probing**
  - [x] If all tests pass, branch dynamically to formal Big-O time and space complexity reasoning.
  - [x] Probe scaling to $10^7$ items and memory-constrained environments.
- [x] **3.3 Follow-Up Integration Tests**
  - [x] Unit tests in `packages/core/test/unit/followup.test.ts` verifying failure-grounded and complexity prompt generation.

---

### Phase 4: Code Evolution Timeline & Snapshot Tracking
- [x] **4.1 Periodic Snapshot Auto-Capture**
  - [x] Frontend triggers debounced `PUT /interviews/:id/code` every 15 seconds of active typing.
  - [x] Trigger immediate snapshot on every `▶ Run` and `Submit` action.
  - [x] Backend persists `CodeSnapshot` records with `turnId`, `language`, `source`, and `timeMs`.
- [x] **4.2 Code Timeline Persistence & Retrieval**
  - [x] `GET /interviews/:id` returns full `codeSnapshots` array.
  - [x] `codeReplay` included in post-interview rubric report.

---

### Phase 5: UI Polish & Timeline Playback Viewer
- [x] **5.1 Execution Console Refinement (`packages/ui/src/InterviewRoom.tsx`)**
  - [x] Real-time execution indicators (spinner, runtime in ms, stdout/stderr).
  - [x] Granular test tabs differentiating sample cases and hidden evaluation cases.
- [x] **5.2 Code History Scrubber / Replay Component (`packages/ui/src/components/ReportView.tsx`)**
  - [x] Interactive timeline slider allowing candidate and reviewers to scrub across every code revision.
  - [x] Play/Pause auto-replay with stepping controls (`◀`, `▶`).
  - [x] Real-time timestamp tracking from start to final submission.
- [x] **5.3 End-to-End Verification**
  - [x] 40/40 tests passing across all packages.
  - [x] Monorepo TypeScript typecheck passing with zero errors.
