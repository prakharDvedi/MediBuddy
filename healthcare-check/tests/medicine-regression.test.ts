import assert from "node:assert/strict";
import test from "node:test";
import { resolveMedicineIdentity } from "../lib/medicines/match.ts";
import { normalizeMedicineIdentity } from "../lib/medicines/normalize.ts";
import { verifyMedicineObservationUnit } from "../lib/audit/medicine-price.ts";
import type { ExtractedItemRow } from "../lib/audit/types";
import type { ExtractedMedicineIdentity, MedicinePriceObservation } from "../lib/medicines/types";

const emptyIdentity = {
  brand_name: null,
  components: [],
  dosage_form: null,
  route: null,
  pack_text: null,
  pack_quantity: null,
  pack_unit: null,
};

function item(name: string, identityValue: ExtractedMedicineIdentity): ExtractedItemRow {
  return {
    id: name,
    document_id: "document",
    item_type: "medicine",
    name,
    normalized_name: name.toLowerCase(),
    quantity: 1,
    unit_price: 100,
    total_price: 100,
    source_page: 1,
    raw_text: name,
    confidence: "high",
    medicine_identity: identityValue,
    medicine_product_id: null,
    medicine_match_status: null,
    medicine_match_confidence: null,
    medicine_match_reason: null,
  };
}

function observation(overrides: Partial<MedicinePriceObservation>): MedicinePriceObservation {
  return {
    id: "observation",
    medicine_product_id: "product",
    source_kind: "nppa",
    source_record_id: "record",
    price_kind: "ceiling_price",
    amount: 10,
    currency: "INR",
    sale_unit: "each vial",
    pack_text: null,
    pack_quantity: 1,
    pack_unit: "vial",
    tax_status: "excluded",
    effective_date: "2026-03-25",
    observed_at: "2026-08-09T00:00:00.000Z",
    source_name: "NPPA ceiling price",
    source_url: "https://nppaipdms.gov.in",
    raw_source: {},
    ...overrides,
  };
}

function identity(ingredient: string, strength: number, form: string, packUnit: string | null = null, packQuantity: number | null = null): ExtractedMedicineIdentity {
  return {
    brand_name: null,
    components: [{
      ingredient_name: ingredient,
      strength_value: strength,
      strength_unit: "mg",
      denominator_value: null,
      denominator_unit: null,
    }],
    dosage_form: form,
    route: form.includes("injection") ? "injectable" : "oral",
    pack_text: packQuantity ? `${packQuantity} ${packUnit}` : null,
    pack_quantity: packQuantity,
    pack_unit: packUnit,
  };
}

function product(id: string, name: string) {
  return {
    id,
    canonical_name: name,
    normalized_identity: name.toLowerCase(),
    dosage_form: null,
    route: null,
  };
}

test("strength is part of canonical identity", () => {
  const products = [product("500", "paracetamol tablet 500 mg"), product("650", "paracetamol tablet 650 mg")];
  const result = resolveMedicineIdentity(identity("paracetamol", 650, "tablet"), "Paracetamol 650 mg tablet", "paracetamol 650 mg tablet", products, []);
  assert.equal(result.status, "matched_exact");
  assert.equal(result.product_id, "650");
});

test("ceftriaxone 500 mg cannot resolve to 1 g", () => {
  const result = resolveMedicineIdentity(identity("ceftriaxone", 500, "powder for injection"), "Ceftriaxone 500 mg injection", "ceftriaxone 500 mg injection", [product("1g", "ceftriaxone powder for injection 1000 mg")], []);
  assert.equal(result.status, "unresolved");
  assert.equal(result.product_id, null);
});

test("dosage form is part of canonical identity", () => {
  const result = resolveMedicineIdentity(identity("paracetamol", 500, "tablet"), "Paracetamol 500 mg tablet", "paracetamol 500 mg tablet", [product("injection", "paracetamol injection 500 mg")], []);
  assert.equal(result.status, "unresolved");
});

