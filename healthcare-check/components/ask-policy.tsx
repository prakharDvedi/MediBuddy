"use client";

import { useState } from "react";
import { ErrorState, SourceBadge, StatusBadge } from "@/components/ui";
import {
  POLICY_UI_COPY,
  type PolicyAnswer,
  type PolicyAnswerLanguage,
} from "@/lib/documents/policy-language";

type Answer = PolicyAnswer & {
  answerLanguage: PolicyAnswerLanguage;
};

const LANGUAGE_OPTIONS: { value: PolicyAnswerLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
];

export function AskPolicy({ caseId }: { caseId: string }) {
  const [question, setQuestion] = useState("");
  const [answerLanguage, setAnswerLanguage] = useState<PolicyAnswerLanguage>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const copy = POLICY_UI_COPY[answerLanguage];
  const answerCopy = answer ? POLICY_UI_COPY[answer.answerLanguage] : copy;

  async function handleAsk() {
    if (!question.trim()) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`/api/insurance/${caseId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer_language: answerLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? copy.error);
      setAnswer({ ...data, answerLanguage: data.answerLanguage ?? answerLanguage });
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  const answerTone =
    answer?.basis === "requires_confirmation"
      ? "warning"
      : answer?.basis === "calculated_from_policy"
        ? "success"
        : "info";

  return (
    <div className="rounded-[1rem] border border-info/20 bg-info-bg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">{copy.eyebrow}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{copy.title}</h3>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2" role="group" aria-label={copy.languageLabel}>
            <span className="text-xs font-medium text-text-muted">{copy.languageLabel}</span>
            <div className="flex rounded-full border border-info/20 bg-surface p-0.5">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={answerLanguage === option.value}
                  onClick={() => setAnswerLanguage(option.value)}
                  className={`focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${answerLanguage === option.value ? "bg-info text-white" : "text-info hover:bg-info-bg"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <SourceBadge>{copy.grounded}</SourceBadge>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">{copy.suggestedLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {copy.suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuestion(suggestion)}
              className="focus-ring rounded-full border border-info/20 bg-surface px-3 py-1.5 text-xs font-medium text-info hover:bg-surface-elevated"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleAsk();
          }}
          placeholder={copy.placeholder}
          lang={answerLanguage}
          disabled={busy}
          className="focus-ring min-h-11 flex-1 rounded-xl border border-info/20 bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted/70 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleAsk()}
          disabled={busy || !question.trim()}
          className="focus-ring min-h-11 rounded-xl bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? copy.checking : copy.ask}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {answer && (
        <div className="mt-5 rounded-[1rem] border border-info/20 bg-surface p-5" lang={answer.answerLanguage}>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={answerTone}>{answerCopy.basis[answer.basis]}</StatusBadge>
            <StatusBadge tone="neutral">{answerCopy.confidence[answer.confidence]}</StatusBadge>
          </div>
          <p className="mt-4 text-base leading-7 text-text-primary">{answer.answer}</p>
          {answer.citations.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">{answerCopy.sources}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {answer.citations.map((citation, index) => (
                  <span key={`${citation.section ?? "source"}-${citation.page ?? "unknown"}-${index}`} className="rounded-lg bg-info-bg px-2.5 py-1.5 text-xs font-medium text-info">
                    {[citation.section, citation.page != null ? `Page ${citation.page}` : null].filter(Boolean).join(" · ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
