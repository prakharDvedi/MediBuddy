import type { PolicyAnswer, PolicyAnswerLanguage } from "@/lib/documents/policy-language";

const GROQ_POLICY_QA_MODEL = "openai/gpt-oss-20b";

export type PolicyExcerpt = {
  page: number | null;
  section: string | null;
  content: string;
};

export type PolicyFact = {
  label: string;
  amount: number;
  formula: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    basis: {
      type: "string",
      enum: ["policy_states", "calculated_from_policy", "requires_confirmation"],
    },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          page: { type: ["integer", "null"] },
          section: { type: ["string", "null"] },
        },
        required: ["page", "section"],
        additionalProperties: false,
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["answer", "basis", "citations", "confidence"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You answer a policyholder's question about their specific insurance policy using
ONLY the original question, policy excerpts, and precomputed facts given to you in this request. You
have no other source of truth — never use general insurance knowledge, never assume standard
industry practice, and never state a number, condition, or coverage term that isn't in the given
material.

Answer in the requested answer_language. For Hindi, use clear, natural Hindi while keeping
important policy terms such as room rent, ICU, co-pay, deductible, and sub-limit in English when
that makes the meaning clearer. Do not translate or change citation fields. Preserve every amount,
percentage, limit, and duration exactly as provided. The answer language affects only the
explanation, not the evidence or calculations.

Set basis to exactly one of:
- "policy_states": the excerpts directly state the answer.
- "calculated_from_policy": the answer relies on a precomputed fact provided to you — use that
  number exactly as given, never recompute or adjust it yourself.
- "requires_confirmation": the excerpts and facts don't contain enough information to answer
  confidently. Say so plainly in the answer and recommend the policyholder confirm with their
  insurer. Do not guess or fill the gap with outside knowledge.

citations: list the page and section label (exactly as given in the excerpts, do not invent a
label) for every excerpt you actually relied on. Leave it empty when basis is
"requires_confirmation".

confidence: how directly the excerpts/facts answer the question — "high" only when the excerpts
state the answer plainly, "low" for requires_confirmation or thin/indirect matches.`;

function citationKey(page: number | null, section: string | null): string {
  return `${page ?? "null"}::${section ?? "null"}`;
}

function normalizeCitations(value: unknown, excerpts: PolicyExcerpt[]): { page: number | null; section: string | null }[] {
  const allowed = new Set(excerpts.map((excerpt) => citationKey(excerpt.page, excerpt.section)));
  if (!Array.isArray(value)) return [];

  return value.flatMap((citation) => {
    if (!citation || typeof citation !== "object") return [];
    const candidate = citation as { page?: unknown; section?: unknown };
    const page = candidate.page === null || Number.isInteger(candidate.page) ? candidate.page as number | null : null;
    const section = candidate.section === null || typeof candidate.section === "string" ? candidate.section as string | null : null;
    return allowed.has(citationKey(page, section)) ? [{ page, section }] : [];
  });
}

/**
 * Answers a free-text policy question, grounded strictly in retrieved
 * chunks (full-text search results) and deterministically precomputed
 * facts (e.g. percent-of-sum-insured sub-limits already multiplied out in
 * code). The model never does arithmetic and never falls back to general
 * insurance knowledge — see SYSTEM_PROMPT.
 */
export async function answerPolicyQuestion(
  question: string,
  answerLanguage: PolicyAnswerLanguage,
  excerpts: PolicyExcerpt[],
  facts: PolicyFact[],
): Promise<PolicyAnswer> {
  const userContent = JSON.stringify(
    {
      original_question: question,
      answer_language: answerLanguage,
      excerpts,
      precomputed_facts: facts,
    },
    null,
    2,
  );

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_POLICY_QA_MODEL,
      temperature: 0,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "policy_answer",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq policy Q&A request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

  return {
    answer: typeof parsed.answer === "string" ? parsed.answer : "",
    basis: parsed.basis ?? "requires_confirmation",
    citations: normalizeCitations(parsed.citations, excerpts),
    confidence: parsed.confidence ?? "low",
  };
}