test("combinations do not match a single ingredient", () => {
  const combination = {
    ...emptyIdentity,
    dosage_form: "tablet",
    components: [
      { ingredient_name: "amoxicillin", strength_value: 500, strength_unit: "mg", denominator_value: null, denominator_unit: null },
      { ingredient_name: "clavulanic acid", strength_value: 125, strength_unit: "mg", denominator_value: null, denominator_unit: null },
    ],
  };
  const result = resolveMedicineIdentity(combination, "Amoxicillin 500 mg + clavulanic acid 125 mg tablet", "amoxicillin 500 mg + clavulanic acid 125 mg tablet", [product("amox", "amoxicillin capsule 500 mg")], []);
  assert.equal(result.status, "unresolved");
  assert.equal(result.product_id, null);
});

test("explicit vial context is required for a per-vial NPPA observation", () => {
  const unspecified = item("Ceftriaxone 1 g injection", identity("ceftriaxone", 1000, "injection"));
  const explicit = item("Ceftriaxone 1 g injection vial", identity("ceftriaxone", 1000, "injection", "vial", 1));
  const nppa = observation({});
  assert.equal(verifyMedicineObservationUnit(unspecified, nppa).compatible, false);
  assert.equal(verifyMedicineObservationUnit(explicit, nppa).compatible, true);
});

test("a single tablet is not treated as a multi-tablet pack", () => {
  const singleTablet = item("Paracetamol 650 mg tablet", identity("paracetamol", 650, "tablet", "tablet", 1));
  const nppaTablet = observation({ sale_unit: "1 tablet", pack_unit: "tablet" });
  assert.equal(verifyMedicineObservationUnit(singleTablet, nppaTablet).compatible, true);
});

test("per-ml and per-vial contexts cannot be interchanged", () => {
  const vial = item("Ciprofloxacin injection vial", identity("ciprofloxacin", 200, "injection", "vial", 1));
  const ml = item("Ciprofloxacin injection 1 ml", identity("ciprofloxacin", 200, "injection", "ml", 1));
  const perMl = observation({ sale_unit: "1 ml", pack_unit: "ml" });
  assert.equal(verifyMedicineObservationUnit(vial, perMl).compatible, false);
  assert.equal(verifyMedicineObservationUnit(ml, perMl).compatible, true);
});

test("PMBI comparison requires the exact pack quantity and unit", () => {
  const tenTablets = item("Paracetamol 500 mg tablet strip of 10", identity("paracetamol", 500, "tablet", "tablet", 10));
  const unknownPack = item("Paracetamol 500 mg tablet", identity("paracetamol", 500, "tablet"));
  const pmbi = observation({
    source_kind: "pmbi",
    price_kind: "listed_mrp",
    sale_unit: "pack",
    pack_text: "10's",
    pack_quantity: 10,
    pack_unit: "tablet_or_capsule",
    tax_status: "unknown",
  });
  assert.equal(verifyMedicineObservationUnit(tenTablets, pmbi).compatible, true);
  assert.equal(verifyMedicineObservationUnit(unknownPack, pmbi).compatible, false);
});

test("normalization converts grams to milligrams", () => {
  const parsed = normalizeMedicineIdentity(identity("ceftriaxone", 1000, "injection"), "Ceftriaxone 1 g injection", "ceftriaxone 1 g injection");
  assert.match(parsed.signature, /1000 mg/);
});

test("pack counts do not become concentration denominators", () => {
  const packIdentity = {
    ...identity("paracetamol", 500, "tablet", "tablet", 10),
    components: [{ ingredient_name: "paracetamol", strength_value: 500, strength_unit: "mg", denominator_value: 10, denominator_unit: "tablet" }],
  };
  const result = resolveMedicineIdentity(packIdentity, "Paracetamol 500 mg tablet strip of 10", "paracetamol 500 mg tablet strip of 10", [product("paracetamol", "paracetamol tablet 500 mg")], []);
  assert.equal(result.status, "matched_exact");
});
