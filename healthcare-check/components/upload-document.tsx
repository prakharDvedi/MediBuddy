"use client";

import { createClient } from "@/lib/supabase/client";
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

export function UploadDocument({ caseId }: { caseId: string }) {
  const [docType, setDocType] = useState("unknown");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(file: File) {
    setBusy(true);
    setError(null);
    setStatus("Preparing upload...");

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

      setStatus("Uploading file...");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(created.storagePath, created.token, file);
      if (uploadError) throw uploadError;

      setStatus("Extracting text...");
      const extractRes = await fetch(`/api/documents/${created.documentId}/extract`, {
        method: "POST",
      });
      const extracted = await extractRes.json();
      if (!extractRes.ok) throw new Error(extracted.error ?? "Extraction failed");

      setStatus("Classifying and structuring line items...");
      const structureRes = await fetch(`/api/documents/${created.documentId}/structure`, {
        method: "POST",
      });
      const structured = await structureRes.json();
      if (!structureRes.ok) throw new Error(structured.error ?? "Structuring failed");

      if (structured.docType === "policy") {
        setStatus("Extracting coverage details...");
        const policyRes = await fetch(`/api/documents/${created.documentId}/policy`, {
          method: "POST",
        });
        const policy = await policyRes.json();
        if (!policyRes.ok) throw new Error(policy.error ?? "Policy extraction failed");

        setStatus(`Done — extracted ${extracted.pageCount} page(s) and coverage details.`);
      } else {
        setStatus(
          `Done — extracted ${extracted.pageCount} page(s), found ${structured.itemCount} line item(s).`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus(null);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={busy}
          className="rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
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
          className="text-sm"
        />
      </div>
      {status && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{status}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
