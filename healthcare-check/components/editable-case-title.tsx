"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function EditableCaseTitle({ caseId, title }: { caseId: string; title: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      setError(data.error ?? "Could not save title");
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
          className="w-full rounded border border-black/15 dark:border-white/15 bg-transparent px-1 py-0.5 text-2xl font-semibold text-black dark:text-zinc-50 disabled:opacity-50"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="mt-2 block text-left text-2xl font-semibold text-black dark:text-zinc-50 hover:underline decoration-black/20 dark:decoration-white/20"
      title="Click to rename"
    >
      {title}
    </button>
  );
}
