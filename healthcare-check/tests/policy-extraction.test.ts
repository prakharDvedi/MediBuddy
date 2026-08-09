import assert from "node:assert/strict";
import test from "node:test";
import { chunkPolicyPages, estimatePolicyTokens, splitPolicyChunk, type PolicyChunk } from "../lib/rag/policy.ts";
import { mergePolicyExtractions } from "../lib/documents/policy-merge.ts";
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
