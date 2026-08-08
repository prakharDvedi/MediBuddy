"use client";

import { createClient } from "@/lib/supabase/client";
import { ProcessingSteps, type StepState } from "@/components/processing-steps";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const DOC_TYPES = [
  { value: "unknown", label: "Not sure" },
  { value: "estimate", label: "Hospital estimate" },
  { value: "bill", label: "Hospital bill" },
  { value: "prescription", label: "Prescription" },
  { value: "quotation", label: "Procedure quotation" },
  { value: "policy", label: "Insurance policy" },
  { value: "approval", label: "Insurance approval" },
];

const STAGE_LABELS = ["Uploading", "Extracting", "Understanding"];

export function UploadDocument({ caseId }: { caseId: string }) {
  const [docType, setDocType] = useState("unknown");
  // -1 = idle, 0-2 = that stage active, 3 = all done
  const [stage, setStage] = useState(-1);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const busy = stage >= 0 && stage < 3;

  async function handleUpload(file: File) {
    let currentStage = 0;
    setStage(currentStage);
    setErrorStage(null);
    setError(null);
    setSummary(null);

    try {
      const createRes = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          docType,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error ?? "Could not prepare upload");

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(created.storagePath, created.token, file);
      if (uploadError) throw uploadError;

      currentStage = 1;
      setStage(currentStage);
      const extractRes = await fetch(`/api/documents/${created.documentId}/extract`, {
        method: "POST",
      });
      const extracted = await extractRes.json();
      if (!extractRes.ok) throw new Error(extracted.error ?? "Extraction failed");

      currentStage = 2;
      setStage(currentStage);
      const structureRes = await fetch(`/api/documents/${created.documentId}/structure`, {
        method: "POST",
      });
      const structured = await structureRes.json();
      if (!structureRes.ok) throw new Error(structured.error ?? "Structuring failed");

      if (structured.docType === "policy") {
        const policyRes = await fetch(`/api/documents/${created.documentId}/policy`, {
          method: "POST",
        });
        const policy = await policyRes.json();
        if (!policyRes.ok) throw new Error(policy.error ?? "Policy extraction failed");

        setSummary(`Extracted ${extracted.pageCount} page(s) and coverage details.`);
      } else {
        setSummary(
          `Extracted ${extracted.pageCount} page(s), found ${structured.itemCount} line item(s).`,
        );
      }
      setStage(3);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setErrorStage(currentStage);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const steps = STAGE_LABELS.map((label, i) => {
    let state: StepState = "pending";
    if (errorStage === i) state = "error";
    else if (stage > i || stage === 3) state = "done";
    else if (stage === i) state = "active";
    return { label, state };
  });

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={busy}
          className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm disabled:opacity-50"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
          className="text-sm disabled:opacity-50"
        />
      </div>
      {stage >= 0 && (
        <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3">
          <ProcessingSteps steps={steps} />
        </div>
      )}
      {summary && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{summary}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
