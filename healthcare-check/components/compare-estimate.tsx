"use client";

import { useState } from "react";
import { ErrorState, ImpactCard, MoneyValue, StatusBadge } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { formatMoney } from "@/lib/dashboard/format";
import { POLICY_UI_COPY, type PolicyOtherTermKind, type PolicyWhyLineKind } from "@/lib/documents/policy-language";

type CompareResult = {
  totalBilled: number;
  admissibleBeforeDeductible: number;
  subLimitDeductions: number;
  deductibleApplied: number;
  admissibleAfterDeductible: number;
  copayPercent: number;
  copayAmount: number;
  insurerPays: number;
  patientPays: number;
  whyLines: {
    kind?: PolicyWhyLineKind;
    label: string;
    amount: number;
    reason: string;
    context?: {
      category?: string;
      cap?: number;
      billed?: number;
      deductible?: number;
      percent?: number;
    };
  }[];
};

export type OtherPolicyTerm = {
  kind: PolicyOtherTermKind;
  amount?: number;
};

function fill(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
}

export function CompareEstimate({
  caseId,
  otherPolicyTerms = [],
}: {
  caseId: string;
  otherPolicyTerms?: OtherPolicyTerm[];
}) {
  const { locale } = useLocale();
  const copy = POLICY_UI_COPY[locale].comparison;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  async function handleCompare() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/insurance/${caseId}/compare`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? copy.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[1rem] border border-success/20 bg-success-bg p-5 sm:p-6" lang={locale}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">{copy.eyebrow}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{copy.title}</h3>
          <p className="mt-1 text-sm leading-6 text-text-muted">{copy.description}</p>
        </div>
        <button onClick={() => void handleCompare()} disabled={busy} className="focus-ring min-h-10 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {busy ? copy.calculating : result ? copy.recalculate : copy.compare}
        </button>
      </div>

      {error && <div className="mt-4"><ErrorState message={error} /></div>}

      {otherPolicyTerms.length > 0 && (
        <div className="mt-5 rounded-[1rem] border border-warning/25 bg-warning-bg/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-warning">{copy.policyContext}</p><h4 className="mt-1 text-base font-semibold text-text-primary">{copy.otherTermsTitle}</h4></div>
            <StatusBadge tone="warning">{copy.shownSeparately}</StatusBadge>
          </div>
          <div className="mt-4 grid gap-3">
            {otherPolicyTerms.map((term) => {
              const termCopy = copy.otherTerms[term.kind];
              return <div key={term.kind} className="rounded-xl border border-warning/20 bg-surface p-3"><p className="text-sm font-semibold text-text-primary">{termCopy.label}</p><p className="mt-1 text-xs leading-5 text-text-muted">{fill(termCopy.description, { amount: term.amount == null ? undefined : formatMoney(term.amount) })}</p></div>;
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-text-muted">{copy.separateTermsNote}</p>
        </div>
      )}

      {result && <div className="mt-5"><div className="grid gap-3 sm:grid-cols-2"><ImpactCard tone="success" label={copy.estimatedInsurerPayment}><MoneyValue value={result.insurerPays} size="lg" className="mt-2 block text-success" /><p className="mt-2 text-xs text-text-muted">{copy.estimateNote}</p></ImpactCard><ImpactCard tone="warning" label={copy.estimatedPatientResponsibility}><MoneyValue value={result.patientPays} size="lg" className="mt-2 block text-warning" /><p className="mt-2 text-xs text-text-muted">{copy.confirmAmount}</p></ImpactCard></div><div className="mt-5 rounded-[1rem] border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">{copy.howEstimateChanges}</p><p className="mt-1 font-medium text-text-primary">{fill(copy.startingFrom, { amount: formatMoney(result.totalBilled) })}</p></div><StatusBadge tone="info">{copy.policyBasedEstimate}</StatusBadge></div><div className="mt-4 grid gap-2">{result.whyLines.map((line, index) => { const kind = line.kind; const localizedLabel = kind ? copy.whyLineLabels[kind] : line.label; const localizedReason = kind ? fill(copy.whyLineReasons[kind], { category: line.context?.category, cap: line.context?.cap == null ? undefined : formatMoney(line.context.cap), billed: line.context?.billed == null ? undefined : formatMoney(line.context.billed), deductible: line.context?.deductible == null ? undefined : formatMoney(line.context.deductible), percent: line.context?.percent }) : line.reason; return <div key={`${line.label}-${index}`} className="flex flex-col gap-1 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-text-primary">{localizedLabel}</p><p className="text-xs leading-5 text-text-muted">{localizedReason}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">−{formatMoney(line.amount)}</p></div>; })}</div></div></div>}
    </div>
  );
}
