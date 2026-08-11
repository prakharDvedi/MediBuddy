import { normalizeLocale, SUPPORTED_LOCALES, type Locale } from "../i18n/types.ts";

export const POLICY_ANSWER_LANGUAGES = SUPPORTED_LOCALES;

export type PolicyAnswerLanguage = Locale;

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

export type PolicyOtherTermKind = "room_rent_restriction" | "consumables_exclusion";

export type PolicyWhyLineKind = "sub_limit" | "deductible" | "copay";

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
  coverage: {
    eyebrow: string;
    title: string;
    fromPolicy: string;
    notClearlyStated: string;
    confirmWithInsurer: string;
    sumInsured: string;
    roomRentLimit: string;
    icuLimit: string;
    coPayment: string;
    deductible: string;
    consumables: string;
    covered: string;
    notCovered: string;
    categorySubLimits: string;
    waitingPeriods: string;
    importantExclusions: string;
    perDay: string;
    percentOfSumInsured: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    description: string;
    compare: string;
    calculating: string;
    recalculate: string;
    error: string;
    policyContext: string;
    otherTermsTitle: string;
    shownSeparately: string;
    otherTerms: Record<PolicyOtherTermKind, { label: string; description: string }>;
    separateTermsNote: string;
    estimatedInsurerPayment: string;
    estimatedPatientResponsibility: string;
    estimateNote: string;
    confirmAmount: string;
    howEstimateChanges: string;
    startingFrom: string;
    policyBasedEstimate: string;
    whyLineLabels: Record<PolicyWhyLineKind, string>;
    whyLineReasons: Record<PolicyWhyLineKind, string>;
  };
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
    coverage: {
      eyebrow: "Policy facts",
      title: "Coverage summary",
      fromPolicy: "From your policy",
      notClearlyStated: "Not clearly stated",
      confirmWithInsurer: "Confirm with your insurer.",
      sumInsured: "Sum insured",
      roomRentLimit: "Room-rent limit",
      icuLimit: "ICU limit",
      coPayment: "Co-payment",
      deductible: "Deductible",
      consumables: "Consumables",
      covered: "Covered",
      notCovered: "Not covered",
      categorySubLimits: "Category sub-limits",
      waitingPeriods: "Waiting periods",
      importantExclusions: "Important exclusions",
      perDay: " / day",
      percentOfSumInsured: "% of sum insured",
    },
    comparison: {
      eyebrow: "Bill + policy",
      title: "What might insurance pay?",
      description: "An estimate based on the bill and the limits found in your policy.",
      compare: "Compare now",
      calculating: "Calculating...",
      recalculate: "Recalculate",
      error: "Comparison failed",
      policyContext: "Policy context",
      otherTermsTitle: "Other policy terms that may affect the claim",
      shownSeparately: "Shown separately",
      otherTerms: {
        room_rent_restriction: {
          label: "Room-rent restriction",
          description: "The policy limits room rent to {amount} per day. This estimate shows the term separately and does not apply a proportional room-choice deduction.",
        },
        consumables_exclusion: {
          label: "Consumables exclusion",
          description: "Consumables are not covered under this policy. This estimate shows the term separately and does not subtract the exclusion from the numeric result.",
        },
      },
      separateTermsNote: "The estimate calculates the policy sub-limit, deductible, and co-payment rules. These terms are shown separately so the estimate is not mistaken for a final claim decision.",
      estimatedInsurerPayment: "Estimated insurer payment",
      estimatedPatientResponsibility: "Estimated patient responsibility",
      estimateNote: "This is an estimate, not a final claim decision.",
      confirmAmount: "Confirm the final amount with your insurer and hospital.",
      howEstimateChanges: "How the estimate changes",
      startingFrom: "Starting from {amount}",
      policyBasedEstimate: "Policy-based estimate",
      whyLineLabels: { sub_limit: "Sub-limit", deductible: "Deductible", copay: "Co-payment" },
      whyLineReasons: {
        sub_limit: "The policy sub-limit for {category} is {cap}; the billed amount of {billed} exceeds it, and the excess is not payable by the insurer.",
        deductible: "The policy's deductible of {deductible} applies per claim and is paid out of pocket before the policy pays.",
        copay: "The policy requires a {percent}% co-payment on the admissible amount after the deductible.",
      },
    },
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
    coverage: {
      eyebrow: "पॉलिसी की जानकारी",
      title: "कवरेज का सारांश",
      fromPolicy: "आपकी पॉलिसी से",
      notClearlyStated: "साफ़ तौर पर नहीं लिखा है",
      confirmWithInsurer: "अपने बीमाकर्ता से पुष्टि करें।",
      sumInsured: "बीमित राशि",
      roomRentLimit: "रूम-रेंट की सीमा",
      icuLimit: "ICU की सीमा",
      coPayment: "को-पेमेंट",
      deductible: "डिडक्टिबल",
      consumables: "कंज़्यूमेबल्स",
      covered: "कवर है",
      notCovered: "कवर नहीं है",
      categorySubLimits: "श्रेणी की सब-लिमिट",
      waitingPeriods: "वेटिंग पीरियड",
      importantExclusions: "ज़रूरी exclusions",
      perDay: " / दिन",
      percentOfSumInsured: "% बीमित राशि का",
    },
    comparison: {
      eyebrow: "बिल + पॉलिसी",
      title: "बीमा कितना दे सकता है?",
      description: "बिल और आपकी पॉलिसी में मिली सीमाओं के आधार पर अनुमान।",
      compare: "तुलना करें",
      calculating: "गणना हो रही है...",
      recalculate: "फिर से गणना करें",
      error: "तुलना नहीं हो सकी",
      policyContext: "पॉलिसी का संदर्भ",
      otherTermsTitle: "पॉलिसी की अन्य शर्तें जो claim को प्रभावित कर सकती हैं",
      shownSeparately: "अलग से दिखाई गई",
      otherTerms: {
        room_rent_restriction: {
          label: "रूम-रेंट की पाबंदी",
          description: "पॉलिसी रूम रेंट को प्रति दिन {amount} तक सीमित करती है। यह शर्त अलग से दिखाई गई है और कमरे की पसंद के लिए proportional deduction लागू नहीं की गई है।",
        },
        consumables_exclusion: {
          label: "कंज़्यूमेबल्स का exclusion",
          description: "इस पॉलिसी में कंज़्यूमेबल्स कवर नहीं हैं। यह शर्त अलग से दिखाई गई है और numeric result से exclusion नहीं घटाया गया है।",
        },
      },
      separateTermsNote: "नीचे का अनुमान policy sub-limit, deductible और co-payment rules की गणना करता है। इन शर्तों को अलग दिखाया गया है ताकि इसे final claim decision न समझा जाए।",
      estimatedInsurerPayment: "बीमाकर्ता का अनुमानित भुगतान",
      estimatedPatientResponsibility: "मरीज़ की अनुमानित ज़िम्मेदारी",
      estimateNote: "यह अनुमान है, final claim decision नहीं।",
      confirmAmount: "अंतिम राशि अपने बीमाकर्ता और अस्पताल से पक्की करें।",
      howEstimateChanges: "अनुमान कैसे बदलता है",
      startingFrom: "शुरुआत {amount} से",
      policyBasedEstimate: "पॉलिसी पर आधारित अनुमान",
      whyLineLabels: { sub_limit: "सब-लिमिट", deductible: "डिडक्टिबल", copay: "को-पेमेंट" },
      whyLineReasons: {
        sub_limit: "{category} की policy sub-limit {cap} है; billed amount {billed} इससे ज़्यादा है और excess बीमाकर्ता नहीं देगा।",
        deductible: "पॉलिसी का {deductible} deductible हर claim पर लागू होता है और policy के भुगतान से पहले अपनी जेब से देना होता है।",
        copay: "डिडक्टिबल के बाद admissible amount पर {percent}% co-payment लागू है।",
      },
    },
  },
};

export function normalizePolicyAnswerLanguage(value: unknown): PolicyAnswerLanguage {
  return normalizeLocale(value);
}
