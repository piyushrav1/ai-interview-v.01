import { TurnRoleEnum } from "@testmeman/contracts";
import type { Language } from "@testmeman/contracts";

type ConceptTopic = "DSA" | "OOP" | "DBMS" | "OS";

/** Concept questions bank for fresher role. */
const CONCEPT_QUESTIONS: Record<ConceptTopic, string[]> = {
  DSA: [
    "What's the difference between an array and a linked list?",
    "What is a hash table and what are its advantages?",
    "Explain the difference between a stack and a queue.",
  ],
  OOP: [
    "What are the four pillars of object-oriented programming?",
    "What's the difference between a class and an object?",
    "Explain encapsulation with a simple example.",
  ],
  DBMS: [
    "What's the difference between SQL and NoSQL databases?",
    "What is a primary key and why is it important?",
    "Explain what a database index does.",
  ],
  OS: [
    "What is process scheduling and why is it needed?",
    "What's the difference between a process and a thread?",
    "What is virtual memory?",
  ],
};

/** Build concept question prompt. */
export function buildConceptPrompt(params: {
  language: Language;
  topics: ConceptTopic[];
  questionIndex: number;
  startTime: number;
}): { system: string; messages: { role: "interviewer" | "candidate"; text: string; turnAt?: number }[] } {
  const system = `You are a technical interviewer asking 3 short concept questions.

Each question should be answerable in a few sentences.
Topics: ${params.topics.join(", ")}

Keep it conversational and encouraging.` as const;

  // Rotate through topics and questions
  const topicIdx = params.questionIndex % params.topics.length;
  const topic = params.topics[topicIdx] as ConceptTopic;
  const question = CONCEPT_QUESTIONS[topic][topicIdx % CONCEPT_QUESTIONS[topic].length];

  return {
    system,
    messages: [
      {
        role: TurnRoleEnum.interviewer,
        text: `Quick concept question (${topic}):

${question}`,
        turnAt: params.startTime,
      },
    ],
  };
}