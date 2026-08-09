import {
  estimatePolicyTokens,
  POLICY_CHUNK_MAX_TOKENS,
  splitPolicyChunk,
  type PolicyChunk,
} from "@/lib/rag/policy";
import {
  mergePolicyExtractions,
  type PolicyChunkExtraction,
  type PolicyProvenance,
} from "@/lib/documents/policy-merge";

const GROQ_POLICY_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TOKEN_BUDGET_PER_MINUTE = 7600;
const OUTPUT_TOKEN_ESTIMATE = 500;
const MAX_RETRIES = 3;
const RETRIABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

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

export type PolicyExtractionResult = {
  policy: ExtractedPolicy;
  provenance: PolicyProvenance;
  chunks: PolicyChunk[];
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

const SYSTEM_PROMPT = `You extract structured coverage details from one bounded chunk of a health insurance policy.

Extract only facts directly supported by this chunk. Use null or an empty array when the chunk does not contain the fact.

suggested_title: return the insurer name plus "Policy" only when the insurer is stated in this chunk; otherwise return "Insurance Policy".
sum_insured: the total coverage amount for the policy period, as a plain number (no currency symbols).
room_rent_limit: the per-day room rent cap, as a plain number. Convert a stated percentage only when the required sum insured is also present in this chunk; otherwise use null.
icu_limit: the per-day ICU room cap, using the same rule as room_rent_limit.
copay_percent: the co-payment percentage as a plain number. Null if not mentioned in this chunk.
deductible: the deductible amount as a plain number. Null if not mentioned in this chunk.
waiting_periods: every waiting period in this chunk, each with its condition and stated duration exactly as written.
sub_limits: every per-category cap in this chunk, with either a flat limit_amount or limit_percent and null for the other.
exclusions: things explicitly not covered in this chunk, as short phrases.
consumables_covered: true if this chunk explicitly covers consumables, false if it explicitly excludes them, null otherwise.
other_conditions: notable conditions in this chunk, as short phrases.

Never invent a number, condition, insurer, or coverage term.`;

class GroqPolicyError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "GroqPolicyError";
  }
}

class TokenBudget {
  private windowStartedAt = Date.now();
  private used = 0;

  async reserve(tokens: number): Promise<void> {
    const now = Date.now();
    if (now - this.windowStartedAt >= 60_000) {
      this.windowStartedAt = now;
      this.used = 0;
    }

    if (this.used + tokens > TOKEN_BUDGET_PER_MINUTE) {
      const waitMs = Math.max(0, 60_000 - (now - this.windowStartedAt) + 50);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.windowStartedAt = Date.now();
      this.used = 0;
    }

    this.used += tokens;
  }

  reconcile(estimatedTokens: number, actualTokens: number | null): void {
    if (actualTokens == null) return;
    this.used += actualTokens - estimatedTokens;
  }
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : null;
}

function retryDelayMs(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs != null) return retryAfterMs;
  return Math.min(8_000, 1_000 * 2 ** attempt) + Math.floor(Math.random() * 250);
}

function normalizePolicy(parsed: Record<string, unknown>): ExtractedPolicy {
  return {
    suggestedTitle: typeof parsed.suggested_title === "string" ? parsed.suggested_title : "Insurance Policy",
    sumInsured: typeof parsed.sum_insured === "number" ? parsed.sum_insured : null,
    roomRentLimit: typeof parsed.room_rent_limit === "number" ? parsed.room_rent_limit : null,
    icuLimit: typeof parsed.icu_limit === "number" ? parsed.icu_limit : null,
    copayPercent: typeof parsed.copay_percent === "number" ? parsed.copay_percent : null,
    deductible: typeof parsed.deductible === "number" ? parsed.deductible : null,
    waitingPeriods: Array.isArray(parsed.waiting_periods) ? parsed.waiting_periods as ExtractedPolicy["waitingPeriods"] : [],
    subLimits: Array.isArray(parsed.sub_limits) ? parsed.sub_limits as ExtractedPolicy["subLimits"] : [],
    exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions.filter((item): item is string => typeof item === "string") : [],
    consumablesCovered: typeof parsed.consumables_covered === "boolean" ? parsed.consumables_covered : null,
    otherConditions: Array.isArray(parsed.other_conditions) ? parsed.other_conditions.filter((item): item is string => typeof item === "string") : [],
  };
}

async function requestPolicyChunk(chunk: PolicyChunk, budget: TokenBudget): Promise<ExtractedPolicy> {
  const userContent = JSON.stringify({
    page: chunk.page,
    section: chunk.sectionTitle,
    text: chunk.content,
  });
  const estimatedTokens = estimatePolicyTokens(SYSTEM_PROMPT) + estimatePolicyTokens(userContent) + OUTPUT_TOKEN_ESTIMATE;

  for (let attempt = 0; ; attempt++) {
    await budget.reserve(estimatedTokens);
    const response = await fetch(GROQ_URL, {
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
          { role: "user", content: userContent },
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

    if (response.ok) {
      const data = await response.json();
      budget.reconcile(estimatedTokens, typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : null);
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Record<string, unknown>;
      return normalizePolicy(parsed);
    }

    const errorBody = await response.text();
    const error = new GroqPolicyError(response.status, `Groq policy request failed (${response.status}): ${errorBody}`, parseRetryAfterMs(response.headers.get("Retry-After")));
    if (!RETRIABLE_STATUSES.has(error.status) || attempt >= MAX_RETRIES) throw error;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt, error.retryAfterMs)));
  }
}

async function extractChunkWithRecovery(
  chunk: PolicyChunk,
  budget: TokenBudget,
  maxTokens = POLICY_CHUNK_MAX_TOKENS,
): Promise<PolicyChunkExtraction[]> {
  try {
    return [{ chunk, policy: await requestPolicyChunk(chunk, budget) }];
  } catch (error) {
    if (!(error instanceof GroqPolicyError) || error.status !== 413) throw error;

    const smallerMaxTokens = Math.max(500, Math.floor(maxTokens / 2));
    const smallerChunks = splitPolicyChunk(chunk, smallerMaxTokens);
    if (smallerChunks.length <= 1) throw error;

    const extracted: PolicyChunkExtraction[] = [];
    for (const smallerChunk of smallerChunks) {
      extracted.push(...await extractChunkWithRecovery(smallerChunk, budget, smallerMaxTokens));
    }
    return extracted;
  }
}

/**
 * Extracts policy facts from bounded chunks, then merges them deterministically.
 * The returned chunks are the exact chunks used for extraction and RAG storage.
 */
export async function extractPolicyDetails(chunks: PolicyChunk[]): Promise<PolicyExtractionResult> {
  const budget = new TokenBudget();
  const extractions: PolicyChunkExtraction[] = [];

  for (const [index, chunk] of chunks.entries()) {
    console.log("[documents/policy] extracting chunk", {
      chunk: index + 1,
      total: chunks.length,
      page: chunk.page,
      section: chunk.sectionTitle,
    });
    extractions.push(...await extractChunkWithRecovery(chunk, budget));
    console.log("[documents/policy] extracted chunk", { chunk: index + 1, total: chunks.length });
  }

  const merged = mergePolicyExtractions(extractions);
  return {
    ...merged,
    chunks: extractions.map((extraction) => extraction.chunk),
  };
}
