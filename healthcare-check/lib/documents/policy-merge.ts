import type { PolicyChunk } from "@/lib/rag/policy";
import type { ExtractedPolicy } from "@/lib/documents/policy";

export type PolicyProvenanceValue = {
  value: unknown;
  page: number | null;
  section: string | null;
  chunk_index: number | null;
};

export type PolicyProvenanceEntry = {
  values: PolicyProvenanceValue[];
  status: "confirmed" | "requires_confirmation";
};

export type PolicyProvenance = Record<string, PolicyProvenanceEntry>;

export type PolicyChunkExtraction = {
  chunk: PolicyChunk;
  policy: ExtractedPolicy;
};

export type MergedPolicy = {
  policy: ExtractedPolicy;
  provenance: PolicyProvenance;
};

type ScalarField =
  | "sumInsured"
  | "roomRentLimit"
  | "icuLimit"
  | "copayPercent"
  | "deductible"
  | "consumablesCovered";

function provenanceField(field: string): string {
  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function valueKey(value: unknown): string {
  return JSON.stringify(value);
}

function source(chunk: PolicyChunk, value: unknown, chunkIndex: number): PolicyProvenanceValue {
  return { value, page: chunk.page, section: chunk.sectionTitle, chunk_index: chunkIndex };
}

function addProvenance(
  provenance: PolicyProvenance,
  field: string,
  values: PolicyProvenanceValue[],
  status: PolicyProvenanceEntry["status"],
) {
  if (values.length > 0) provenance[field] = { values, status };
}

function mergeScalar(
  field: ScalarField,
  extractions: PolicyChunkExtraction[],
  provenance: PolicyProvenance,
): number | boolean | null {
  const values: PolicyProvenanceValue[] = [];
  const seen = new Set<string>();

  for (const [chunkIndex, extraction] of extractions.entries()) {
    const value = extraction.policy[field];
    if (value == null || seen.has(valueKey(value))) continue;
    seen.add(valueKey(value));
    values.push(source(extraction.chunk, value, chunkIndex));
  }

  addProvenance(provenance, provenanceField(field), values, values.length > 1 ? "requires_confirmation" : "confirmed");
  return values.length === 1 ? (values[0].value as number | boolean) : null;
}

function mergeWaitingPeriods(
  extractions: PolicyChunkExtraction[],
  provenance: PolicyProvenance,
): ExtractedPolicy["waitingPeriods"] {
  const result: ExtractedPolicy["waitingPeriods"] = [];
  const values: PolicyProvenanceValue[] = [];
  const seen = new Set<string>();
  const durationsByCondition = new Map<string, Set<string>>();

  for (const [chunkIndex, extraction] of extractions.entries()) {
    for (const waitingPeriod of extraction.policy.waitingPeriods) {
      const condition = waitingPeriod.condition.trim();
      const duration = waitingPeriod.duration.trim();
      if (!condition || !duration) continue;
      const key = `${normalizeText(condition)}|${normalizeText(duration)}`;
      const conditionKey = normalizeText(condition);
      const durations = durationsByCondition.get(conditionKey) ?? new Set<string>();
      durations.add(normalizeText(duration));
      durationsByCondition.set(conditionKey, durations);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ condition, duration });
      values.push(source(extraction.chunk, { condition, duration }, chunkIndex));
    }
  }

  const conflict = [...durationsByCondition.values()].some((durations) => durations.size > 1);
  addProvenance(provenance, "waiting_periods", values, conflict ? "requires_confirmation" : "confirmed");
  return result;
}

function mergeSubLimits(
  extractions: PolicyChunkExtraction[],
  provenance: PolicyProvenance,
): ExtractedPolicy["subLimits"] {
  const result: ExtractedPolicy["subLimits"] = [];
  const values: PolicyProvenanceValue[] = [];
  const seen = new Set<string>();
  const variantsByCategory = new Map<string, Set<string>>();

  for (const [chunkIndex, extraction] of extractions.entries()) {
    for (const subLimit of extraction.policy.subLimits) {
      const category = subLimit.category.trim();
      if (!category) continue;
      const value = {
        category,
        limit_amount: subLimit.limit_amount ?? null,
        limit_percent: subLimit.limit_percent ?? null,
      };
      const categoryKey = normalizeText(category);
      const variantKey = `${value.limit_amount}|${value.limit_percent}`;
      const variants = variantsByCategory.get(categoryKey) ?? new Set<string>();
      variants.add(variantKey);
      variantsByCategory.set(categoryKey, variants);
      const key = `${categoryKey}|${variantKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(value);
      values.push(source(extraction.chunk, value, chunkIndex));
    }
  }

  const conflict = [...variantsByCategory.values()].some((variants) => variants.size > 1);
  addProvenance(provenance, "sub_limits", values, conflict ? "requires_confirmation" : "confirmed");
  return result;
}

function mergeTextArray(
  field: "exclusions" | "otherConditions",
  extractions: PolicyChunkExtraction[],
  provenance: PolicyProvenance,
): string[] {
  const result: string[] = [];
  const values: PolicyProvenanceValue[] = [];
  const seen = new Set<string>();

  for (const [chunkIndex, extraction] of extractions.entries()) {
    for (const item of extraction.policy[field]) {
      const text = item.trim();
      const key = normalizeText(text);
      if (!text || seen.has(key)) continue;
      seen.add(key);
      result.push(text);
      values.push(source(extraction.chunk, text, chunkIndex));
    }
  }

  addProvenance(provenance, provenanceField(field), values, "confirmed");
  return result;
}

export function mergePolicyExtractions(extractions: PolicyChunkExtraction[]): MergedPolicy {
  const provenance: PolicyProvenance = {};
  const firstUsefulTitle = extractions.find(({ policy }) => {
    const title = policy.suggestedTitle.trim();
    return title && title !== "Untitled case" && title !== "Insurance Policy";
  })?.policy.suggestedTitle;

  const policy: ExtractedPolicy = {
    sumInsured: mergeScalar("sumInsured", extractions, provenance) as number | null,
    roomRentLimit: mergeScalar("roomRentLimit", extractions, provenance) as number | null,
    icuLimit: mergeScalar("icuLimit", extractions, provenance) as number | null,
    copayPercent: mergeScalar("copayPercent", extractions, provenance) as number | null,
    deductible: mergeScalar("deductible", extractions, provenance) as number | null,
    waitingPeriods: mergeWaitingPeriods(extractions, provenance),
    subLimits: mergeSubLimits(extractions, provenance),
    exclusions: mergeTextArray("exclusions", extractions, provenance),
    consumablesCovered: mergeScalar("consumablesCovered", extractions, provenance) as boolean | null,
    otherConditions: mergeTextArray("otherConditions", extractions, provenance),
    suggestedTitle: firstUsefulTitle ?? "Insurance Policy",
  };

  return { policy, provenance };
}
