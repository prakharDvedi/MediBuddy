const GROQ_POLICY_QUERY_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_RETRIEVAL_QUERY_LENGTH = 180;
const MAX_RETRIEVAL_QUERY_WORDS = 12;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    search_terms: { type: "string" },
  },
  required: ["search_terms"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You rewrite a policyholder's Hindi, Hinglish, mixed-language, or English
question into compact English search terms for PostgreSQL full-text search over an English insurance
policy. Return only a short space-separated list of English keywords or noun phrases, never a full
sentence and never an answer.

Preserve the important policy concepts. Prefer terms such as "room rent limit", "ICU limit",
"co-pay", "deductible", "waiting period", "exclusion", "sub-limit", "maternity", and
"accommodation eligibility" when they match the question. Do not invent policy facts, numbers, or
coverage. Keep the result to at most 12 words.`;

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function containsDevanagari(value: string): boolean {
  return /[\u0900-\u097F]/u.test(value);
}

/**
 * Accepts only a compact candidate. The original question is the safe fallback
 * because a failed rewrite must not make an otherwise valid English question
 * disappear from retrieval.
 */
export function normalizePolicyRetrievalQuery(candidate: unknown, originalQuestion: string): string {
  const fallback = collapseWhitespace(originalQuestion);
  if (typeof candidate !== "string") return fallback;

  const normalized = collapseWhitespace(candidate);
  const wordCount = normalized ? normalized.split(" ").length : 0;
  if (
    !normalized ||
    normalized.length > MAX_RETRIEVAL_QUERY_LENGTH ||
    wordCount > MAX_RETRIEVAL_QUERY_WORDS ||
    containsDevanagari(normalized)
  ) {
    return fallback;
  }

  return normalized;
}

/**
 * Produces retrieval-only terms. This call never translates or replaces the
 * original question used later by grounded answer generation.
 */
export async function rewritePolicyQuestion(question: string): Promise<string> {
  const originalQuestion = collapseWhitespace(question);
  if (!originalQuestion) return "";

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_POLICY_QUERY_MODEL,
        temperature: 0,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ original_question: question }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "policy_retrieval_query",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) return originalQuestion;

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as { search_terms?: unknown };
    return normalizePolicyRetrievalQuery(parsed.search_terms, originalQuestion);
  } catch {
    return originalQuestion;
  }
}
