export type SavingsSummaryFinding = {
  finding_type: string | null;
  evidence: unknown;
};

export function calculatePotentialSavings(findings: SavingsSummaryFinding[]): number {
  const total = findings.reduce((sum, finding) => {
    if (finding.finding_type !== "medicine_savings") return sum;
    if (typeof finding.evidence !== "object" || finding.evidence === null) return sum;
    const value = (finding.evidence as Record<string, unknown>).potential_savings;
    if (typeof value !== "number" || !Number.isFinite(value)) return sum;
    return sum + Math.max(0, value);
  }, 0);
  return Number(total.toFixed(2));
}
