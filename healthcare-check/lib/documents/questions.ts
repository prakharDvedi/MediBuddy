const GROQ_QUESTIONS_MODEL = "openai/gpt-oss-20b";

export type FindingForQuestions = {
  id: string;
  finding_type: string;
  title: string;
  description: string;
};

export type GeneratedQuestion = {
  findingId: string | null;
  question: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding_id: { type: ["string", "null"] },
          question: { type: "string" },
        },
        required: ["finding_id", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You write short, specific questions a patient can bring to their hospital's
billing department, or their insurer, about items already flagged by an automated check.
Findings with finding_type "coverage_gap" are about insurance policy terms — address those
questions to the insurer ("Ask my insurer..." framing). All other finding types are about
hospital bills — address those to the hospital's billing department.

Ground every question only in the finding's title/description given to you — do not add
medical opinions, do not claim the hospital or insurer did anything wrong, do not speculate beyond
what's stated. These are neutral, fact-finding questions ("Can you clarify...", "Could you break down...",
"Was ... already included in ..."), not accusations.

Write one question per finding_id given, using that exact finding_id in your response so it can be
linked back. If (and only if) it would genuinely help, you may add up to one additional general
question with finding_id set to null — otherwise omit it entirely.`;

/**
 * Turns deterministic audit findings into patient-facing questions to ask
 * the hospital. The facts (prices, quantities, duplicates) already came
 * from the audit engine — this call only phrases the ask, it never
 * re-derives or restates numbers on its own.
 */
export async function generateQuestions(
  findings: FindingForQuestions[],
): Promise<GeneratedQuestion[]> {
  if (findings.length === 0) return [];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_QUESTIONS_MODEL,
      temperature: 0.3,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(findings, null, 2) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hospital_questions",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq questions request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

  return (parsed.questions ?? []).map((q: { finding_id: string | null; question: string }) => ({
    findingId: q.finding_id,
    question: q.question,
  }));
}
