"use client";

import { useState } from "react";

type Page = { page_number: number; content: string };

export function DocumentPages({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !pages) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/pages`);
      const data = await res.json();
      setPages(data.pages ?? []);
      setLoading(false);
    }
    setOpen((o) => !o);
  }

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="text-xs underline text-zinc-600 dark:text-zinc-400"
      >
        {open ? "Hide extracted text" : "View extracted text"}
      </button>
      {loading && <p className="mt-1 text-xs text-zinc-500">Loading...</p>}
      {open && pages && (
        <div className="mt-2 flex flex-col gap-2">
          {pages.length === 0 && (
            <p className="text-xs text-zinc-500">No pages extracted yet.</p>
          )}
          {pages.map((p) => (
            <div
              key={p.page_number}
              className="rounded border border-black/10 dark:border-white/10 p-2"
            >
              <p className="text-xs font-medium text-zinc-500">
                Page {p.page_number}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300">
                {p.content || "(no extractable text on this page)"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
