"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState, SourceBadge, StatusBadge } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import {
  POLICY_UI_COPY,
  type PolicyAnswer,
  type PolicyAnswerLanguage,
} from "@/lib/documents/policy-language";
import {
  classifySpeechRecognitionError,
  combineVoiceTranscript,
  getSpeechRecognitionConstructor,
  getSpeechRecognitionLanguage,
  type SpeechRecognitionLike,
} from "@/lib/voice/speech-recognition";

type Answer = PolicyAnswer & {
  answerLanguage: PolicyAnswerLanguage;
};

export function AskPolicy({ caseId }: { caseId: string }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [voiceHasTranscript, setVoiceHasTranscript] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceBaseQuestionRef = useRef("");
  const { locale: answerLanguage } = useLocale();
  const copy = POLICY_UI_COPY[answerLanguage];
  const answerCopy = answer ? POLICY_UI_COPY[answer.answerLanguage] : copy;

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const input = questionInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [question]);

  function handleVoiceError(errorCode: string) {
    const errorKind = classifySpeechRecognitionError(errorCode);
    if (errorKind === "aborted") return;
    setVoiceMessage(copy.voice[errorKind === "permission" ? "permission" : errorKind === "no-speech" ? "noSpeech" : errorKind === "service" ? "service" : errorKind === "language" ? "language" : "generic"]);
  }

  function handleVoiceToggle() {
    if (voiceListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setVoiceSupported(false);
      setVoiceMessage(copy.voice.unsupported);
      return;
    }

    const recognition = new Recognition();
    voiceBaseQuestionRef.current = question;
    recognition.lang = getSpeechRecognitionLanguage(answerLanguage);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      setVoiceHasTranscript(Boolean(transcript.trim()));
      setQuestion(combineVoiceTranscript(voiceBaseQuestionRef.current, transcript));
    };
    recognition.onerror = (event) => {
      handleVoiceError(event.error);
      setVoiceListening(false);
    };
    recognition.onend = () => {
      setVoiceListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setVoiceMessage(null);
    setVoiceHasTranscript(false);
    setVoiceListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceListening(false);
      setVoiceMessage(copy.voice.generic);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    if (voiceListening) recognitionRef.current?.stop();
    const submittedQuestion = question.trim();
    setQuestion("");
    setVoiceMessage(null);
    setVoiceHasTranscript(false);
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`/api/insurance/${caseId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: submittedQuestion, answer_language: answerLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? copy.error);
      setAnswer({ ...data, answerLanguage: data.answerLanguage ?? answerLanguage });
    } catch (err) {
      setQuestion(submittedQuestion);
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
        <SourceBadge>{copy.grounded}</SourceBadge>
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
        <textarea
          ref={questionInputRef}
          rows={1}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!busy && !voiceListening && question.trim()) void handleAsk();
            }
          }}
          placeholder={copy.placeholder}
          lang={answerLanguage}
          disabled={busy || voiceListening}
          className="focus-ring scrollbar-hidden min-h-11 max-h-40 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-info/20 bg-surface px-3 py-2.5 text-sm leading-6 text-text-primary placeholder:text-text-muted/70 disabled:opacity-50"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={busy}
            aria-pressed={voiceListening}
            aria-label={voiceListening ? copy.voice.stop : copy.voice.start}
            className={`focus-ring min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors disabled:opacity-50 ${voiceListening ? "border-danger/30 bg-danger-bg text-danger" : "border-info/20 bg-surface text-info hover:bg-surface-elevated"}`}
          >
            {voiceListening ? copy.voice.stop : copy.voice.start}
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleAsk()}
          disabled={busy || voiceListening || !question.trim()}
          className="focus-ring min-h-11 rounded-xl bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? copy.checking : copy.ask}
        </button>
      </div>

      {voiceSupported && (
        <>
          {(voiceListening || voiceMessage || voiceHasTranscript) && (
            <p className="mt-2 text-xs leading-5 text-text-muted" aria-live="polite">
              {voiceListening ? copy.voice.listening : voiceMessage ?? copy.voice.review}
            </p>
          )}
          <p className="mt-2 text-xs leading-5 text-text-muted">{copy.voice.privacy}</p>
        </>
      )}

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
