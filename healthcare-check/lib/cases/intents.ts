export type CaseIntent = "bill" | "policy" | "compare";

export type UploadDocumentType = "unknown" | "policy";

export type CaseIntentConfig = {
  title: string;
  cardDescription: string;
  onboardingTitle: string;
  onboardingDescription: string;
  uploadGuidance: string;
  initialDocumentType: UploadDocumentType;
};

export const CASE_INTENT_CONFIG: Record<CaseIntent, CaseIntentConfig> = {
  bill: {
    title: "Check a hospital bill or estimate",
    cardDescription: "Find charges and medicine prices worth checking. See what to ask.",
    onboardingTitle: "Upload your hospital bill or estimate",
    onboardingDescription:
      "We'll extract the charges, compare available reference prices, and highlight things worth checking.",
    uploadGuidance: "Start with a hospital bill or estimate. You can add another document later.",
    initialDocumentType: "unknown",
  },
  policy: {
    title: "Understand my insurance policy",
    cardDescription: "See coverage limits and exclusions. Ask questions in plain language.",
    onboardingTitle: "Upload your insurance policy",
    onboardingDescription:
      "We'll summarize coverage limits and help you ask clear questions about what is covered.",
    uploadGuidance: "Start with your insurance policy. We will extract its coverage details for you.",
    initialDocumentType: "policy",
  },
  compare: {
    title: "Check what insurance may pay",
    cardDescription: "Estimate what insurance may pay and what you may need to pay.",
    onboardingTitle: "Start with your hospital bill or estimate",
    onboardingDescription:
      "Add your insurance policy next to estimate what insurance may pay and what you may pay.",
    uploadGuidance: "Start with a hospital bill or estimate. You can add your insurance policy on the next screen.",
    initialDocumentType: "unknown",
  },
};

export function getCaseIntentHref(intent: CaseIntent) {
  return `/case/new?intent=${intent}`;
}

export function parseCaseIntent(value: string | string[] | undefined): CaseIntent {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "policy" || candidate === "compare" ? candidate : "bill";
}
