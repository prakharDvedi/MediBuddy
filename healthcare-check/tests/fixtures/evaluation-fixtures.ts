import type { ExtractedMedicineIdentity, MedicineAliasCandidate, MedicineProductCandidate } from "../../lib/medicines/types.ts";

export type MedicineEvaluationFixture = {
  id: string;
  documentType: "bill" | "estimate" | "prescription";
  text: string;
  identity: ExtractedMedicineIdentity;
  expectedStatus: "matched_exact" | "matched_alias" | "needs_review" | "unresolved" | "combination_unresolved";
  expectedProductId: string | null;
};

export const medicineProducts: MedicineProductCandidate[] = [
  {
    id: "paracetamol-500-tablet",
    canonical_name: "Paracetamol 500 mg tablet",
    normalized_identity: "paracetamol 500 mg tablet",
    dosage_form: "tablet",
    route: "oral",
  },
  {
    id: "paracetamol-650-tablet",
    canonical_name: "Paracetamol 650 mg tablet",
    normalized_identity: "paracetamol 650 mg tablet",
    dosage_form: "tablet",
    route: "oral",
  },
  {
    id: "ceftriaxone-1g-injection",
    canonical_name: "Ceftriaxone 1000 mg injection",
    normalized_identity: "ceftriaxone 1000 mg injection",
    dosage_form: "injection",
    route: "injectable",
  },
  {
    id: "amoxicillin-clavulanate-tablet",
    canonical_name: "Amoxicillin 500 mg + clavulanic acid 125 mg tablet",
    normalized_identity: "amoxicillin 500 mg + clavulanic acid 125 mg tablet",
    dosage_form: "tablet",
    route: "oral",
  },
  {
    id: "azithromycin-500-tablet",
    canonical_name: "Azithromycin 500 mg tablet",
    normalized_identity: "azithromycin 500 mg tablet",
    dosage_form: "tablet",
    route: "oral",
  },
  {
    id: "doxycycline-100-capsule",
    canonical_name: "Doxycycline 100 mg capsule",
    normalized_identity: "doxycycline 100 mg capsule",
    dosage_form: "capsule",
    route: "oral",
  },
  {
    id: "pantoprazole-40-injection",
    canonical_name: "Pantoprazole 40 mg injection",
    normalized_identity: "pantoprazole 40 mg injection",
    dosage_form: "injection",
    route: "injectable",
  },
  {
    id: "tramadol-50-capsule",
    canonical_name: "Tramadol 50 mg capsule",
    normalized_identity: "tramadol 50 mg capsule",
    dosage_form: "capsule",
    route: "oral",
  },
];

export const medicineAliases: MedicineAliasCandidate[] = [
  {
    medicine_product_id: "doxycycline-100-capsule",
    normalized_alias: "doxy-100",
    alias_text: "Doxy-100",
    confidence: "high",
    review_status: "reviewed",
  },
];

function identity(
  ingredient: string,
  strength: number | null,
  form: string | null,
  options: Partial<ExtractedMedicineIdentity> = {},
): ExtractedMedicineIdentity {
  return {
    brand_name: null,
    components: [
      {
        ingredient_name: ingredient,
        strength_value: strength,
        strength_unit: strength == null ? null : "mg",
        denominator_value: null,
        denominator_unit: null,
      },
    ],
    dosage_form: form,
    route: form === "injection" ? "injectable" : form === "tablet" || form === "capsule" ? "oral" : null,
    pack_text: null,
    pack_quantity: null,
    pack_unit: null,
    ...options,
  };

}

