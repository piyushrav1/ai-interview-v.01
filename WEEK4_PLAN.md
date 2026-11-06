# Week 4 Implementation Plan: Running Code & Grounded Follow-Ups

> **Goal:** Transition from simulated/mock execution to real sandboxed code execution, evaluate both sample and hidden test suites, drive AI follow-up questions directly from failing test cases, and record the candidate's code evolution timeline.

---

## Progress Overview

- [x] **Phase 1: Real Code Execution Adapter (Judge0 Integration)**
- [x] **Phase 2: Dynamic Problem Bank & Multi-Tier Test Suite**
- [ ] **Phase 3: Socratic Follow-Up Generation Grounded in Code & Failures**
- [ ] **Phase 4: Code Evolution Timeline & Snapshot Tracking**
- [ ] **Phase 5: UI Polish & Timeline Playback Viewer**

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
  - [x] Automated driver harness to invoke candidate functions (`is_isomorphic`, `two_sum`, `reverse_string`) with test inputs.
  - [x] Canonical problem suites:
    - [x] `valid-anagram` (primary question with `is_anagram` / `isAnagram`)
    - [x] `isomorphic-strings`
    - [x] `two-sum`
    - [x] `reverse-string`
- [x] **2.2 Execution Partitioning in API Routes (`apps/api/src/routes/interviews.ts`)**
  - [x] **Sample Test Run (`POST /interviews/:id/run`):**
    - [x] Executes visible sample tests matching the problem being solved.
    - [x] Returns `input`, `expected`, `stdout`, and `passed`.
  - [x] **Full Test Submission (`POST /interviews/:id/submit`):**
    - [x] Executes both sample and hidden test suites.
    - [x] Redacts hidden test inputs/outputs from candidate-facing response (`(hidden input)`).
    - [x] Returns overall `hiddenTestsPassed` boolean status.
- [x] **2.3 HackerRank/LeetCode Console UI Display (`packages/ui/src/InterviewRoom.tsx`)**
  - [x] Shows `Input:`, `Your Output:`, and `Expected Output:` on test case tabs.
  - [x] Highlights differences with clean styling and error diagnostics.

---

### Phase 3: Socratic Follow-Up Generation Grounded in Code & Failures
- [ ] **3.1 Failure-Grounded Prompt Engine (`packages/core/src/prompts/v1/followup.ts`)**
  - [ ] Inject candidate's actual submitted code snapshot into the system prompt context.
  - [ ] Inject diagnostics of failed hidden test cases (e.g. edge cases, empty input, negative numbers, duplicates).
  - [ ] Direct the AI interviewer to ask targeted Socratic questions probing *why* their code failed the specific edge case without revealing the test input outright.
- [ ] **3.2 Algorithmic Scaling & Complexity Probing**
  - [ ] If all tests pass, branch dynamically to complexity reasoning (e.g. $O(N^2)$ to $O(N)$ with Hash Maps).
  - [ ] Probe scaling to $10^6$ / $10^7$ items and memory-constrained environments.
- [ ] **3.3 Follow-Up Integration Tests**
  - [ ] Add Vitest tests verifying failure-grounded prompt generation.

---

### Phase 4: Code Evolution Timeline & Snapshot Tracking
- [ ] **4.1 Periodic Snapshot Auto-Capture**
  - [ ] Frontend triggers debounced `PUT /interviews/:id/code` every 15 seconds of active typing.
  - [ ] Trigger immediate snapshot on every `▶ Run` and `Submit` action.
  - [ ] Backend persists `CodeSnapshot` records with `turnId`, `language`, `source`, and `timeMs`.
- [ ] **4.2 Code Timeline Pacing Metrics**
  - [ ] Track time to first line of code.
  - [ ] Track total code revisions, refactors, and run-to-submit ratio.

---

### Phase 5: UI Polish & Timeline Playback Viewer
- [ ] **5.1 Execution Console Refinement (`packages/ui/src/InterviewRoom.tsx`)**
  - [ ] Real-time execution indicators (spinner, runtime in ms, memory usage).
  - [ ] Explicit distinction between "Sample Test Results" and "Full Test Suite Evaluation".
- [ ] **5.2 Code History Scrubber / Replay Component**
  - [ ] Add timeline slider in post-interview report to review code state at each minute.
- [ ] **5.3 End-to-End Verification**
  - [ ] Full run from intro -> problem -> real code execution -> failing hidden test -> failure-grounded follow-up -> report.

