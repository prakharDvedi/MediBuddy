"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UploadDocument } from "@/components/upload-document";
import { createCase } from "@/lib/cases/create-case";

/**
 * No case row exists yet on this screen — one gets created the first time
 * the user does something real (names it, or uploads a file), never just
 * from opening the page. Both paths share one in-flight promise so if the
 * user somehow triggers both at once, only one row gets created.
 */
export function NewCaseShell() {
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
      setError(err instanceof Error ? err.message : "Could not create case");
      setBusy(false);
    }
  }

  return (
    <div>
      <input
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
        placeholder="Untitled case"
        autoFocus
        className="mt-2 block w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-1 py-0.5 text-2xl font-semibold text-black dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <UploadDocument caseId={null} ensureCase={ensureCase} />
      </div>
    </div>
  );
}
