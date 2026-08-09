import type { ExtractedItemRow, InsurancePolicyRow } from "./types";

export type LineageCalculation = {
  formula: string;
  inputs: Record<string, unknown>;
  output: number | boolean | string | null;
};

export type LineageSourceRef = {
  page: number | null;
  section: string | null;
  chunk_index: number | null;
  quote: string | null;
};

export type FindingLineage = {
  source: {
    document_id: string | null;
    document_ids: string[];
    page: number | null;
    quote: string | null;
    refs: LineageSourceRef[];
  };
  extracted: {
    item_id: string | null;
    item_ids: string[];
    field: string | null;
  };
  normalized: {
    name: string | null;
    medicine_identity: string | null;
    canonical_entity_id: string | null;
    canonical_entity_type: string | null;
  };
  reference: {
    reference_item_id: string | null;
    observation_id: string | null;
    source_kind: string | null;
  };
  rule: {
    id: string;
    version: string;
  };
  calculation: LineageCalculation | null;
};

export type ItemLineageOptions = {
  field?: string | null;
  medicineIdentity?: string | null;
  canonicalEntityId?: string | null;
  canonicalEntityType?: string | null;
  referenceItemId?: string | null;
  observationId?: string | null;
  sourceKind?: string | null;
  calculation?: LineageCalculation | null;
};

const RULE_VERSION = "1";

function itemSourceRefs(items: ExtractedItemRow[]): LineageSourceRef[] {
  return items.map((item) => ({
    page: item.source_page,
    section: null,
    chunk_index: null,
    quote: item.raw_text,
  }));
}

export function itemsLineage(
  items: ExtractedItemRow[],
  ruleId: string,
  options: ItemLineageOptions = {},
): FindingLineage {
  const primary = items[0] ?? null;
  const documentIds = [...new Set(items.map((item) => item.document_id))];
  const itemIds = items.map((item) => item.id);
  const refs = itemSourceRefs(items);

  return {
    source: {
      document_id: documentIds.length === 1 ? documentIds[0] : null,
      document_ids: documentIds,
      page: primary?.source_page ?? null,
      quote: primary?.raw_text ?? null,
      refs,
    },
    extracted: {
      item_id: primary?.id ?? null,
      item_ids: itemIds,
      field: options.field ?? null,
    },
    normalized: {
      name: primary?.normalized_name ?? null,
      medicine_identity: options.medicineIdentity ?? null,
      canonical_entity_id: options.canonicalEntityId ?? null,
      canonical_entity_type: options.canonicalEntityType ?? null,
    },
    reference: {
      reference_item_id: options.referenceItemId ?? null,
      observation_id: options.observationId ?? null,
      source_kind: options.sourceKind ?? null,
    },
    rule: { id: ruleId, version: RULE_VERSION },
    calculation: options.calculation ?? null,
  };
}

export function itemLineage(
  item: ExtractedItemRow,
  ruleId: string,
  options: ItemLineageOptions = {},
): FindingLineage {
  return itemsLineage([item], ruleId, options);
}

export function policyLineage(
  policy: InsurancePolicyRow,
  field: string,
  ruleId: string,
  calculation: LineageCalculation | null = null,
): FindingLineage {
  const provenance = policy.extraction_provenance?.[field];
  const refs = (provenance?.values ?? []).map((value) => ({
    page: value.page,
    section: value.section,
    chunk_index: value.chunk_index ?? null,
    quote: null,
  }));
  const first = refs[0] ?? { page: null, section: null, chunk_index: null, quote: null };

  return {
    source: {
      document_id: policy.document_id,
      document_ids: [policy.document_id],
      page: first.page,
      quote: first.quote,
      refs,
    },
    extracted: { item_id: null, item_ids: [], field },
    normalized: {
      name: null,
      medicine_identity: null,
      canonical_entity_id: null,
      canonical_entity_type: null,
    },
    reference: {
      reference_item_id: null,
      observation_id: null,
      source_kind: null,
    },
    rule: { id: ruleId, version: RULE_VERSION },
    calculation,
  };
}

export function withLineage(
  evidence: Record<string, unknown>,
  lineage: FindingLineage,
): Record<string, unknown> {
  return { ...evidence, lineage };
}
