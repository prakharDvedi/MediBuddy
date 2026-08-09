"use client";

import { useState } from "react";
import { ErrorState, ImpactCard, MoneyValue, StatusBadge } from "@/components/ui";
import { formatMoney } from "@/lib/dashboard/format";

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
  whyLines: { label: string; amount: number; reason: string }[];
};

export function CompareEstimate({ caseId }: { caseId: string }) {
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
      if (!res.ok) throw new Error(data.error ?? "Comparison failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[1rem] border border-success/20 bg-success-bg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-success">Bill + policy</p><h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">What might insurance pay?</h3><p className="mt-1 text-sm leading-6 text-text-muted">An estimate based on the bill and the limits found in your policy.</p></div><button onClick={() => void handleCompare()} disabled={busy} className="focus-ring min-h-10 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{busy ? "Calculating..." : result ? "Recalculate" : "Compare now"}</button></div>
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
      {result && <div className="mt-5"><div className="grid gap-3 sm:grid-cols-2"><ImpactCard tone="success" label="Estimated insurer payment"><MoneyValue value={result.insurerPays} size="lg" className="mt-2 block text-success" /><p className="mt-2 text-xs text-text-muted">This is an estimate, not a final claim decision.</p></ImpactCard><ImpactCard tone="warning" label="Estimated patient responsibility"><MoneyValue value={result.patientPays} size="lg" className="mt-2 block text-warning" /><p className="mt-2 text-xs text-text-muted">Confirm the final amount with your insurer and hospital.</p></ImpactCard></div><div className="mt-5 rounded-[1rem] border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">How the estimate changes</p><p className="mt-1 font-medium text-text-primary">Starting from {formatMoney(result.totalBilled)}</p></div><StatusBadge tone="info">Policy-based estimate</StatusBadge></div><div className="mt-4 grid gap-2">{result.whyLines.map((line, index) => <div key={`${line.label}-${index}`} className="flex flex-col gap-1 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-text-primary">{line.label}</p><p className="text-xs leading-5 text-text-muted">{line.reason}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">−{formatMoney(line.amount)}</p></div>)}</div></div></div>}
    </div>
  );
}
