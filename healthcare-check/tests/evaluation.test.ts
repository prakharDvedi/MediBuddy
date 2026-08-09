import assert from "node:assert/strict";
import test from "node:test";
import { checkInsuranceCoverage } from "../lib/audit/insurance-coverage.ts";
import { checkMedicinePriceObservations, type MedicineProductRow } from "../lib/audit/medicine-price.ts";
import { checkPackageOverlap } from "../lib/audit/package-overlap.ts";
import { checkPrices } from "../lib/audit/price.ts";
import { checkQuantities } from "../lib/audit/quantity.ts";
import { checkUnexplained } from "../lib/audit/unexplained.ts";
import { checkDuplicates } from "../lib/audit/duplicates.ts";
import { checkMedicineSavings } from "../lib/audit/savings.ts";
import type { ExtractedItemRow, InsurancePolicyRow, ReferenceItemRow } from "../lib/audit/types.ts";
import { computeEstimateComparison } from "../lib/insurance/compare.ts";
import { resolveMedicineIdentity } from "../lib/medicines/match.ts";
import { normalizeMedicineIdentity } from "../lib/medicines/normalize.ts";
import type { MedicinePriceObservation } from "../lib/medicines/types.ts";
import { chunkPolicyPages, computeDerivedPolicyFacts, searchPolicyChunks } from "../lib/rag/policy.ts";
import {
  medicineAliases,
  medicineEvaluationFixtures,
  medicineProducts,
} from "./fixtures/evaluation-fixtures.ts";

function item(overrides: Partial<ExtractedItemRow> = {}): ExtractedItemRow {
  return {
    id: "item",
    document_id: "document",
    item_type: "medicine",
    name: "Paracetamol 500 mg tablet",
    normalized_name: "paracetamol 500 mg tablet",
    quantity: 1,
    unit_price: 5,
    total_price: 5,
    source_page: 1,
    raw_text: "Paracetamol 500 mg tablet",
    confidence: "high",
    medicine_identity: null,
    medicine_product_id: null,
    medicine_match_status: null,
    medicine_match_confidence: null,
    medicine_match_reason: null,
    ...overrides,
  };
}

function reference(overrides: Partial<ReferenceItemRow> = {}): ReferenceItemRow {
  return {
    id: "reference",
    category: "test",
    name: "CBC test",
    normalized_name: "cbc test",
    reference_price: 100,
    unit: "test",
    source_name: "Reviewed reference",
    source_url: "https://example.test/reference",
    medicine_product_id: null,
    ...overrides,
  };
}

function observation(overrides: Partial<MedicinePriceObservation> = {}): MedicinePriceObservation {
  return {
    id: "observation",
    medicine_product_id: "ceftriaxone-1g-injection",
    source_kind: "nppa",
    source_record_id: "nppa:ceftriaxone-1g",
    price_kind: "ceiling_price",
    amount: 63.88,
    currency: "INR",
    sale_unit: "each vial",
    pack_text: "Each Vial",
    pack_quantity: 1,
    pack_unit: "vial",
    tax_status: "excluded",
    effective_date: "2026-03-25",
    observed_at: "2026-08-09T00:00:00.000Z",
    source_name: "NPPA ceiling price",
    source_url: "https://nppaipdms.gov.in",
    raw_source: { record: "ceftriaxone-1g" },
    ...overrides,
  };
}

test("medicine fixture corpus resolves 20 known bill, estimate, and prescription cases", () => {
  assert.equal(medicineEvaluationFixtures.length, 20);

  for (const fixture of medicineEvaluationFixtures) {
    const result = resolveMedicineIdentity(
      fixture.identity,
      fixture.text,
      fixture.text,
      medicineProducts,
      medicineAliases,
    );

    assert.equal(result.status, fixture.expectedStatus, fixture.id);
    assert.equal(result.product_id, fixture.expectedProductId, fixture.id);
  }
});

test("medicine normalization preserves strength and does not turn pack counts into concentration", () => {
  const gram = medicineEvaluationFixtures.find((fixture) => fixture.id === "prescription-gram-to-milligram");
  assert.ok(gram);
  const normalized = normalizeMedicineIdentity(gram.identity, gram.text, gram.text);
  assert.match(normalized.signature, /1000 mg/);
  assert.doesNotMatch(normalized.signature, /\/10 tablet/);

  const pack = medicineEvaluationFixtures.find((fixture) => fixture.id === "bill-paracetamol-pack-context");
  assert.ok(pack);
  const packNormalized = normalizeMedicineIdentity(pack.identity, pack.text, pack.text);
  assert.equal(packNormalized.pack_quantity, 10);
  assert.equal(packNormalized.pack_unit, "tablet");
  assert.doesNotMatch(packNormalized.signature, /\/10/);
});

