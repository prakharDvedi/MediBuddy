"use client";

import { useState } from "react";

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

export function DocumentItems({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !items) {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/items`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    }
    setOpen((o) => !o);
  }

  return (
    <div className="mt-2">
      <button onClick={toggle} className="text-xs underline text-zinc-600 dark:text-zinc-400">
        {open ? "Hide line items" : "View line items"}
      </button>
      {loading && <p className="mt-1 text-xs text-zinc-500">Loading...</p>}
      {open && items && (
        <div className="mt-2 overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-xs text-zinc-500">No line items extracted.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pr-3 py-1">Item</th>
                  <th className="pr-3 py-1">Type</th>
                  <th className="pr-3 py-1">Qty</th>
                  <th className="pr-3 py-1">Unit price</th>
                  <th className="pr-3 py-1">Total</th>
                  <th className="pr-3 py-1">Page</th>
                  <th className="py-1">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-black/5 dark:border-white/10">
                    <td className="pr-3 py-1 text-zinc-800 dark:text-zinc-200">{item.name}</td>
                    <td className="pr-3 py-1 text-zinc-500">{item.item_type}</td>
                    <td className="pr-3 py-1 text-zinc-500">{item.quantity ?? "—"}</td>
                    <td className="pr-3 py-1 text-zinc-500">{item.unit_price ?? "—"}</td>
                    <td className="pr-3 py-1 text-zinc-500">{item.total_price ?? "—"}</td>
                    <td className="pr-3 py-1 text-zinc-500">{item.source_page ?? "—"}</td>
                    <td className="py-1 text-zinc-500">{item.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
