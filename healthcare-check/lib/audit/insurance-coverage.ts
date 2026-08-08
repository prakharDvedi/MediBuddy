import type { InsurancePolicyRow, Finding } from "./types";

/**
 * Flags coverage terms in an insurance policy that are worth understanding
 * before treatment — room rent/ICU sub-limits, co-payment, deductible,
 * excluded consumables, category sub-limits, and waiting periods. These are
 * read directly off the extracted policy fields, not judgments about
 * whether the policy is "good" — the finding states the term and lets the
 * policyholder decide whether it matters for their case.
 */
export function checkInsuranceCoverage(policies: InsurancePolicyRow[]): Finding[] {
  const findings: Finding[] = [];

  for (const policy of policies) {
    if (policy.room_rent_limit != null) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: "Room rent is capped",
        description:
          `The policy caps room rent at ${policy.room_rent_limit} per day. Rooms billed above this ` +
          `cap can trigger a proportional deduction on other charges too, not just the room rent line — ` +
          `worth confirming with the insurer before choosing a room category.`,
        evidence: { room_rent_limit: policy.room_rent_limit },
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.icu_limit != null) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: "ICU charges are capped",
        description: `The policy caps ICU room charges at ${policy.icu_limit} per day.`,
        evidence: { icu_limit: policy.icu_limit },
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.copay_percent != null && policy.copay_percent > 0) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: `Co-payment of ${policy.copay_percent}% applies`,
        description:
          `You bear ${policy.copay_percent}% of the admissible claim amount out of pocket — the ` +
          `insurer covers the rest.`,
        evidence: { copay_percent: policy.copay_percent },
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.deductible != null && policy.deductible > 0) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: `Deductible of ${policy.deductible} applies`,
        description: `The first ${policy.deductible} of each claim is paid out of pocket before the policy pays.`,
        evidence: { deductible: policy.deductible },
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.consumables_covered === false) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: "Consumables are not covered",
        description:
          `The policy explicitly excludes consumables (items like gloves, syringes, PPE kits). These are ` +
          `often billed separately by hospitals and would be out of pocket.`,
        evidence: {},
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.sub_limits && policy.sub_limits.length > 0) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: `${policy.sub_limits.length} category sub-limit(s) apply`,
        description:
          `The policy caps specific categories separately from the overall sum insured: ` +
          policy.sub_limits
            .map((s) =>
              s.limit_amount != null
                ? `${s.category} (${s.limit_amount})`
                : s.limit_percent != null
                  ? `${s.category} (${s.limit_percent}% of sum insured)`
                  : s.category,
            )
            .join(", ") +
          ".",
        evidence: { sub_limits: policy.sub_limits },
        confidence: "high",
        related_item_id: null,
      });
    }

    if (policy.waiting_periods && policy.waiting_periods.length > 0) {
      findings.push({
        document_id: policy.document_id,
        finding_type: "coverage_gap",
        title: `${policy.waiting_periods.length} waiting period(s) apply`,
        description:
          `Claims for these conditions aren't covered until their waiting period elapses: ` +
          policy.waiting_periods.map((w) => `${w.condition} (${w.duration})`).join(", ") +
          ".",
        evidence: { waiting_periods: policy.waiting_periods },
        confidence: "high",
        related_item_id: null,
      });
    }
  }

  return findings;
}
