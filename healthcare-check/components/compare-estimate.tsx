"use client";

import { useState } from "react";

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

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CompareEstimate({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  async function handleCompare() {
    setBusy(true);
    setError(null);
    setResult(null);

    const res = await fetch(`/api/insurance/${caseId}/compare`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Comparison failed");
    } else {
      setResult(data);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black dark:text-zinc-50">
          Estimate vs. policy comparison
        </p>
        <button
          onClick={handleCompare}
          disabled={busy}
          className="rounded-full border border-black/15 dark:border-white/15 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-zinc-500">Total billed</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">{inr(result.totalBilled)}</dd>
            {result.subLimitDeductions > 0 && (
              <>
                <dt className="text-zinc-500">Sub-limit deductions</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">
                  -{inr(result.subLimitDeductions)}
                </dd>
              </>
            )}
            <dt className="text-zinc-500">Deductible applied</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">-{inr(result.deductibleApplied)}</dd>
            <dt className="text-zinc-500">Co-payment ({result.copayPercent}%)</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">-{inr(result.copayAmount)}</dd>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">Insurer pays</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-200">
              {inr(result.insurerPays)}
            </dd>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">You pay</dt>
            <dd className="font-medium text-zinc-800 dark:text-zinc-200">
              {inr(result.patientPays)}
            </dd>
          </dl>
          {result.whyLines.length > 0 && (
            <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2">
              <p className="text-xs font-medium text-zinc-500">Why</p>
              <ul className="mt-1 flex flex-col gap-2">
                {result.whyLines.map((w, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">
                      {w.label}: {inr(w.amount)}
                    </span>
                    <br />
                    <span className="text-xs text-zinc-500">{w.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
