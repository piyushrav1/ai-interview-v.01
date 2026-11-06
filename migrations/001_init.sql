-- TestMeMan AI Interviewer Schema

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  language TEXT NOT NULL,
  phase TEXT NOT NULL,
  concept_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  time_limit_ms INT NOT NULL DEFAULT 1800000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turns (
  id SERIAL PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  turn_number INT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('interviewer', 'candidate')),
  text TEXT NOT NULL,
  turn_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS code_snapshots (
  id SERIAL PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  turn_id INT NOT NULL,
  language TEXT NOT NULL,
  source TEXT NOT NULL,
  time_ms BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  interview_id UUID PRIMARY KEY REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 1 AND 4),
  rubric_scores JSONB NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_replay JSONB NOT NULL DEFAULT '[]'::jsonb,
  needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turns_interview ON turns(interview_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_snapshots_interview ON code_snapshots(interview_id, turn_id);

