"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcessingSteps, type StepState } from "@/components/processing-steps";
import { Button, ErrorState, SectionHeader, StatusBadge } from "@/components/ui";

const STAGE_LABELS = ["Checking", "Preparing questions"];

export function ReviewWorkspaceHeader({ caseId }: { caseId: string }) {
  // -1 = idle, 0-1 = that stage active, 2 = all done
  const [stage, setStage] = useState(-1);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const busy = stage >= 0 && stage < 2;

  async function handleClick() {
    let currentStage = 0;
    setStage(currentStage);
    setErrorStage(null);
    setError(null);

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
    <div className="grid gap-4">
      <SectionHeader
        eyebrow="Your review"
        title="Things worth checking"
        description="These are observations to clarify, not accusations. Open the evidence before deciding what to ask."
        action={
          <Button type="button" onClick={() => void handleClick()} disabled={busy} className="w-full sm:w-auto">
            {busy ? "Reviewing..." : "Review charges"}
          </Button>
        }
      />
      {stage >= 0 && (
        <div className="w-full rounded-[0.875rem] border border-info/20 bg-info-bg px-4 py-3 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-text-primary">{error ? "Review needs attention" : stage === 2 ? "Review ready" : "Preparing your review"}</p>
            <StatusBadge tone={error ? "danger" : stage === 2 ? "success" : "info"}>{error ? "Needs attention" : stage === 2 ? "Ready" : "In progress"}</StatusBadge>
          </div>
          <ProcessingSteps steps={steps} />
        </div>
      )}
      {error && <ErrorState message={error} />}
    </div>
  );
}
