import { medicineTextTokens, normalizeMedicineIdentity, normalizeMedicineText, normalizeText } from "./normalize.ts";
import type {
  ExtractedMedicineIdentity,
  MedicineAliasCandidate,
  MedicineProductCandidate,
  MedicineResolution,
} from "./types.ts";

function componentSet(identity: ReturnType<typeof normalizeMedicineIdentity>): string {
  return identity.components
    .map((component) => `${component.normalized_ingredient}:${component.strength_value ?? "?"}${component.strength_unit ?? ""}:${component.denominator_value ?? "?"}${component.denominator_unit ?? ""}`)
    .sort()
    .join("+");
}

function constrainedCandidate(
  identity: ReturnType<typeof normalizeMedicineIdentity>,
  product: MedicineProductCandidate,
): boolean {
  const productIdentity = normalizeMedicineIdentity(null, product.canonical_name, product.normalized_identity);
  if (identity.dosage_form && productIdentity.dosage_form && identity.dosage_form !== productIdentity.dosage_form) return false;
  if (identity.has_combination !== productIdentity.has_combination) return false;
  if (identity.has_strength && productIdentity.has_strength && identity.signature.split("|strength:")[1] !== productIdentity.signature.split("|strength:")[1]) return false;
  if (identity.has_combination && componentSet(identity) !== componentSet(productIdentity)) return false;
  return true;
}

function similarity(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export function resolveMedicineIdentity(
  identity: ExtractedMedicineIdentity | null | undefined,
  fallbackName: string,
  fallbackNormalizedName: string | null | undefined,
  products: MedicineProductCandidate[],
  aliases: MedicineAliasCandidate[],
): MedicineResolution {
  const normalizedIdentity = normalizeMedicineIdentity(identity, fallbackName, fallbackNormalizedName);
  const canonicalMatches = products.filter((product) => {
    const productIdentity = normalizeMedicineIdentity(null, product.canonical_name, product.normalized_identity);
    return normalizedIdentity.signature === productIdentity.signature;
  });

  if (canonicalMatches.length === 1) {
    return {
      status: "matched_exact",
      product_id: canonicalMatches[0].id,
      method: "exact_canonical",
      confidence: "high",
      reason: "Matched the normalized medicine identity exactly.",
      candidates: [],
      identity: normalizedIdentity,
    };
  }

  const aliasRawKey = normalizeText(fallbackNormalizedName || fallbackName);
  const aliasKey = normalizeMedicineText(fallbackNormalizedName || fallbackName);
  const aliasMatches = aliases.filter(
    (alias) =>
      alias.review_status === "reviewed" &&
      (alias.normalized_alias === aliasRawKey || normalizeMedicineText(alias.normalized_alias) === aliasKey),
  );
  const aliasProductIds = [...new Set(aliasMatches.map((alias) => alias.medicine_product_id))];
  if (aliasProductIds.length === 1) {
    return {
      status: "matched_alias",
      product_id: aliasProductIds[0],
      method: "reviewed_alias",
      confidence: "medium",
      reason: "Matched a reviewed bill-text alias; unit and pack context remain independently checked.",
      candidates: [],
      identity: normalizedIdentity,
    };
  }

  if (normalizedIdentity.has_combination && normalizedIdentity.components.some((component) => component.strength_value === null)) {
    return {
      status: "combination_unresolved",
      product_id: null,
      method: "unresolved",
      confidence: "low",
      reason: "Combination contents or strengths were incomplete, so no product was approved.",
      candidates: [],
      identity: normalizedIdentity,
    };
  }

  const candidates = products
    .filter((product) => constrainedCandidate(normalizedIdentity, product))
    .map((product) => ({
      product,
      score: similarity(medicineTextTokens(normalizedIdentity), medicineTextTokens(normalizeMedicineIdentity(null, product.canonical_name, product.normalized_identity))),
    }))
    .filter(({ score }) => score >= 0.65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (candidates.length) {
    return {
      status: "needs_review",
      product_id: null,
      method: "constrained_fuzzy",
      confidence: "low",
      reason: "A constrained candidate was generated, but it was not silently approved.",
      candidates: candidates.map(({ product }) => product.id),
      identity: normalizedIdentity,
    };
  }

  return {
    status: "unresolved",
    product_id: null,
    method: "unresolved",
    confidence: "low",
    reason: "No safe canonical or reviewed-alias match was found.",
    candidates: [],
    identity: normalizedIdentity,
  };
}
