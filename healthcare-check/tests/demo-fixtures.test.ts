import assert from "node:assert/strict";
import test from "node:test";
import { computeEstimateComparison } from "../lib/insurance/compare.ts";
import { DEMO_BILL_FIXTURE, DEMO_INSURANCE_FIXTURE } from "../lib/demo/fixtures.ts";
import type { InsurancePolicyRow } from "../lib/audit/types.ts";

test("hospital demo fixture preserves stored reference units and source pages", () => {
  assert.equal(DEMO_BILL_FIXTURE.references.nppa.saleUnit, "each vial");
  assert.deepEqual(
    {
      saleUnit: DEMO_BILL_FIXTURE.references.pmbi.saleUnit,
      packQuantity: DEMO_BILL_FIXTURE.references.pmbi.packQuantity,
      packUnit: DEMO_BILL_FIXTURE.references.pmbi.packUnit,
    },
    { saleUnit: "pack", packQuantity: 10, packUnit: "tablet_or_capsule" },
  );
  assert.deepEqual(DEMO_BILL_FIXTURE.references.cghs, {
    normalizedName: "consultation opd",
    rate: 350,
    rateContext: "uniform",
  });

  const document = DEMO_BILL_FIXTURE.documents[0];
  assert.equal(document.pages.length, 3);
  assert.ok(document.pages.every((page) => page.content.includes("Synthetic demo document")));
  assert.ok(document.items?.every((item) => item.source_page && item.raw_text));

  const paracetamol = document.items?.find((item) => item.normalized_name === "paracetamol tablet 500 mg");
  assert.ok(paracetamol);
  assert.equal(paracetamol.medicine_identity?.pack_quantity, 10);
  assert.equal(paracetamol.medicine_identity?.pack_unit, "tablet");
});

test("insurance demo comparison matches the disclosed sub-limit, deductible, and co-pay math", () => {
  const estimate = DEMO_INSURANCE_FIXTURE.documents.find((document) => document.doc_type === "estimate");
  assert.ok(estimate?.items);

  const items = estimate.items.map((item, index) => ({
    ...item,
    id: `demo-item-${index}`,
    document_id: "demo-estimate",
    medicine_match_status: null,
    medicine_match_confidence: null,
    medicine_match_reason: null,
    medicine_product_id: null,
  }));
  const policy: InsurancePolicyRow = {
    id: "demo-policy",
    document_id: "demo-policy-document",
    ...DEMO_INSURANCE_FIXTURE.policy,
    extraction_provenance: null,
  };

  const result = computeEstimateComparison(items, policy);
  assert.deepEqual(
    {
      totalBilled: result.totalBilled,
      subLimitDeductions: result.subLimitDeductions,
      deductibleApplied: result.deductibleApplied,
      copayAmount: result.copayAmount,
      insurerPays: result.insurerPays,
      patientPays: result.patientPays,
    },
    {
      totalBilled: 100000,
      subLimitDeductions: 22000,
      deductibleApplied: 10000,
      copayAmount: 6800,
      insurerPays: 61200,
      patientPays: 38800,
    },
  );
  assert.equal(DEMO_INSURANCE_FIXTURE.policy.room_rent_limit, 7500);
  assert.equal(DEMO_INSURANCE_FIXTURE.policy.consumables_covered, false);
});
