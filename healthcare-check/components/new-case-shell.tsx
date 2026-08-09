"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadDocument } from "@/components/upload-document";
import { createCase } from "@/lib/cases/create-case";
import { CASE_INTENT_CONFIG, type CaseIntent } from "@/lib/cases/intents";
import { ErrorState } from "@/components/ui";

export function NewCaseShell({ intent }: { intent: CaseIntent }) {
  const config = CASE_INTENT_CONFIG[intent];
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<Promise<string> | null>(null);
  const router = useRouter();

  function ensureCase(): Promise<string> {
    if (!pendingRef.current) {
      pendingRef.current = createCase(title.trim() || undefined)
        .then((c) => c.id)
        .catch((err) => {
          pendingRef.current = null;
          throw err;
        });
    }
    return pendingRef.current;
  }

  async function handleTitleBlur() {
    if (!title.trim() || pendingRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const id = await ensureCase();
      router.push(`/case/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this check");
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-info">Step 1 of 2 · Add a document</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-text-primary sm:text-4xl">{config.onboardingTitle}</h1>
        <p className="mt-4 text-base leading-7 text-text-muted">{config.onboardingDescription}</p>
      </div>

      <div className="mt-8 rounded-[1rem] border border-border bg-surface p-5 shadow-[0_14px_34px_rgb(23_43_58_/_0.05)] sm:p-6">
        <label htmlFor="case-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Name this check <span className="font-normal normal-case tracking-normal">(optional)</span></label>
        <input
          id="case-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          disabled={busy}
          placeholder="e.g. Sunrise Hospital estimate"
          autoFocus
          className="focus-ring mt-2 block w-full border-b border-border-strong bg-transparent px-0 py-2 text-2xl font-semibold tracking-tight text-text-primary placeholder:text-text-muted/50 disabled:opacity-50"
        />
        {error && <div className="mt-4"><ErrorState message={error} /></div>}
        <div className="mt-6 border-t border-border pt-6">
          <UploadDocument
            caseId={null}
            ensureCase={ensureCase}
            initialDocType={config.initialDocumentType}
            helperText={config.uploadGuidance}
          />
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-text-muted">Your original document stays private. MedBud shows source pages alongside important findings so you can verify the details yourself.</p>
    </div>
  );
}
