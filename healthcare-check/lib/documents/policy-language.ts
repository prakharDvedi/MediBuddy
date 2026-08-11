export const POLICY_ANSWER_LANGUAGES = ["en", "hi"] as const;

export type PolicyAnswerLanguage = (typeof POLICY_ANSWER_LANGUAGES)[number];

export type PolicyAnswerBasis =
  | "policy_states"
  | "calculated_from_policy"
  | "requires_confirmation";

export type PolicyCitation = { page: number | null; section: string | null };

export type PolicyAnswer = {
  answer: string;
  basis: PolicyAnswerBasis;
  citations: PolicyCitation[];
  confidence: "high" | "medium" | "low";
};

export type PolicyUiCopy = {
  eyebrow: string;
  title: string;
  grounded: string;
  languageLabel: string;
  suggestedLabel: string;
  placeholder: string;
  ask: string;
  checking: string;
  sources: string;
  basis: Record<PolicyAnswerBasis, string>;
  confidence: Record<PolicyAnswer["confidence"], string>;
  suggestedQuestions: string[];
  noMatch: string;
  error: string;
};

export const POLICY_UI_COPY: Record<PolicyAnswerLanguage, PolicyUiCopy> = {
  en: {
    eyebrow: "Policy questions",
    title: "Ask your policy",
    grounded: "Grounded in your document",
    languageLabel: "Answer language",
    suggestedLabel: "Try a question",
    placeholder: "Ask a plain-language question about your policy",
    ask: "Ask question",
    checking: "Checking...",
    sources: "Sources",
    basis: {
      policy_states: "Stated in your policy",
      calculated_from_policy: "Calculated from your policy",
      requires_confirmation: "Needs insurer confirmation",
    },
    confidence: {
      high: "Strong match",
      medium: "Good match",
      low: "Review carefully",
    },
    suggestedQuestions: [
      "What is my room-rent limit?",
      "Is maternity covered?",
      "What co-pay applies?",
    ],
    noMatch:
      "The uploaded policy doesn't contain anything matching this question. Please confirm this directly with your insurer.",
    error: "Could not answer that question",
  },
  hi: {
    eyebrow: "पॉलिसी से जुड़े सवाल",
    title: "अपनी पॉलिसी से पूछें",
    grounded: "आपके दस्तावेज़ पर आधारित",
    languageLabel: "जवाब की भाषा",
    suggestedLabel: "एक सवाल आज़माएँ",
    placeholder: "अपनी पॉलिसी के बारे में आसान भाषा में सवाल पूछें",
    ask: "सवाल पूछें",
    checking: "जाँच हो रही है...",
    sources: "स्रोत",
    basis: {
      policy_states: "आपकी पॉलिसी में लिखा है",
      calculated_from_policy: "आपकी पॉलिसी से गणना की गई",
      requires_confirmation: "बीमाकर्ता से पुष्टि ज़रूरी है",
    },
    confidence: {
      high: "मज़बूत मिलान",
      medium: "अच्छा मिलान",
      low: "ध्यान से जाँचें",
    },
    suggestedQuestions: [
      "मेरी पॉलिसी में room rent की सीमा क्या है?",
      "क्या maternity covered है?",
      "कितना co-pay लागू होगा?",
    ],
    noMatch:
      "आपकी अपलोड की गई पॉलिसी में इस सवाल से जुड़ी जानकारी नहीं मिली। कृपया बीमाकर्ता से सीधे पुष्टि करें।",
    error: "इस सवाल का जवाब नहीं मिल सका",
  },
};

export function normalizePolicyAnswerLanguage(value: unknown): PolicyAnswerLanguage {
  return value === "hi" ? "hi" : "en";
}