test("audit fixture produces known findings across pricing, quantity, duplicates, overlap, and unexplained charges", () => {
  const cbc = item({
    id: "cbc",
    item_type: "test",
    name: "CBC test",
    normalized_name: "cbc test",
    unit_price: 150,
    total_price: 150,
    raw_text: "CBC test 1 150",
  });
  const duplicateA = item({ id: "duplicate-a", name: "Room rent", normalized_name: "room rent", item_type: "charge", raw_text: "Room rent 1 5000" });
  const duplicateB = item({ id: "duplicate-b", name: "Room rent", normalized_name: "room rent", item_type: "charge", raw_text: "Room rent 1 5000", source_page: 2 });
  const highQuantity = item({ id: "quantity", name: "Paracetamol 500 mg tablet", quantity: 31, normalized_name: "paracetamol 500 mg tablet" });
  const packageItem = item({ id: "package", item_type: "procedure", name: "Appendectomy laparoscopic", normalized_name: "appendectomy laparoscopic", total_price: 50000 });
  const overlapItem = item({ id: "overlap", item_type: "charge", name: "Anesthesia charge", normalized_name: "anesthesia charge", total_price: 5000 });
  const unexplained = item({ id: "unexplained", item_type: "charge", name: "Miscellaneous charges", normalized_name: "miscellaneous charges", total_price: 1000 });

  assert.deepEqual(checkPrices([cbc], [reference()]).map((finding) => finding.finding_type), ["price"]);
  assert.deepEqual(checkDuplicates([duplicateA, duplicateB]).map((finding) => finding.finding_type), ["duplicate"]);
  assert.deepEqual(checkQuantities([highQuantity]).map((finding) => finding.finding_type), ["quantity"]);
  assert.deepEqual(checkPackageOverlap([packageItem, overlapItem]).map((finding) => finding.finding_type), ["package_overlap"]);
  assert.deepEqual(checkUnexplained([unexplained]).map((finding) => finding.finding_type), ["unexplained"]);
});

test("medicine price fixture only calculates savings for a resolved, compatible NPPA unit", () => {
  const medicine = item({
    id: "ceftriaxone",
    name: "Ceftriaxone 1 g injection vial",
    normalized_name: "ceftriaxone 1 g injection vial",
    unit_price: 480,
    total_price: 480,
    raw_text: "Ceftriaxone 1 g injection vial 1 480",
    medicine_identity: {
      brand_name: null,
      components: [{ ingredient_name: "Ceftriaxone", strength_value: 1000, strength_unit: "mg", denominator_value: null, denominator_unit: null }],
      dosage_form: "injection",
      route: "injectable",
      pack_text: "1 vial",
      pack_quantity: 1,
      pack_unit: "vial",
    },
  });
  const resolution = resolveMedicineIdentity(medicine.medicine_identity as Parameters<typeof resolveMedicineIdentity>[0], medicine.name, medicine.normalized_name, medicineProducts, medicineAliases);
  const products: MedicineProductRow[] = medicineProducts;
  const findings = checkMedicinePriceObservations([medicine], new Map([[medicine.id, resolution]]), [observation()]);

  assert.equal(products.length, 8);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].finding_type, "medicine_savings");
  assert.equal(findings[0].evidence.potential_price_difference, 416.12);

  const unspecified = {
    ...medicine,
    id: "unspecified",
    name: "Ceftriaxone 1 g injection",
    raw_text: "Ceftriaxone 1 g injection 1 480",
    medicine_identity: { ...medicine.medicine_identity, pack_text: null, pack_quantity: null, pack_unit: null },
  };
  const unsafeFindings = checkMedicinePriceObservations([unspecified], new Map([[unspecified.id, resolution]]), [observation()]);
  assert.equal(unsafeFindings[0].finding_type, "unit_unverified");
  assert.equal(unsafeFindings[0].evidence.potential_price_difference, undefined);
});

