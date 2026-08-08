const GROQ_POLICY_MODEL = "openai/gpt-oss-20b";

export type ExtractedPolicy = {
  sumInsured: number | null;
  roomRentLimit: number | null;
  icuLimit: number | null;
  copayPercent: number | null;
  deductible: number | null;
  waitingPeriods: { condition: string; duration: string }[];
  subLimits: { category: string; limit_amount: number | null; limit_percent: number | null }[];
  exclusions: string[];
  consumablesCovered: boolean | null;
  otherConditions: string[];
  suggestedTitle: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    suggested_title: { type: "string" },
    sum_insured: { type: ["number", "null"] },
    room_rent_limit: { type: ["number", "null"] },
    icu_limit: { type: ["number", "null"] },
    copay_percent: { type: ["number", "null"] },
    deductible: { type: ["number", "null"] },
    waiting_periods: {
      type: "array",
      items: {
        type: "object",
        properties: {
          condition: { type: "string" },
          duration: { type: "string" },
        },
        required: ["condition", "duration"],
        additionalProperties: false,
      },
    },
    sub_limits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          limit_amount: { type: ["number", "null"] },
          limit_percent: { type: ["number", "null"] },
        },
        required: ["category", "limit_amount", "limit_percent"],
        additionalProperties: false,
      },
    },
    exclusions: { type: "array", items: { type: "string" } },
    consumables_covered: { type: ["boolean", "null"] },
    other_conditions: { type: "array", items: { type: "string" } },
  },
  required: [
    "suggested_title",
    "sum_insured",
    "room_rent_limit",
    "icu_limit",
    "copay_percent",
    "deductible",
    "waiting_periods",
    "sub_limits",
    "exclusions",
    "consumables_covered",
    "other_conditions",
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You extract structured coverage details from a health insurance policy document.

suggested_title: a short, human-readable title for this case, combining the insurer name as written
on the document with "Policy", e.g. "SecureLife Health Insurance — Policy" or "HDFC ERGO — Policy".
If no insurer name is stated anywhere in the text, fall back to a generic label like "Insurance
Policy" — never invent an insurer name. Keep it under 60 characters.
sum_insured: the total coverage amount for the policy period, as a plain number (no currency symbols).
room_rent_limit: the per-day room rent cap, as a plain number. If it's stated only as a percentage of sum insured (e.g. "1% of sum insured per day"), convert it using the sum insured if both are given; otherwise use null.
icu_limit: the per-day ICU room cap, as a plain number, same rules as room_rent_limit.
copay_percent: the co-payment percentage the policyholder must bear, as a plain number (e.g. 10 for 10%). Null if no co-payment is mentioned.
deductible: the deductible amount, as a plain number. Null if none is stated.
waiting_periods: every waiting period mentioned (e.g. pre-existing diseases, specific procedures, initial waiting period), each with the condition it applies to and the stated duration exactly as written (e.g. "24 months").
sub_limits: any per-category caps beyond room rent/ICU (e.g. cataract surgery, ambulance charges, maternity), with the category name and either a flat limit_amount or a limit_percent (of sum insured) — use whichever the document states, null for the other.
exclusions: list of things explicitly not covered, as short phrases.
consumables_covered: true if the policy explicitly covers consumables, false if it explicitly excludes them, null if not mentioned.
other_conditions: any other notable conditions worth knowing (e.g. network hospital requirement, pre-authorization requirement), as short phrases.

Never invent a number or condition that isn't stated in the text. Use null or an empty array when the document doesn't say.`;

/**
 * Extracts structured coverage fields from an insurance policy document's
 * page text. Separate from classifyAndExtractItems (structure.ts) because
 * a policy has no billable line items — it has coverage terms instead.
 */
export async function extractPolicyDetails(
  pages: { pageNumber: number; content: string }[],
): Promise<ExtractedPolicy> {
  const documentText = pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.content}`)
    .join("\n\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_POLICY_MODEL,
      temperature: 0,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: documentText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "policy_extraction",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq policy request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

  return {
    suggestedTitle: parsed.suggested_title || "Untitled case",
    sumInsured: parsed.sum_insured ?? null,
    roomRentLimit: parsed.room_rent_limit ?? null,
    icuLimit: parsed.icu_limit ?? null,
    copayPercent: parsed.copay_percent ?? null,
    deductible: parsed.deductible ?? null,
    waitingPeriods: parsed.waiting_periods ?? [],
    subLimits: parsed.sub_limits ?? [],
    exclusions: parsed.exclusions ?? [],
    consumablesCovered: parsed.consumables_covered ?? null,
    otherConditions: parsed.other_conditions ?? [],
  };
}
