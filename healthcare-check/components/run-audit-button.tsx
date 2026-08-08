"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunAuditButton({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setBusy(true);
    setError(null);

    setStatus("Running audit checks...");
    const auditRes = await fetch(`/api/cases/${caseId}/audit`, { method: "POST" });
    const audit = await auditRes.json();
    if (!auditRes.ok) {
      setError(audit.error ?? "Audit failed");
      setStatus(null);
      setBusy(false);
      return;
    }

    setStatus("Generating questions for the hospital...");
    const questionsRes = await fetch(`/api/cases/${caseId}/questions`, { method: "POST" });
    const questions = await questionsRes.json();
    if (!questionsRes.ok) {
      setError(questions.error ?? "Question generation failed");
      setStatus(null);
      setBusy(false);
      return;
    }

    setStatus(
      `Done — ${audit.findingsCount} finding(s), ${questions.questionsCount} question(s).`,
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Working..." : "Run audit"}
      </button>
      {status && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
