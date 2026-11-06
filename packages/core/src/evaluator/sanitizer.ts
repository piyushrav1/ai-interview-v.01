/**
 * PII Sanitizer for TestMeMan Evaluator.
 * 
 * Per README Rule 274: "The evaluator never sees the candidate's name, email or college."
 * Redacts candidate personal identifiable information (PII) from transcripts and code snapshots
 * before sending to the LLM evaluator.
 */

// Common email regex matching standard and extended email formats
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Phone number regex matching international and domestic formats
// e.g. +1-800-555-0199, +91 98765 43210, (555) 123-4567, 555-555-5555
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// University / College / Institute patterns
// e.g., "Stanford University", "MIT", "IIT Bombay", "BITS Pilani", "ABC College of Engineering"
const COLLEGE_PATTERNS = [
  // "IIT/NIT/IIIT [City/Campus]"
  /\b(?:IIT|NIT|IIIT|BITS|IIM)\s+[A-Za-z]+(?:\s+[A-Za-z]+)?\b/gi,
  // Standalone well-known institutions
  /\b(?:MIT|Stanford|Harvard|Berkeley|CMU|Oxford|Cambridge|Princeton|Caltech|Columbia|Cornell)\b/gi,
  // "[Name] University / College / Institute"
  /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,4}\s+(?:University|College|Institute|Polytechnic)(?:\s+of\s+[A-Z][a-zA-Z]*)?\b/g,
  // "College of [Name]" / "Institute of [Name]"
  /\b(?:College|Institute)\s+of\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)?\b/g,
  // "studying at / graduated from / student of [College/University phrase]"
  /(?:studying\s+at|student\s+at|graduated\s+from|from|attending)\s+([A-Za-z0-9\s]+?\s+(?:University|College|Institute|Campus|School))/gi,
];

// Intro self-identification name phrases
// Matches "my name is Alice", "I am Bob Johnson", "I'm Charlie", "this is Dave"
const NAME_INTRO_REGEX = /\b(?:my\s+name\s+is|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+)(?:\s+([A-Za-z]+))?\b/gi;

const NON_NAME_WORDS = new Set([
  "ready", "done", "coding", "fine", "confused", "stuck", "happy", "excited",
  "sorry", "here", "good", "trying", "thinking", "sure", "not", "going", "using",
  "writing", "starting", "testing", "finished", "solving", "back", "planning",
  "to", "a", "an", "the", "with", "for", "about", "at", "in", "on", "from", "now",
  "working", "looking", "familiar", "able", "struggling", "comfortable", "aware",
  "still", "just", "also", "currently", "feeling", "wondering", "hoping", "and"
]);

// Code author comment patterns
// e.g. "// Author: John Doe", "/* Name: Alice */", "@author Bob"
const CODE_AUTHOR_REGEX = /(?:\/\/|\/\*|\*)\s*(?:Author|Name|Created\s+by|Candidate):\s*([A-Za-z0-9\s._-]+)/gi;

export interface SanitizerOptions {
  /** Known candidate name to redact if available from interview metadata */
  candidateName?: string | undefined;
}

/**
 * Sanitize a string by redacting email, phone, college/university, and names.
 */
export function sanitizeText(text: string, options?: SanitizerOptions): string {
  if (!text) return "";

  let sanitized = text;

  // 1. Redact explicit candidate name if provided
  if (options?.candidateName && options.candidateName.trim().length > 1) {
    const escapedName = options.candidateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`\\b${escapedName}\\b`, "gi");
    sanitized = sanitized.replace(nameRegex, "[REDACTED_NAME]");
  }

  // 2. Redact emails
  sanitized = sanitized.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");

  // 3. Redact phone numbers
  sanitized = sanitized.replace(PHONE_REGEX, "[REDACTED_PHONE]");

  // 4. Redact colleges / universities
  for (const pattern of COLLEGE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED_COLLEGE]");
  }

  // 5. Redact self-identified candidate names in sentences
  sanitized = sanitized.replace(NAME_INTRO_REGEX, (match, word1, word2) => {
    const w1Lower = word1 ? word1.toLowerCase() : "";
    const w2Lower = word2 ? word2.toLowerCase() : "";

    // If word1 is a non-name common word (e.g. "ready", "done", "coding"), do not redact
    if (!w1Lower || NON_NAME_WORDS.has(w1Lower)) {
      return match;
    }

    // If word2 exists and is not a stop word, redact both (e.g. "Alice Smith")
    if (word2 && !NON_NAME_WORDS.has(w2Lower)) {
      const fullMatchedName = `${word1} ${word2}`;
      return match.replace(fullMatchedName, "[REDACTED_NAME]");
    }

    // Otherwise, redact only word1 (e.g. "Alice" in "Alice from Stanford")
    return match.replace(word1, "[REDACTED_NAME]");
  });

  // 6. Redact author annotations in code or comments
  sanitized = sanitized.replace(CODE_AUTHOR_REGEX, (match, author) => {
    return match.replace(author, " [REDACTED_NAME]");
  });

  return sanitized;
}

/**
 * Sanitize an entire transcript array.
 */
export function sanitizeTranscript(
  transcript: { role: string; text: string }[],
  options?: SanitizerOptions
): { role: string; text: string }[] {
  return transcript.map((t) => ({
    role: t.role,
    text: sanitizeText(t.text, options),
  }));
}

/**
 * Sanitize a code snapshot or file source.
 */
export function sanitizeCode(code: string, options?: SanitizerOptions): string {
  return sanitizeText(code, options);
}
