"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";

export function EditableCaseTitle({ caseId, title }: { caseId: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { locale } = useLocale();
  const copy = APP_COPY[locale].shell;

  function startEditing() {
    setValue(title);
    setError(null);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? copy.saveTitleError);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          disabled={saving}
          autoFocus
          className="focus-ring w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-2xl font-semibold tracking-tight text-text-primary disabled:opacity-50"
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="focus-ring mt-2 block rounded-lg text-left text-2xl font-semibold tracking-tight text-text-primary hover:underline decoration-border-strong"
      title={copy.renameCase}
    >
      {title}
    </button>
  );
}