test("legacy reference and policy fixtures preserve fail-closed behavior", () => {
  const legacyMedicine = item({ id: "legacy", unit_price: 5, raw_text: "Paracetamol 500 mg tablet" });
  const legacyReference = reference({ category: "medicine", normalized_name: "paracetamol 500 mg tablet", name: "Paracetamol 500 mg tablet", reference_price: 1, unit: "1 tablet" });
  assert.equal(checkMedicineSavings([legacyMedicine], [legacyReference])[0].finding_type, "medicine_savings");

  const policy: InsurancePolicyRow = {
    id: "policy",
    document_id: "policy-document",
    sum_insured: 500000,
    room_rent_limit: 5000,
    icu_limit: 10000,
    copay_percent: 10,
    deductible: 10000,
    waiting_periods: [{ condition: "Pre-existing disease", duration: "24 months" }],
    sub_limits: [{ category: "Cataract", limit_amount: 30000, limit_percent: null }],
    exclusions: [],
    consumables_covered: false,
    other_conditions: [],
  };
  const coverageFindings = checkInsuranceCoverage([policy]);
  assert.equal(coverageFindings.length, 7);
  assert.ok(coverageFindings.every((finding) => finding.finding_type === "coverage_gap"));
});

test("policy retrieval and calculation fixtures preserve source context and deterministic arithmetic", async () => {
  const chunks = chunkPolicyPages([
    { pageNumber: 3, content: "Section 4: Cataract sub-limit is 2 percent of sum insured." },
    { pageNumber: 5, content: "Section 7: A deductible of 10000 applies." },
  ]);
  assert.equal(chunks.length, 2);
  assert.deepEqual(chunks.map((chunk) => [chunk.page, chunk.sectionTitle]), [[3, "Section 4"], [5, "Section 7"]]);

  const policy: InsurancePolicyRow = {
    id: "comparison-policy",
    document_id: "policy-document",
    sum_insured: 500000,
    room_rent_limit: null,
    icu_limit: null,
    copay_percent: 10,
    deductible: 10000,
    waiting_periods: [],
    sub_limits: [{ category: "Cataract", limit_amount: null, limit_percent: 2 }],
    exclusions: [],
    consumables_covered: null,
    other_conditions: [],
  };
  assert.deepEqual(computeDerivedPolicyFacts(policy), [{ label: "Cataract sub-limit", amount: 10000, formula: "2% of sum insured (₹500000)" }]);

  const comparison = computeEstimateComparison([
    item({ id: "cataract", item_type: "procedure", name: "Cataract surgery", normalized_name: "cataract surgery", unit_price: 50000, total_price: 50000 }),
    item({ id: "room", item_type: "charge", name: "Room rent", normalized_name: "room rent", unit_price: 10000, total_price: 10000 }),
  ], policy);
  assert.deepEqual(
    {
      totalBilled: comparison.totalBilled,
      admissibleBeforeDeductible: comparison.admissibleBeforeDeductible,
      deductibleApplied: comparison.deductibleApplied,
      copayAmount: comparison.copayAmount,
      insurerPays: comparison.insurerPays,
      patientPays: comparison.patientPays,
    },
    { totalBilled: 60000, admissibleBeforeDeductible: 20000, deductibleApplied: 10000, copayAmount: 1000, insurerPays: 9000, patientPays: 51000 },
  );

  const calls: { documentIds: string[]; query: string; limit: number }[] = [];
  const supabase = {
    rpc: async (_name: string, args: { p_document_ids: string[]; p_query: string; p_limit: number }) => {
      calls.push({ documentIds: args.p_document_ids, query: args.p_query, limit: args.p_limit });
      return {
        data: [{ id: "chunk-1", document_id: "policy-document", chunk_index: 0, page: 3, section_title: "Section 4", content: "Cataract sub-limit", rank: 0.9 }],
        error: null,
      };
    },
  } as unknown as Parameters<typeof searchPolicyChunks>[0];
  const ranked = await searchPolicyChunks(supabase, ["policy-document"], "cataract", 1);
  assert.deepEqual(calls, [{ documentIds: ["policy-document"], query: "cataract", limit: 1 }]);
  assert.deepEqual(ranked[0], { id: "chunk-1", documentId: "policy-document", chunkIndex: 0, page: 3, sectionTitle: "Section 4", content: "Cataract sub-limit", rank: 0.9 });
});
