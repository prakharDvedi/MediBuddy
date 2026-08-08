"use client";

import { useState } from "react";

type Page = { page_number: number; content: string };

type Item = {
  id: string;
  item_type: string;
  name: string;
  normalized_name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  source_page: number | null;
  confidence: string;
};

type Tab = "items" | "text";

function money(n: number | null) {
  return n != null ? `₹${n.toLocaleString("en-IN")}` : "—";
}

/**
 * Single toggle with two tabs instead of two independent toggles side by
 * side — previously "View extracted text" and "View line items" could both
 * be open at once, splitting the card into two cramped columns and jumping
 * the whole page's layout by however long the content happened to be. This
 * caps the expanded area at a fixed height with internal scroll, so opening
 * it (or switching tabs) never reflows anything else on the page.
 */
export function DocumentDetails({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<Item[] | null>(null);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(t: Tab) {
    if (t === "items" && !items) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/items`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    } else if (t === "text" && !pages) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/pages`);
      const data = await res.json();
      setPages(data.pages ?? []);
      setLoading(false);
    }
  }

  async function toggle() {
    if (!open) await load(tab);
    setOpen((o) => !o);
  }

  async function switchTab(t: Tab) {
    setTab(t);
    await load(t);
  }

  return (
    <div className="mt-2">
      <button onClick={toggle} className="text-xs underline text-zinc-600 dark:text-zinc-400">
        {open ? "Hide details" : "View details"}
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded border border-black/10 dark:border-white/10">
          <div className="flex border-b border-black/10 dark:border-white/10">
            {(["items", "text"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={
                  "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px " +
                  (tab === t
                    ? "border-black dark:border-white text-black dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")
                }
              >
                {t === "items" ? "Line items" : "Extracted text"}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto p-3">
            {loading && <p className="text-xs text-zinc-500">Loading...</p>}

            {!loading && tab === "items" && (
              <ItemsTable items={items ?? []} />
            )}

            {!loading && tab === "text" && <ExtractedText pages={pages ?? []} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemsTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-zinc-500">No line items extracted.</p>;
  }

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white dark:bg-zinc-950">
        <tr className="border-b border-black/10 dark:border-white/10 text-left text-zinc-500">
          <th className="py-1.5 pr-3 font-medium">Item</th>
          <th className="py-1.5 pr-3 font-medium">Type</th>
          <th className="py-1.5 pr-3 text-right font-medium">Qty</th>
          <th className="py-1.5 pr-3 text-right font-medium">Unit</th>
          <th className="py-1.5 pr-3 text-right font-medium">Total</th>
          <th className="py-1.5 pr-3 font-medium">Page</th>
          <th className="py-1.5 font-medium">Confidence</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5 dark:divide-white/10">
        {items.map((item) => (
          <tr key={item.id}>
            <td className="py-1.5 pr-3 text-zinc-800 dark:text-zinc-200">{item.name}</td>
            <td className="py-1.5 pr-3 text-zinc-500">{item.item_type}</td>
            <td className="py-1.5 pr-3 text-right text-zinc-500">{item.quantity ?? "—"}</td>
            <td className="py-1.5 pr-3 text-right text-zinc-500">{money(item.unit_price)}</td>
            <td className="py-1.5 pr-3 text-right text-zinc-700 dark:text-zinc-300">
              {money(item.total_price)}
            </td>
            <td className="py-1.5 pr-3 text-zinc-500">{item.source_page ?? "—"}</td>
            <td className="py-1.5 text-zinc-500">{item.confidence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExtractedText({ pages }: { pages: Page[] }) {
  if (pages.length === 0) {
    return <p className="text-xs text-zinc-500">No pages extracted yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {pages.map((p) => (
        <div key={p.page_number}>
          <p className="text-xs font-medium text-zinc-500">Page {p.page_number}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300">
            {p.content || "(no extractable text on this page)"}
          </p>
        </div>
      ))}
    </div>
  );
}
