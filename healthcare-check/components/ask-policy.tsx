"use client";

import { useState } from "react";
import { ErrorState, SourceBadge, StatusBadge } from "@/components/ui";

type Citation = { page: number | null; section: string | null };
type Answer = { answer: string; basis: "policy_states" | "calculated_from_policy" | "requires_confirmation"; citations: Citation[]; confidence: "high" | "medium" | "low" };

const BASIS_LABEL: Record<Answer["basis"], string> = {
  policy_states: "Stated in your policy",
  calculated_from_policy: "Calculated from your policy",
  requires_confirmation: "Needs insurer confirmation",
};

const SUGGESTED_QUESTIONS = ["What is my room-rent limit?", "Is maternity covered?", "What co-pay applies?"];

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
    try {
      const res = await fetch(`/api/insurance/${caseId}/ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not answer that question");
      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer that question");
    } finally {
      setBusy(false);
    }
  }

  const answerTone = answer?.basis === "requires_confirmation" ? "warning" : answer?.basis === "calculated_from_policy" ? "success" : "info";

  return (
    <div className="rounded-[1rem] border border-info/20 bg-info-bg p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">Policy questions</p><h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">Ask your policy</h3></div><SourceBadge>Grounded in your document</SourceBadge></div>
      <div className="mt-5 flex flex-wrap gap-2">{SUGGESTED_QUESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="focus-ring rounded-full border border-info/20 bg-surface px-3 py-1.5 text-xs font-medium text-info hover:bg-surface-elevated">{suggestion}</button>)}</div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleAsk(); }} placeholder="Ask a plain-language question about your policy" disabled={busy} className="focus-ring min-h-11 flex-1 rounded-xl border border-info/20 bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted/70 disabled:opacity-50" /><button type="button" onClick={() => void handleAsk()} disabled={busy || !question.trim()} className="focus-ring min-h-11 rounded-xl bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{busy ? "Checking..." : "Ask question"}</button></div>
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
      {answer && <div className="mt-5 rounded-[1rem] border border-info/20 bg-surface p-5"><div className="flex flex-wrap gap-2"><StatusBadge tone={answerTone}>{BASIS_LABEL[answer.basis]}</StatusBadge><StatusBadge tone="neutral">{answer.confidence === "high" ? "Strong match" : answer.confidence === "medium" ? "Good match" : "Review carefully"}</StatusBadge></div><p className="mt-4 text-base leading-7 text-text-primary">{answer.answer}</p>{answer.citations.length > 0 && <div className="mt-4 border-t border-border pt-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">Sources</p><div className="mt-2 flex flex-wrap gap-2">{answer.citations.map((citation, index) => <span key={index} className="rounded-lg bg-info-bg px-2.5 py-1.5 text-xs font-medium text-info">{[citation.section, citation.page != null ? `Page ${citation.page}` : null].filter(Boolean).join(" · ")}</span>)}</div></div>}</div>}
    </div>
  );
}
