export type MedicineMatchStatus =
  | "unresolved"
  | "matched_exact"
  | "matched_alias"
  | "needs_review"
  | "combination_unresolved"
  | "unit_unverified";

export type MedicineMatchConfidence = "high" | "medium" | "low";

export type MedicineComponentIdentity = {
  ingredient_name: string;
  strength_value: number | null;
  strength_unit: string | null;
  denominator_value: number | null;
  denominator_unit: string | null;
};

export type ExtractedMedicineIdentity = {
  brand_name: string | null;
  components: MedicineComponentIdentity[];
  dosage_form: string | null;
  route: string | null;
  pack_text: string | null;
  pack_quantity: number | null;
  pack_unit: string | null;
};

export type NormalizedMedicineComponent = MedicineComponentIdentity & {
  normalized_ingredient: string;
};

export type NormalizedMedicineIdentity = {
  signature: string;
  canonical_text: string;
  components: NormalizedMedicineComponent[];
  dosage_form: string | null;
  route: string | null;
  pack_text: string | null;
  pack_quantity: number | null;
  pack_unit: string | null;
  has_combination: boolean;
  has_strength: boolean;
};

export type MedicineProductCandidate = {
  id: string;
  canonical_name: string;
  normalized_identity: string;
  dosage_form: string | null;
  route: string | null;
};

export type MedicineAliasCandidate = {
  medicine_product_id: string;
  normalized_alias: string;
  alias_text: string;
  confidence: MedicineMatchConfidence;
  review_status: "reviewed" | "candidate" | "rejected";
};

export type MedicineResolution = {
  status: MedicineMatchStatus;
  product_id: string | null;
  method: "exact_canonical" | "reviewed_alias" | "constrained_fuzzy" | "unresolved";
  confidence: MedicineMatchConfidence;
  reason: string;
  candidates: string[];
  identity: NormalizedMedicineIdentity;
};

export type MedicinePriceObservation = {
  id: string;
  snapshot_id?: string | null;
  medicine_product_id: string;
  source_kind: "nppa" | "pmbi";
  source_record_id: string;
  price_kind: "ceiling_price" | "listed_mrp";
  amount: number;
  currency: string;
  sale_unit: string;
  pack_text: string | null;
  pack_quantity: number | null;
  pack_unit: string | null;
  tax_status: "included" | "excluded" | "unknown";
  effective_date: string | null;
  observed_at: string;
  source_name: string;
  source_url: string;
  raw_source: Record<string, unknown>;
};

export type ReferenceSnapshotRow = {
  id: string;
  source_kind: "nppa" | "pmbi";
  status: "staged" | "accepted" | "rejected";
  retrieved_at: string;
};
