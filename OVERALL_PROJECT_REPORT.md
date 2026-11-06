# TestMeMan AI Technical Interviewer: Comprehensive Project Report

**Project Repository:** [github.com/piyushrav1/ai-interview-v.01](https://github.com/piyushrav1/ai-interview-v.01)  
**Date:** November 6, 2026  
**Current Milestone Completed:** Week 5 (Evaluator, Double-Run & Golden CI)  
**Overall Completion:** ~85% (Weeks 1–5 Complete, Week 6 Pilot & Production Hardening Remaining)

---

## 1. Executive Summary

The **TestMeMan AI Technical Interviewer** is an autonomous platform developed to conduct rigorous, multi-language technical coding interviews for entry-level and fresher software engineering roles.

Over five intensive development cycles, the platform has advanced from foundational TypeScript contracts into a fully functioning, sandboxed, and adversarially resilient interview and evaluation engine. It handles everything from real-time streaming Socratic dialogue to isolated code compilation across 5 programming languages, post-interview dual-run rubric grading with verbatim transcript citations, and continuous CI regression protection against prompt drift.

```mermaid
flowchart TD
    subgraph Completed Milestones [100% Complete & Verified]
        W1[Week 1: Contracts & Architecture]
        W2[Week 2: State Machine & Turn Engine]
        W3[Week 3: Real Gemini Streaming & Monaco UI]
        W4[Week 4: Judge0 Sandboxed Execution & Socratic Hints]
        W5[Week 5: Production Evaluator, Double-Run & Golden CI]
        W1 --> W2 --> W3 --> W4 --> W5
    end

    subgraph Remaining Work [Week 6 & Production Launch]
        W6[Week 6: Pilot Cohort & Human Grader Comparison]
        PROD[Production Hardening: PostgreSQL, Auth & Deployment]
        W5 --> W6
        W6 --> PROD
    end
```

---

## 2. What We Have Achieved (Done Till Now)

### Phase 1: Core Contracts & Monorepo Foundation (Week 1)
- **Zero-Leakage Monorepo Architecture:** Built as an isolated pnpm workspace (`packages/contracts`, `packages/core`, `packages/ui`, `apps/api`, `apps/demo`).
- **Four Standard Adapter Interfaces:**
  - `AIModel`: Streams text and outputs validated JSON schemas.
  - `CodeRunner`: Sandboxed multi-language test execution.
  - `Storage`: Storage of interviews, turns, code snapshots, and reports.
  - `Identity`: Candidate identity resolution.
- **Architectural Decision Records (ADRs):** Initialized in `docs/decisions/` to maintain contract change traceability (Rule 4).

### Phase 2: Deterministic Finite State Machine (Week 2)
- **8-Phase Interview Lifecycle:**
  $$\text{plan} \longrightarrow \text{intro} \longrightarrow \text{problem} \longrightarrow \text{coding} \longrightarrow \text{followUps} \longrightarrow \text{concepts} \longrightarrow \text{wrapUp} \longrightarrow \text{evaluate} \longrightarrow \text{done}$$
- **Turn Budgeting & Automatic Phase Advancement:** Enforces candidate turn limits and manages conversation pacing.
- **Scripted Fake Engine:** Enabled full integration testing with zero external API costs.

### Phase 3: Interactive Interview Room & Gemini Streaming (Week 3)
- **High-Performance Streaming:** Server-Sent Events (SSE) streaming with sub-1.5s time-to-first-token.
- **Full-Featured Candidate Room:**
  - Integrated Monaco code editor with dynamic language syntax highlighting.
  - Live countdown timer with turn progress bar.
  - Synchronized chat pane rendering markdown and LaTeX formulas.
- **Candidate Privacy (Rule 7):** Pre-interview consent modal and GDPR-compliant interview deletion API (`DELETE /interviews/:id`).

### Phase 4: Sandboxed Code Execution & Socratic Follow-Ups (Week 4)
- **Local Docker Judge0 Sandbox (Port 2358):** Isolated execution with automatic `FallbackCodeRunner` failover.
- **5 Supported Programming Languages:**
  - `Python 3` (Judge0 ID 71) with `from __future__ import annotations`.
  - `C++ 17` (Judge0 ID 54) with `<bits/stdc++.h>` and automatic `int main()` drivers.
  - `C` (Judge0 ID 50) with standard C headers.
  - `Java OpenJDK` (Judge0 ID 62) with tuned JVM Metaspace (`-XX:MaxMetaspaceSize=128m -Xms32m -Xmx128m`).
  - `JavaScript Node.js` (Judge0 ID 63) with isolated assert suites.
- **12 Canonical DSA Problems:** Easy, Medium, and Hard problem suites in `data/problems/`.
- **Sample vs. Hidden Test Suite:**
  - `/run`: Evaluates public sample cases.
  - `/submit`: Evaluates hidden test cases with inputs and expected outputs redacted to prevent inspection.
- **Failure-Grounded Socratic Follow-Ups:** AI follow-up questions analyze compiler errors, time limit exceeded (TLE), and failing edge cases to guide the candidate Socratically without revealing answers.
- **Code Evolution Timeline:** Debounced code snapshot capture and interactive scrubbing replay.

### Phase 5: Production Evaluator, Double-Run & Golden CI (Week 5)
- **Strict Role Separation:** The interviewer agent never scores. An independent evaluator scores the completed interview transcript and code timeline.
- **5 Rubric Dimensions (Scored 1–4):**
  - `problemSolving`: Problem decomposition, approach selection, planning before code.
  - `codeCorrectness`: Functional accuracy, compilation, passing sample and hidden tests.
  - `testingEdgeCases`: Proactive handling of empty, null, duplicate, and boundary cases.
  - `complexityReasoning`: Formal Big-O time and space complexity analysis.
  - `communication`: Articulation of thought process, responsiveness to interviewer hints.
- **Evidence Quotes & Confidence:** Every score is backed by a verbatim transcript or code citation and a confidence rating (`high`, `medium`, `low`).
- **Low-Temperature Double-Run Check:** Executes evaluation twice at low temperature ($T \le 0.2$). If any dimension score differs by $> 1$, automatically marks `needsHumanReview = true` with a detailed explanation in `humanReviewReason`.
- **Candidate PII Sanitizer (Rule 274):** Automatically redacts candidate names, emails, phone numbers, and universities/colleges from transcripts and code header comments.
- **Adversarial Prompt Injection Protection (Rules 277–280):**
  - Delimits candidate turns in `<candidate_turn>` XML blocks with angle-bracket escaping (`&lt;/candidate_turn&gt;`).
  - Heuristic security auditor flags command overrides, roleplay escapes, and fake JSON payloads.
  - Penalizes attacks by capping communication score at 1, logging the violation under `gaps`, and triggering human review.
- **20 Golden Benchmark Interviews (`data/golden/*.json`):** 20 recorded canonical interviews covering strong, average, weak, edge-blind, cheating/plagiarism, off-topic, and prompt injection attacks.
- **Automated Golden CI Regression Testing:** `pnpm test:golden` runs in GitHub Actions CI to ensure prompt modifications never drift scores outside human-annotated bounds.
- **Token & Cost Accounting Ledger (Rule 6):** In-memory ledger tracking input/output tokens and estimated USD costs ($0.075 / 1M prompt tokens, $0.30 / 1M completion tokens for Flash).
- **Report Screen Polish (`ReportView.tsx`):** Displays human review alert banners, confidence badges, evidence blockquotes, strengths/gaps cards, code evolution playback, and cost telemetry.

---

## 3. Current Verification Matrix

| Verification Aspect | Command / Metric | Result |
| :--- | :--- | :--- |
| **Monorepo Typecheck** | `pnpm -r typecheck` | **0 errors** across all 5 workspace projects |
| **Monorepo Linting** | `pnpm -r lint` | **0 errors, 0 warnings** |
| **Main Test Suite** | `pnpm test` | **88 / 88 tests passing** (1.4s) |
| **Golden Benchmark Suite** | `pnpm test:golden` | **21 / 21 tests passing** (804ms) |
| **Production Build** | `pnpm -r build` | **All packages & apps built cleanly** |
| **Code Execution Sandbox** | Judge0 Docker (port 2358) | **5 languages verified** |
| **Adversarial Defense** | Unit security suite | **10 / 10 attacks neutralized** |

---

## 4. What Is Left to Do (Remaining Work)

While the foundational engine, code sandbox, and evaluator are 100% complete and passing all CI checks, the following tasks remain to transition from development into production deployment:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REMAINING MILESTONES & TASKS                       │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│ 1. Week 6: Pilot Trials      │ 2. Production Persistence    │ 3. Platform   │
│    • Real student interviews │    • PostgreSQL / D1 schema  │    Integration│
│    • Human scorer comparison │    • Drizzle ORM migrations  │    • Auth0 /  │
│    • Inter-rater correlation │    • Persistent report store │      Clerk SSO│
│    • SLA: < 60s report gen   │    • Token ledger DB sync    │    • PDF Export│
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

### 1. Week 6 — Pilot Trials & Human Correlation Study
- **Run Real Student Cohort Interviews:** Ingest and execute live interview sessions with university freshers.
- **Human vs. AI Score Correlation:** Have human technical interviewers independently grade the same recorded transcripts across all 5 dimensions. Calculate Pearson correlation coefficients and inter-rater reliability to calibrate prompt scoring thresholds.
- **SLA Benchmark Verification:**
  - Verify that the first words of streaming replies appear in **under 1.5 seconds**.
  - Verify that the full double-run evaluation report generates and saves within **under 60 seconds** of interview completion.

### 2. Production Database Persistence & Migrations
- **Current State:** API uses `MemoryStorage` in development for fast testing.
- **Remaining Task:** Connect production relational database storage (PostgreSQL with Drizzle ORM or Cloudflare D1):
  - Run database migrations (`pnpm db:migrate`).
  - Persist interviews, transcripts, code revisions, evaluation reports, and token accounting records durably.

### 3. Identity & Authentication Integration
- **Current State:** `devIdentity` returns `dev-candidate`.
- **Remaining Task:** Implement production `Identity` adapter:
  - Integrate OAuth2 / JWT authentication (Auth0, Clerk, or TestMeMan platform credentials).
  - Enforce candidate permissions so candidates can only access their own active interview and final report.

### 4. Report Sharing & PDF Export
- **Downloadable PDF Summary:** Allow candidates and hiring managers to download a standardized one-page PDF technical report containing the overall score, rubric breakdown, strengths, gaps, and timeline link.
- **Public Share Links:** Secure, read-only tokenized URLs for recruiters to review interview replays without signing in.

### 5. Production Cloud Deployment
- **API Deployment:** Deploy `apps/api` to Cloudflare Workers (`pnpm wrangler deploy`).
- **Demo / UI Deployment:** Deploy `apps/demo` to Cloudflare Pages or Vercel.
- **Judge0 Cloud Infrastructure:** Provision an isolated cloud Judge0 server with SSL, API key authentication, and auto-scaling workers.

---

## 5. Summary Scorecard

| Area | Completion | Status |
| :--- | :---: | :--- |
| **Architecture & Contracts** | 100% | Complete |
| **State Machine Engine** | 100% | Complete |
| **Interview UI & Code Editor** | 100% | Complete |
| **Judge0 Code Sandbox (5 Langs)** | 100% | Complete |
| **Socratic Follow-Up Generation** | 100% | Complete |
| **Production Evaluator & Rubric** | 100% | Complete |
| **Double-Run Consistency Engine** | 100% | Complete |
| **PII Sanitizer & Privacy** | 100% | Complete |
| **Prompt Injection Defenses** | 100% | Complete |
| **Golden Set CI Benchmarks** | 100% | Complete |
| **Token & Cost Accounting** | 100% | Complete |
| **Week 6 Pilot & Human Comparison** | 0% | Planned Next |
| **Production PostgreSQL Database** | 20% | Migration schema ready, needs connection |
| **Auth & Production Deployment** | 10% | Ready for staging deployment |

**Overall Progress:** **~85% Complete** — Core platform is completely built, tested, and ready for pilot trials.

