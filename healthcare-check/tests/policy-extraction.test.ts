import assert from "node:assert/strict";
import test from "node:test";
import { chunkPolicyPages, estimatePolicyTokens, splitPolicyChunk, type PolicyChunk } from "../lib/rag/policy.ts";
import { mergePolicyExtractions } from "../lib/documents/policy-merge.ts";
import { answerPolicyQuestion } from "../lib/documents/policy-qa.ts";
import { normalizePolicyRetrievalQuery, rewritePolicyQuestion } from "../lib/documents/policy-query.ts";
import { normalizePolicyAnswerLanguage } from "../lib/documents/policy-language.ts";
import { FINDING_COPY, FINDING_TYPES } from "../lib/i18n/finding-copy.ts";
import { normalizeLocale, SUPPORTED_LOCALES } from "../lib/i18n/types.ts";
import { APP_COPY } from "../lib/i18n/app-copy.ts";
import type { ExtractedPolicy } from "../lib/documents/policy.ts";

function policy(overrides: Partial<ExtractedPolicy> = {}): ExtractedPolicy {
  return {
    sumInsured: null,
    roomRentLimit: null,
    icuLimit: null,
    copayPercent: null,
    deductible: null,
    waitingPeriods: [],
    subLimits: [],
    exclusions: [],
    consumablesCovered: null,
    otherConditions: [],
    suggestedTitle: "Insurance Policy",
    ...overrides,
  };
}

function extraction(content: string, value: ExtractedPolicy): { chunk: PolicyChunk; policy: ExtractedPolicy } {
  return { chunk: { page: 2, sectionTitle: "Section 3", content }, policy: value };
}

test("policy chunks stay bounded and preserve page and section provenance", () => {
  const chunks = chunkPolicyPages([
    {
      pageNumber: 4,
      content: "Preamble Section 1: " + "coverage terms repeated ".repeat(20) + " Section 2: Room rent is limited.",
    },
  ], 20);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.page === 4));
  assert.ok(chunks.every((chunk) => estimatePolicyTokens(chunk.content) <= 20));
  assert.equal(chunks[0].sectionTitle, null);
  assert.ok(chunks.some((chunk) => chunk.sectionTitle === "Section 1"));
  assert.ok(chunks.some((chunk) => chunk.sectionTitle === "Section 2"));
});

test("oversized extraction fallback keeps the original section label", () => {
  const original: PolicyChunk = { page: 8, sectionTitle: "Clause 12", content: "term ".repeat(100) };
  const smaller = splitPolicyChunk(original, 10);

  assert.ok(smaller.length > 1);
  assert.ok(smaller.every((chunk) => chunk.page === 8 && chunk.sectionTitle === "Clause 12"));
  assert.ok(smaller.every((chunk) => estimatePolicyTokens(chunk.content) <= 10));
});

test("policy merge records scalar conflicts instead of choosing the later value", () => {
  const result = mergePolicyExtractions([
    extraction("first", policy({ sumInsured: 500000, consumablesCovered: true })),
    extraction("second", policy({ sumInsured: 600000, consumablesCovered: false })),
  ]);

  assert.equal(result.policy.sumInsured, null);
  assert.equal(result.policy.consumablesCovered, null);
  assert.equal(result.provenance.sum_insured.status, "requires_confirmation");
  assert.equal(result.provenance.sum_insured.values.length, 2);
  assert.equal(result.provenance.consumables_covered.status, "requires_confirmation");
});

test("policy merge deduplicates arrays and preserves waiting-period and sub-limit conflicts", () => {
  const result = mergePolicyExtractions([
    extraction("first", policy({
      waitingPeriods: [{ condition: "Pre-existing disease", duration: "24 months" }],
      subLimits: [{ category: "Cataract", limit_amount: 30000, limit_percent: null }],
      exclusions: ["Cosmetic treatment"],
    })),
    extraction("second", policy({
      waitingPeriods: [
        { condition: "pre-existing disease", duration: "36 months" },
        { condition: "Initial waiting period", duration: "30 days" },
      ],
      subLimits: [
        { category: "cataract", limit_amount: 40000, limit_percent: null },
        { category: "Ambulance", limit_amount: 5000, limit_percent: null },
      ],
      exclusions: [" cosmetic   treatment ", "War-related injury"],
    })),
  ]);

  assert.equal(result.policy.waitingPeriods.length, 3);
  assert.equal(result.provenance.waiting_periods.status, "requires_confirmation");
  assert.equal(result.policy.subLimits.length, 3);
  assert.equal(result.provenance.sub_limits.status, "requires_confirmation");
  assert.deepEqual(result.policy.exclusions, ["Cosmetic treatment", "War-related injury"]);
});

