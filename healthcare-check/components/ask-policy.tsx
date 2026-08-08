"use client";

import { useState } from "react";

type Citation = { page: number | null; section: string | null };

type Answer = {
  answer: string;
  basis: "policy_states" | "calculated_from_policy" | "requires_confirmation";
  citations: Citation[];
  confidence: "high" | "medium" | "low";
  chunksUsed?: number;
};

const BASIS_LABEL: Record<Answer["basis"], string> = {
  policy_states: "Policy states",
  calculated_from_policy: "Calculated from policy",
  requires_confirmation: "Requires insurer confirmation",
};

export function AskPolicy({ caseId }: { caseId: string }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);

  async function handleAsk() {
    if (!question.trim()) return;
    setBusy(true);
    setError(null);
    setAnswer(null);

    const res = await fetch(`/api/insurance/${caseId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not answer that question");
    } else {
      setAnswer(data);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      <p className="text-sm font-medium text-black dark:text-zinc-50">Ask about your policy</p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="e.g. Is maternity covered, and how much?"
          disabled={busy}
          className="flex-1 rounded border border-black/15 dark:border-white/15 bg-transparent px-2 py-1.5 text-sm"
        />
        <button
          onClick={handleAsk}
          disabled={busy || !question.trim()}
          className="rounded-full border border-black/15 dark:border-white/15 px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Asking..." : "Ask"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {answer && (
        <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              {BASIS_LABEL[answer.basis]}
            </span>
            <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
              {answer.confidence} confidence
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{answer.answer}</p>
          {answer.citations.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Sources:{" "}
              {answer.citations
                .map((c) => [c.section, c.page != null ? `page ${c.page}` : null].filter(Boolean).join(", "))
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
