import type { ExtractedItemRow, InsurancePolicyRow } from "@/lib/audit/types";

export type CompareLineItem = {
  itemId: string;
  name: string;
  billed: number;
  subLimitCategory: string | null;
  subLimitCap: number | null;
  payableBeforeDeductible: number;
};

export type WhyLine = {
  kind: "sub_limit" | "deductible" | "copay";
  label: string;
  amount: number;
  reason: string;
  context: {
    category?: string;
    cap?: number;
    billed?: number;
    deductible?: number;
    percent?: number;
  };
};

export type CompareResult = {
  totalBilled: number;
  admissibleBeforeDeductible: number;
  subLimitDeductions: number;
  deductibleApplied: number;
  admissibleAfterDeductible: number;
  copayPercent: number;
  copayAmount: number;
  insurerPays: number;
  patientPays: number;
  lineItems: CompareLineItem[];
  whyLines: WhyLine[];
};

/**
 * Matches a hospital line item to a policy sub-limit by the sub-limit
 * category's leading word (e.g. "Cataract surgery (per eye)" -> "cataract").
 * Deliberately conservative — only whole-word-ish, 4+ character keywords —
 * a false match here would misstate what the patient owes, which is worse
 * than missing a real match and leaving the item uncapped.
 */
function findSubLimitMatch(
  item: ExtractedItemRow,
  subLimits: NonNullable<InsurancePolicyRow["sub_limits"]>,
  sumInsured: number | null,
): { category: string; amount: number } | null {
  const itemName = (item.normalized_name ?? item.name).toLowerCase();

  for (const s of subLimits) {
    const keyword = s.category.toLowerCase().split(/[\s(]/)[0];
    if (keyword.length < 4 || !itemName.includes(keyword)) continue;

    const amount =
      s.limit_amount ?? (s.limit_percent != null && sumInsured != null ? (s.limit_percent / 100) * sumInsured : null);
    if (amount != null) return { category: s.category, amount };
  }

  return null;
}

/**
 * Deterministic patient-cost breakdown for a hospital bill against an
 * insurance policy. Pure arithmetic — no LLM involved. Sub-limit caps are
 * applied per line item, then deductible and co-pay are applied once on the
 * admissible total (matches how these terms actually apply per-claim, not
 * per-line-item).
 */
export function computeEstimateComparison(
  items: ExtractedItemRow[],
  policy: InsurancePolicyRow,
): CompareResult {
  const subLimits = policy.sub_limits ?? [];

  const lineItems: CompareLineItem[] = items.map((item) => {
    const billed = item.total_price ?? 0;
    const match = findSubLimitMatch(item, subLimits, policy.sum_insured);
    const cap = match?.amount ?? null;
    const payableBeforeDeductible = cap != null ? Math.min(billed, cap) : billed;

    return {
      itemId: item.id,
      name: item.name,
      billed,
      subLimitCategory: match?.category ?? null,
      subLimitCap: cap,
      payableBeforeDeductible,
    };
  });

  const totalBilled = lineItems.reduce((sum, li) => sum + li.billed, 0);
  const admissibleBeforeDeductible = lineItems.reduce((sum, li) => sum + li.payableBeforeDeductible, 0);
  const subLimitDeductions = Number((totalBilled - admissibleBeforeDeductible).toFixed(2));

  const deductible = policy.deductible ?? 0;
  const deductibleApplied = Math.min(deductible, admissibleBeforeDeductible);
  const admissibleAfterDeductible = Number((admissibleBeforeDeductible - deductibleApplied).toFixed(2));

  const copayPercent = policy.copay_percent ?? 0;
  const copayAmount = Number(((admissibleAfterDeductible * copayPercent) / 100).toFixed(2));
  const insurerPays = Number((admissibleAfterDeductible - copayAmount).toFixed(2));
  const patientPays = Number((totalBilled - insurerPays).toFixed(2));

  const whyLines: WhyLine[] = [];

  for (const li of lineItems) {
    if (li.subLimitCap != null && li.billed > li.subLimitCap) {
      whyLines.push({
        kind: "sub_limit",
        label: `${li.name} — capped by "${li.subLimitCategory}" sub-limit`,
        amount: Number((li.billed - li.subLimitCap).toFixed(2)),
        reason: `Policy sub-limit for ${li.subLimitCategory} is ₹${li.subLimitCap}; the billed amount of ₹${li.billed} exceeds it, and the excess is not payable by the insurer.`,
        context: { category: li.subLimitCategory ?? undefined, cap: li.subLimitCap, billed: li.billed },
      });
    }
  }
  if (deductibleApplied > 0) {
    whyLines.push({
      kind: "deductible",
      label: "Deductible",
      amount: deductibleApplied,
      reason: `The policy's deductible of ₹${deductible} applies per claim and is paid out of pocket before the policy pays.`,
      context: { deductible },
    });
  }
  if (copayAmount > 0) {
    whyLines.push({
      kind: "copay",
      label: `Co-payment (${copayPercent}%)`,
      amount: copayAmount,
      reason: `The policy requires a ${copayPercent}% co-payment on the admissible amount after the deductible.`,
      context: { percent: copayPercent },
    });
  }

  return {
    totalBilled,
    admissibleBeforeDeductible,
    subLimitDeductions,
    deductibleApplied,
    admissibleAfterDeductible,
    copayPercent,
    copayAmount,
    insurerPays,
    patientPays,
    lineItems,
    whyLines,
  };
}
