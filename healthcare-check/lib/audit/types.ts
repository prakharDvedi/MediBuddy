export type ExtractedItemRow = {
  id: string;
  document_id: string;
  item_type: string | null;
  name: string;
  normalized_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  source_page: number | null;
  raw_text: string | null;
  confidence: string | null;
  medicine_identity: Record<string, unknown> | null;
  medicine_product_id: string | null;
  medicine_match_status: string | null;
  medicine_match_confidence: string | null;
  medicine_match_reason: string | null;
};

export type ReferenceItemRow = {
  id: string;
  category: string;
  name: string;
  normalized_name: string;
  reference_price: number;
  unit: string | null;
  source_name: string;
  source_url: string | null;
  medicine_product_id: string | null;
};

export type InsurancePolicyRow = {
  id: string;
  document_id: string;
  sum_insured: number | null;
  room_rent_limit: number | null;
  icu_limit: number | null;
  copay_percent: number | null;
  deductible: number | null;
  waiting_periods: { condition: string; duration: string }[] | null;
  sub_limits: { category: string; limit_amount: number | null; limit_percent: number | null }[] | null;
  exclusions: string[] | null;
  consumables_covered: boolean | null;
  other_conditions: string[] | null;
};

export type Finding = {
  document_id: string | null;
  finding_type:
    | "price"
    | "quantity"
    | "duplicate"
    | "package_overlap"
    | "unexplained"
    | "medicine_savings"
    | "coverage_gap"
    | "unit_unverified";
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  related_item_id: string | null;
};