test("policy language selection stays explicit and retrieval terms stay compact", () => {
  assert.equal(normalizePolicyAnswerLanguage("hi"), "hi");
  assert.equal(normalizePolicyAnswerLanguage("fr"), "en");

  const original = "Meri policy mein room rent ka limit kya hai?";
  assert.equal(
    normalizePolicyRetrievalQuery("  room   rent limit accommodation eligibility  ", original),
    "room rent limit accommodation eligibility",
  );
  assert.equal(
    normalizePolicyRetrievalQuery("यह एक हिंदी खोज वाक्य है", original),
    original,
  );
  assert.equal(
    normalizePolicyRetrievalQuery("this is a verbose sentence that should not be used as a search query because it is too long", original),
    original,
  );
});

test("policy retrieval rewrite returns compact terms and preserves the original on provider failure", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;

  try {
    globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ search_terms: "room rent limit accommodation eligibility" }) } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    const originalQuestion = "Meri policy mein room rent ka limit kya hai?";
    assert.equal(await rewritePolicyQuestion(originalQuestion), "room rent limit accommodation eligibility");
    assert.ok(requestBody);
    const rewriteRequestBody = requestBody as { response_format: unknown };
    assert.deepEqual(rewriteRequestBody.response_format, {
      type: "json_schema",
      json_schema: {
        name: "policy_retrieval_query",
        strict: true,
        schema: {
          type: "object",
          properties: { search_terms: { type: "string" } },
          required: ["search_terms"],
          additionalProperties: false,
        },
      },
    });

    globalThis.fetch = async () => new Response("provider unavailable", { status: 503 });
    assert.equal(await rewritePolicyQuestion(originalQuestion), originalQuestion);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("policy answer request keeps answer language separate from retrieval input", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | null = null;

  try {
    globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          answer: "आपकी पॉलिसी में room rent limit ₹7,500 प्रति दिन है।",
          basis: "policy_states",
          citations: [
            { page: 3, section: "Section 2" },
            { page: 99, section: "Invented section" },
          ],
          confidence: "high",
        }) } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    const result = await answerPolicyQuestion(
      "Meri policy mein room rent ka limit kya hai?",
      "hi",
      [{ page: 3, section: "Section 2", content: "Room-rent limit is ₹7,500 per day." }],
      [],
    );

    assert.ok(requestBody);
    const answerRequestBody = requestBody as { messages: { role: string; content: string }[] };
    const messages = answerRequestBody.messages;
    const userMessage = messages.find((message) => message.role === "user");
    const systemMessage = messages.find((message) => message.role === "system");
    const userPayload = JSON.parse(userMessage?.content ?? "{}") as Record<string, unknown>;
    assert.equal(userPayload.original_question, "Meri policy mein room rent ka limit kya hai?");
    assert.equal(userPayload.answer_language, "hi");
    assert.match(systemMessage?.content ?? "", /Answer in the requested answer_language/);
    assert.deepEqual(result.citations, [{ page: 3, section: "Section 2" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("finding copy stays complete for every supported locale and finding type", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const copy = FINDING_COPY[locale];
    for (const findingType of FINDING_TYPES) {
      assert.ok(copy.typeLabels[findingType]);
      assert.ok(copy.questions[findingType]);
      assert.ok(copy.explanations[findingType]);
    }
    assert.ok(copy.severityLabels.high);
    assert.ok(copy.severityLabels.medium);
    assert.ok(copy.severityLabels.low);
    assert.ok(copy.audienceLabels.hospital);
    assert.ok(copy.audienceLabels.insurer);
    assert.ok(copy.questionsFor.hospital);
    assert.ok(copy.questionsFor.insurer);
  }

  assert.equal(normalizeLocale("hi"), "hi");
  assert.equal(normalizeLocale("mr"), "en");
});

test("app copy covers the global shell and primary user flows in every locale", () => {
  for (const locale of SUPPORTED_LOCALES) {
    const copy = APP_COPY[locale];
    assert.ok(copy.shell.login);
    assert.ok(copy.shell.language);
    assert.ok(copy.dashboard.headline);
    assert.ok(copy.auth.login);
    assert.ok(copy.upload.chooseFile);
    assert.ok(copy.caseReview.documents);
    assert.equal(Object.keys(copy.home.intents).length, 3);
    assert.equal(copy.upload.standardStages.length, 3);
    assert.equal(copy.upload.policyStages.length, 4);
  }
});