export const medicineEvaluationFixtures: MedicineEvaluationFixture[] = [
  {
    id: "bill-paracetamol-500",
    documentType: "bill",
    text: "Paracetamol 500 mg tablet",
    identity: identity("Paracetamol", 500, "tablet"),
    expectedStatus: "matched_exact",
    expectedProductId: "paracetamol-500-tablet",
  },
  {
    id: "bill-paracetamol-650",
    documentType: "bill",
    text: "Paracetamol 650 mg tablet",
    identity: identity("Paracetamol", 650, "tablet"),
    expectedStatus: "matched_exact",
    expectedProductId: "paracetamol-650-tablet",
  },
  {
    id: "estimate-ceftriaxone-1g",
    documentType: "estimate",
    text: "Ceftriaxone 1 g injection vial",
    identity: identity("Ceftriaxone", 1000, "injection", { pack_text: "1 vial", pack_quantity: 1, pack_unit: "vial" }),
    expectedStatus: "matched_exact",
    expectedProductId: "ceftriaxone-1g-injection",
  },
  {
    id: "bill-ceftriaxone-500-not-1g",
    documentType: "bill",
    text: "Ceftriaxone 500 mg injection vial",
    identity: identity("Ceftriaxone", 500, "injection", { pack_text: "1 vial", pack_quantity: 1, pack_unit: "vial" }),
    expectedStatus: "unresolved",
    expectedProductId: null,
  },
  {
    id: "prescription-paracetamol-500-tabs",
    documentType: "prescription",
    text: "Paracetamol 500 mg tabs",
    identity: identity("Paracetamol", 500, "tabs"),
    expectedStatus: "matched_exact",
    expectedProductId: "paracetamol-500-tablet",
  },
  {
    id: "bill-paracetamol-injection-form-mismatch",
    documentType: "bill",
    text: "Paracetamol 500 mg injection",
    identity: identity("Paracetamol", 500, "injection"),
    expectedStatus: "unresolved",
    expectedProductId: null,
  },
  {
    id: "prescription-amoxicillin-clavulanate",
    documentType: "prescription",
    text: "Amoxicillin 500 mg + clavulanic acid 125 mg tablet",
    identity: {
      ...identity("Amoxicillin", 500, "tablet"),
      components: [
        { ingredient_name: "Amoxicillin", strength_value: 500, strength_unit: "mg", denominator_value: null, denominator_unit: null },
        { ingredient_name: "Clavulanic acid", strength_value: 125, strength_unit: "mg", denominator_value: null, denominator_unit: null },
      ],
    },
    expectedStatus: "matched_exact",
    expectedProductId: "amoxicillin-clavulanate-tablet",
  },
  {
    id: "bill-combination-missing-strength",
    documentType: "bill",
    text: "Amoxicillin + clavulanic acid tablet",
    identity: {
      ...identity("Amoxicillin", null, "tablet"),
      components: [
        { ingredient_name: "Amoxicillin", strength_value: null, strength_unit: null, denominator_value: null, denominator_unit: null },
        { ingredient_name: "Clavulanic acid", strength_value: null, strength_unit: null, denominator_value: null, denominator_unit: null },
      ],
    },
    expectedStatus: "combination_unresolved",
    expectedProductId: null,
  },
  {
    id: "bill-combination-not-single-ingredient",
    documentType: "bill",
    text: "Amoxicillin 500 mg + clavulanic acid 125 mg tablet",
    identity: {
      ...identity("Amoxicillin", 500, "tablet"),
      components: [
        { ingredient_name: "Amoxicillin", strength_value: 500, strength_unit: "mg", denominator_value: null, denominator_unit: null },
        { ingredient_name: "Clavulanic acid", strength_value: 125, strength_unit: "mg", denominator_value: null, denominator_unit: null },
      ],
    },
    expectedStatus: "matched_exact",
    expectedProductId: "amoxicillin-clavulanate-tablet",
  },
  {
    id: "bill-azithromycin-form-mismatch",
    documentType: "bill",
    text: "Azithromycin 500 mg capsule",
    identity: identity("Azithromycin", 500, "capsule"),
    expectedStatus: "unresolved",
    expectedProductId: null,
  },
  {
    id: "prescription-doxycycline-reviewed-alias",
    documentType: "prescription",
    text: "Doxy-100",
    identity: {
      brand_name: "Doxy-100",
      components: [],
      dosage_form: null,
      route: null,
      pack_text: null,
      pack_quantity: null,
      pack_unit: null,
    },
    expectedStatus: "matched_alias",
    expectedProductId: "doxycycline-100-capsule",
  },
  {
    id: "estimate-pantoprazole-injection",
    documentType: "estimate",
    text: "Pantoprazole 40 mg inj vial",
    identity: identity("Pantoprazole", 40, "inj", { pack_text: "vial", pack_quantity: 1, pack_unit: "vial" }),
    expectedStatus: "matched_exact",
    expectedProductId: "pantoprazole-40-injection",
  },
  {
    id: "bill-tramadol-capsule",
    documentType: "bill",
    text: "Tramadol 50 mg cap",
    identity: identity("Tramadol", 50, "cap"),
    expectedStatus: "matched_exact",
    expectedProductId: "tramadol-50-capsule",
  },
  {
    id: "bill-unknown-strength",
    documentType: "bill",
    text: "Paracetamol tablet",
    identity: identity("Paracetamol", null, "tablet"),
    expectedStatus: "unresolved",
    expectedProductId: null,
  },
  {
    id: "prescription-gram-to-milligram",
    documentType: "prescription",
    text: "Ceftriaxone 1 g injection",
    identity: identity("Ceftriaxone", 1, "injection" , { components: [{ ingredient_name: "Ceftriaxone", strength_value: 1, strength_unit: "g", denominator_value: null, denominator_unit: null }] }),
    expectedStatus: "matched_exact",
    expectedProductId: "ceftriaxone-1g-injection",
  },
  {
    id: "bill-paracetamol-pack-context",
    documentType: "bill",
    text: "Paracetamol 500 mg tablet strip of 10",
    identity: identity("Paracetamol", 500, "tablet", { pack_text: "strip of 10", pack_quantity: 10, pack_unit: "tablet" }),
    expectedStatus: "matched_exact",
    expectedProductId: "paracetamol-500-tablet",
  },
  {
    id: "estimate-pantoprazole-unknown-form",
    documentType: "estimate",
    text: "Pantoprazole 40 mg",
    identity: identity("Pantoprazole", 40, null),
    expectedStatus: "needs_review",
    expectedProductId: null,
  },
  {
    id: "bill-ceftriaxone-vial-unit",
    documentType: "bill",
    text: "Ceftriaxone 1 g injection vial",
    identity: identity("Ceftriaxone", 1000, "injection", { pack_text: "vial", pack_quantity: 1, pack_unit: "vial" }),
    expectedStatus: "matched_exact",
    expectedProductId: "ceftriaxone-1g-injection",
  },
  {
    id: "prescription-paracetamol-500-tablets",
    documentType: "prescription",
    text: "Paracetamol 500 mg tablets",
    identity: identity("Paracetamol", 500, "tablets"),
    expectedStatus: "matched_exact",
    expectedProductId: "paracetamol-500-tablet",
  },
  {
    id: "bill-azithromycin-500-tablet",
    documentType: "bill",
    text: "Azithromycin 500 mg tablet",
    identity: identity("Azithromycin", 500, "tablet"),
    expectedStatus: "matched_exact",
    expectedProductId: "azithromycin-500-tablet",
  },
];
