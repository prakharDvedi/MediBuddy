"use client";

import { createClient } from "@/lib/supabase/client";
import { ProcessingSteps, type StepState } from "@/components/processing-steps";
import { cn, ErrorState, StatusBadge } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";

const DOC_TYPES = [
  { value: "unknown", label: "Not sure" },
  { value: "estimate", label: "Hospital estimate" },
  { value: "bill", label: "Hospital bill" },
  { value: "prescription", label: "Prescription" },
  { value: "quotation", label: "Procedure quotation" },
  { value: "policy", label: "Insurance policy" },
  { value: "approval", label: "Insurance approval" },
] as const;

type UploadDocumentType = (typeof DOC_TYPES)[number]["value"];
const STANDARD_STAGE_LABELS = ["Uploading document", "Reading pages", "Understanding details"];
const POLICY_STAGE_LABELS = ["Uploading document", "Reading pages", "Understanding policy", "Preparing summary"];
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

type UploadDocumentProps = {
  caseId: string | null;
  ensureCase?: () => Promise<string>;
  initialDocType?: UploadDocumentType;
  helperText?: string;
};

export function UploadDocument({ caseId, ensureCase, initialDocType = "unknown", helperText }: UploadDocumentProps) {
  const [docType, setDocType] = useState<UploadDocumentType>(initialDocType);
  const [stage, setStage] = useState(-1);
  const [errorStage, setErrorStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const stageLabels = docType === "policy" ? POLICY_STAGE_LABELS : STANDARD_STAGE_LABELS;
  const completionStage = stageLabels.length;
  const busy = stage >= 0 && stage < completionStage;

  async function handleUpload(file: File) {
    const supportedFile = ACCEPTED_MIME_TYPES.has(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!supportedFile) {
      setError("Please choose a PDF, JPG, or PNG file.");
      setErrorStage(null);
      return;
    }
    if (caseId === null && !ensureCase) throw new Error("UploadDocument: ensureCase is required when caseId is null");

    let currentStage = 0;
    setStage(currentStage);
    setErrorStage(null);
    setError(null);
    setSummary(null);

    try {
      const resolvedCaseId = caseId ?? (await ensureCase!());
      const createRes = await fetch(`/api/cases/${resolvedCaseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, docType }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error ?? "Could not prepare upload");

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("documents").uploadToSignedUrl(created.storagePath, created.token, file);
      if (uploadError) throw uploadError;

      currentStage = 1;
      setStage(currentStage);
      const extractRes = await fetch(`/api/documents/${created.documentId}/extract`, { method: "POST" });
      const extracted = await extractRes.json();
      if (!extractRes.ok) throw new Error(extracted.error ?? "Could not read this document");

      currentStage = 2;
      setStage(currentStage);
      if (docType === "policy") {
        currentStage = 3;
        setStage(currentStage);
        const policyRes = await fetch(`/api/documents/${created.documentId}/policy`, { method: "POST" });
        const policy = await policyRes.json();
        if (!policyRes.ok) throw new Error(policy.error ?? "Could not prepare the policy summary");
        const chunkCount = typeof policy.chunkCount === "number" ? policy.chunkCount : 0;
        setSummary(`Read ${extracted.pageCount} page(s) and prepared ${chunkCount} policy section(s).`);
      } else {
        const structureRes = await fetch(`/api/documents/${created.documentId}/structure`, { method: "POST" });
        const structured = await structureRes.json();
        if (!structureRes.ok) throw new Error(structured.error ?? "Could not understand this document");

        if (structured.docType === "policy") {
          const policyRes = await fetch(`/api/documents/${created.documentId}/policy`, { method: "POST" });
          const policy = await policyRes.json();
          if (!policyRes.ok) throw new Error(policy.error ?? "Could not prepare the policy summary");
          setSummary(`Read ${extracted.pageCount} page(s) and prepared the coverage details.`);
        } else {
          setSummary(`Read ${extracted.pageCount} page(s) and found ${structured.itemCount} line item(s).`);
        }
      }

      setStage(completionStage);
      if (caseId === null) router.push(`/case/${resolvedCaseId}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setErrorStage(currentStage);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;

    const file = event.dataTransfer.files[0];
    if (file) void handleUpload(file);
  }

  const steps = stageLabels.map((label, i) => {
    let state: StepState = "pending";
    if (errorStage === i) state = "error";
    else if (stage > i || stage === completionStage) state = "done";
    else if (stage === i) state = "active";
    return { label, state };
  });

  return (
    <div>
      {helperText && <p className="mb-5 text-sm leading-6 text-text-muted">{helperText}</p>}
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn("rounded-[1rem] border border-dashed border-border-strong bg-soft-canvas/70 p-5 text-center transition-colors hover:border-info sm:p-8", isDragging && "border-info bg-info-bg/60")}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-info-bg text-xl text-info">↑</div>
        <p className="mt-4 font-medium text-text-primary">Drop a document here or choose a file</p>
        <p className="mt-1 text-sm text-text-muted">PDF, JPG, or PNG · Your original stays private</p>
        <label className="focus-ring mt-5 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-hover">
          Choose a file
          <input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleUpload(file); }} className="sr-only" />
        </label>
        <div className="mx-auto mt-5 flex max-w-sm flex-col gap-2 text-left sm:flex-row sm:items-center">
          <label htmlFor="document-type" className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">Document type</label>
          <select id="document-type" value={docType} onChange={(e) => setDocType(e.target.value as UploadDocumentType)} disabled={busy} className="focus-ring min-h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary disabled:opacity-50">
            {DOC_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </div>
      </div>
      {stage >= 0 && <div className="mt-5 rounded-[1rem] border border-info/20 bg-info-bg/70 p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-text-primary">Preparing your review</p><StatusBadge tone={error ? "danger" : stage === completionStage ? "success" : "info"}>{error ? "Needs attention" : stage === completionStage ? "Ready" : "In progress"}</StatusBadge></div><div className="mt-4"><ProcessingSteps steps={steps} /></div></div>}
      {summary && <p className="mt-3 text-sm font-medium text-success">{summary}</p>}
      {error && <div className="mt-3"><ErrorState message={error} /></div>}
    </div>
  );
}
