import type { Locale } from "../i18n/types.ts";

export type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

export type SpeechRecognitionResultLike = {
  [index: number]: SpeechRecognitionAlternativeLike;
  length: number;
};

export type SpeechRecognitionResultListLike = {
  [index: number]: SpeechRecognitionResultLike;
  length: number;
};

export type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultListLike;
};

export type SpeechRecognitionErrorEventLike = {
  error: string;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

export type VoiceErrorKind =
  | "permission"
  | "no-speech"
  | "service"
  | "language"
  | "aborted"
  | "unknown";

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function getSpeechRecognitionLanguage(locale: Locale): "en-IN" | "hi-IN" {
  return locale === "hi" ? "hi-IN" : "en-IN";
}

export function combineVoiceTranscript(baseQuestion: string, transcript: string): string {
  const base = baseQuestion.trim();
  const addition = transcript.trim();
  return [base, addition].filter(Boolean).join(" ");
}

export function classifySpeechRecognitionError(error: string): VoiceErrorKind {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
    case "audio-capture":
      return "permission";
    case "no-speech":
      return "no-speech";
    case "network":
      return "service";
    case "language-not-supported":
      return "language";
    case "aborted":
      return "aborted";
    default:
      return "unknown";
  }
}
