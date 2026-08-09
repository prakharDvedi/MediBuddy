"use client";

import { useState } from "react";
import { cn, StatusBadge } from "@/components/ui";
import { confidenceLabel, confidenceTone } from "@/lib/presentation";
import { formatMoney } from "@/lib/dashboard/format";

type Page = { page_number: number; content: string };
type Item = { id: string; item_type: string; name: string; normalized_name: string; quantity: number | null; unit_price: number | null; total_price: number | null; source_page: number | null; confidence: string };
type Tab = "items" | "text";

function money(n: number | null) { return n != null ? formatMoney(n) : "—"; }

export function DocumentDetails({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<Item[] | null>(null);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(nextTab: Tab) {
    if (nextTab === "items" && !items) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/items`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    } else if (nextTab === "text" && !pages) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/pages`);
      const data = await res.json();
      setPages(data.pages ?? []);
      setLoading(false);
    }
  }

  async function toggle() {
    if (loading) return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    await load(tab);
  }
  async function switchTab(nextTab: Tab) { setTab(nextTab); await load(nextTab); }

  return (
    <div className="mt-4 -mx-4 -mb-4 border-t border-border">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={loading}
        aria-busy={loading}
        className={cn("focus-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors", loading ? "cursor-wait bg-info-bg/50 text-info" : "text-info hover:bg-info-bg/50")}
      >
        <span className="inline-flex items-center gap-2">
          {loading && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-info/30 border-t-info" />}
          {loading ? "Loading extracted details…" : open ? "Hide extracted details" : "View extracted details"}
        </span>
        {!loading && <span aria-hidden="true" className="text-base">{open ? "↑" : "↓"}</span>}
      </button>
      {open && <div className="overflow-hidden border-t border-info/20 bg-info-bg"><div className="flex border-b border-info/20 bg-surface/70">{(["items", "text"] as const).map((nextTab) => <button type="button" key={nextTab} onClick={() => void switchTab(nextTab)} disabled={loading} className={cn("focus-ring border-b-2 px-4 py-3 text-xs font-semibold", tab === nextTab ? "border-info text-info" : "border-transparent text-text-muted hover:text-text-primary")}>{nextTab === "items" ? "Line items" : "Extracted text"}</button>)}</div><div className="max-h-80 overflow-y-auto p-4">{loading && <p className="text-sm text-text-muted">Loading extracted details...</p>}{!loading && tab === "items" && <ItemsTable items={items ?? []} />}{!loading && tab === "text" && <ExtractedText pages={pages ?? []} />}</div></div>}
    </div>
  );
}

function ItemsTable({ items }: { items: Item[] }) {
  if (items.length === 0) return <p className="text-sm text-text-muted">No line items extracted yet.</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-xs"><thead><tr className="border-b border-border text-left text-text-muted"><th className="py-2 pr-3 font-medium">Item</th><th className="py-2 pr-3 font-medium">Type</th><th className="py-2 pr-3 text-right font-medium">Qty</th><th className="py-2 pr-3 text-right font-medium">Unit</th><th className="py-2 pr-3 text-right font-medium">Total</th><th className="py-2 pr-3 font-medium">Page</th><th className="py-2 font-medium">Match</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id}><td className="py-2 pr-3 font-medium text-text-primary">{item.name}</td><td className="py-2 pr-3 text-text-muted">{item.item_type}</td><td className="py-2 pr-3 text-right text-text-muted">{item.quantity ?? "—"}</td><td className="py-2 pr-3 text-right text-text-muted">{money(item.unit_price)}</td><td className="py-2 pr-3 text-right text-text-primary">{money(item.total_price)}</td><td className="py-2 pr-3 text-text-muted">{item.source_page ?? "—"}</td><td className="py-2"><StatusBadge tone={confidenceTone(item.confidence)}>{confidenceLabel(item.confidence)}</StatusBadge></td></tr>)}</tbody></table></div>;
}

function ExtractedText({ pages }: { pages: Page[] }) {
  if (pages.length === 0) return <p className="text-sm text-text-muted">No pages extracted yet.</p>;
  return <div className="grid gap-5">{pages.map((page) => <div key={page.page_number}><p className="text-xs font-semibold uppercase tracking-[0.1em] text-info">Page {page.page_number}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{page.content || "No extractable text on this page."}</p></div>)}</div>;
}
