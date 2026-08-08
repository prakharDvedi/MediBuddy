"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcessingSteps, type StepState } from "@/components/processing-steps";

const STAGE_LABELS = ["Checking", "Preparing questions"];

export function RunAuditButton({ caseId }: { caseId: string }) {
  // -1 = idle, 0-1 = that stage active, 2 = all done
  const [stage, setStage] = useState(-1);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const router = useRouter();
  const busy = stage >= 0 && stage < 2;

  async function handleClick() {
    let currentStage = 0;
    setStage(currentStage);
    setErrorStage(null);
    setError(null);
    setSummary(null);

    const auditRes = await fetch(`/api/cases/${caseId}/audit`, { method: "POST" });
    const audit = await auditRes.json();
    if (!auditRes.ok) {
      setError(audit.error ?? "Audit failed");
      setErrorStage(currentStage);
      return;
    }

    currentStage = 1;
    setStage(currentStage);
    const questionsRes = await fetch(`/api/cases/${caseId}/questions`, { method: "POST" });
    const questions = await questionsRes.json();
    if (!questionsRes.ok) {
      setError(questions.error ?? "Question generation failed");
      setErrorStage(currentStage);
      return;
    }

    setSummary(`${audit.findingsCount} finding(s), ${questions.questionsCount} question(s).`);
    setStage(2);
    router.refresh();
  }

  const steps = STAGE_LABELS.map((label, i) => {
    let state: StepState = "pending";
    if (errorStage === i) state = "error";
    else if (stage > i || stage === 2) state = "done";
    else if (stage === i) state = "active";
    return { label, state };
  });

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Working..." : "Run audit"}
      </button>
      {stage >= 0 && (
        <div className="mt-3">
          <ProcessingSteps steps={steps} />
        </div>
      )}
      {summary && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
