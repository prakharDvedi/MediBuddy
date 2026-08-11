import type { Locale } from "./types.ts";

export const FINDING_TYPES = [
  "price",
  "quantity",
  "duplicate",
  "package_overlap",
  "unexplained",
  "medicine_savings",
  "unit_unverified",
  "coverage_gap",
] as const;

export type FindingType = (typeof FINDING_TYPES)[number];
export type FindingSeverity = "high" | "medium" | "low";

export type FindingCopy = {
  typeLabels: Record<FindingType, string>;
  severityLabels: Record<FindingSeverity, string>;
  audienceLabels: { hospital: string; insurer: string };
  questionsFor: { hospital: string; insurer: string };
  coverageTitles: {
    roomRentLimit: string;
    icuLimit: string;
    copay: string;
    deductible: string;
    consumables: string;
    subLimits: string;
    waitingPeriods: string;
  };
  questions: Record<FindingType, string>;
  explanations: Record<FindingType, string>;
  evidence: {
    hospitalCharge: string;
    nppaReference: string;
    availableReference: string;
    potentialDifference: string;
    basedOn: string;
    source: string;
    medicine: {
      hospitalCharge: string;
      effective: string;
      retrieved: string;
      viewSource: string;
      unitCouldNotBeVerified: string;
      potentialSavings: string;
      potentialPriceDifference: string;
      estimateDisclaimer: string;
    };
  };
  checklist: {
    takeWithYou: string;
    questionsToAskNext: string;
    summary: string;
    neutralDisclaimer: string;
    generalReview: string;
  };
};

export const FINDING_COPY: Record<Locale, FindingCopy> = {
  en: {
    typeLabels: {
      price: "Price worth checking",
      quantity: "Quantity worth checking",
      duplicate: "Possible duplicate",
      package_overlap: "Package overlap",
      unexplained: "Charge to clarify",
      medicine_savings: "Medicine price",
      unit_unverified: "Unit needs confirmation",
      coverage_gap: "Policy limitation",
    },
    severityLabels: {
      high: "Verified match",
      medium: "Worth investigating",
      low: "Needs confirmation",
    },
    audienceLabels: { hospital: "Ask the hospital", insurer: "Ask the insurer" },
    questionsFor: { hospital: "Questions for the hospital", insurer: "Questions for the insurer" },
    coverageTitles: {
      roomRentLimit: "Room rent is capped at {amount} per day",
      icuLimit: "ICU charges are capped at {amount} per day",
      copay: "Co-payment of {amount}% applies",
      deductible: "Deductible of {amount} applies",
      consumables: "Consumables are not covered",
      subLimits: "{count} category sub-limit(s) apply",
      waitingPeriods: "{count} waiting period(s) apply",
    },
    questions: {
      price: "Could you clarify the rate and billing context used for this service?",
      quantity: "Could you explain the quantity billed for this item and how it was determined?",
      duplicate: "Could you confirm whether this charge appears more than once intentionally?",
      package_overlap: "Could you confirm whether this charge is already included in the package?",
      unexplained: "Could you provide an itemized breakdown of this charge?",
      medicine_savings: "Could you confirm the billed medicine unit or pack size and explain how its price was calculated?",
      unit_unverified: "Could you confirm the sale unit or pack context used for this line item?",
      coverage_gap: "Could you confirm how this policy term applies to this claim and point me to the relevant clause?",
    },
    explanations: {
      price: "Billed at {hospitalPrice} per verified unit; the available reference is {referencePrice} ({source}). The billed amount is higher than the available reference, so it is worth checking with the hospital; this is not by itself proof of an overcharge.",
      quantity: "The billed quantity is {quantity}, which is higher than the configured review threshold. We do not have an authoritative standard quantity to verify this against, so ask the hospital why this quantity was needed.",
      duplicate: "{item} appears {count} times{pages}. This is worth confirming so the same charge was not billed more than once.",
      package_overlap: "{packageItem} is billed as a package, and {componentItem} is billed separately on the same document. Confirm whether the component is already included; this is not automatically a duplicate.",
      unexplained: "This charge is not itemized clearly enough to verify from the document. Ask the hospital for a line-by-line breakdown.",
      medicine_savings: "The hospital charge is {hospitalPrice}; the available {source} reference is {referencePrice}. The potential difference is {potentialDifference}. This is a comparison signal, not a guarantee that the billed price is unlawful.",
      unit_unverified: "The billed unit or pack context could not be verified against the available reference. Ask the hospital or pharmacist to confirm the unit before comparing prices.",
      coverage_gap: "This policy term may affect how much of the claim is payable. Confirm how it applies to this claim with the insurer.",
    },
    evidence: {
      hospitalCharge: "Hospital charge",
      nppaReference: "NPPA reference",
      availableReference: "Available reference",
      potentialDifference: "Potential difference",
      basedOn: "Based on",
      source: "Source",
      medicine: {
        hospitalCharge: "Hospital charge",
        effective: "Effective",
        retrieved: "Retrieved",
        viewSource: "View source",
        unitCouldNotBeVerified: "Unit could not be verified",
        potentialSavings: "Potential savings to investigate",
        potentialPriceDifference: "Potential price difference",
        estimateDisclaimer: "Estimated from the available reference price. This does not guarantee that this amount is recoverable or that the hospital charge is unlawful.",
      },
    },
    checklist: {
      takeWithYou: "Take this with you",
      questionsToAskNext: "Questions to ask next",
      summary: "A final checklist based on the observations above.",
      neutralDisclaimer: "These are neutral questions based on what MedBud found. They are not conclusions about wrongdoing.",
      generalReview: "General review",
    },
  },
  hi: {
    typeLabels: {
      price: "कीमत जाँचने योग्य है",
      quantity: "मात्रा जाँचने योग्य है",
      duplicate: "संभावित डुप्लिकेट",
      package_overlap: "पैकेज में शामिल हो सकता है",
      unexplained: "चार्ज स्पष्ट करें",
      medicine_savings: "दवा की कीमत",
      unit_unverified: "यूनिट की पुष्टि ज़रूरी है",
      coverage_gap: "पॉलिसी की सीमा",
    },
    severityLabels: {
      high: "मिलान की पुष्टि है",
      medium: "जाँचने योग्य",
      low: "पुष्टि ज़रूरी है",
    },
    audienceLabels: { hospital: "अस्पताल से पूछें", insurer: "इंश्योरर से पूछें" },
    questionsFor: { hospital: "अस्पताल के लिए सवाल", insurer: "इंश्योरर के लिए सवाल" },
    coverageTitles: {
      roomRentLimit: "Room rent की सीमा {amount} प्रति दिन है",
      icuLimit: "ICU charges की सीमा {amount} प्रति दिन है",
      copay: "{amount}% co-payment लागू है",
      deductible: "{amount} का deductible लागू है",
      consumables: "Consumables covered नहीं हैं",
      subLimits: "{count} category sub-limit लागू हैं",
      waitingPeriods: "{count} waiting period लागू हैं",
    },
    questions: {
      price: "क्या आप इस सेवा की दर और बिल में इसका आधार स्पष्ट कर सकते हैं?",
      quantity: "क्या आप बता सकते हैं कि इस आइटम की इतनी मात्रा क्यों बिल की गई?",
      duplicate: "क्या आप पुष्टि कर सकते हैं कि यह चार्ज एक से अधिक बार जानबूझकर दिखाया गया है?",
      package_overlap: "क्या यह चार्ज पैकेज में पहले से शामिल है, कृपया इसकी पुष्टि करें।",
      unexplained: "क्या आप इस चार्ज का itemized विवरण दे सकते हैं?",
      medicine_savings: "क्या आप बिल की गई दवा की यूनिट या पैक साइज और उसकी कीमत की गणना स्पष्ट कर सकते हैं?",
      unit_unverified: "क्या आप इस लाइन आइटम में इस्तेमाल हुई बिक्री यूनिट या पैक का संदर्भ स्पष्ट कर सकते हैं?",
      coverage_gap: "क्या आप बता सकते हैं कि यह पॉलिसी शर्त मेरे क्लेम पर कैसे लागू होती है और संबंधित clause दिखा सकते हैं?",
    },
    explanations: {
      price: "सत्यापित यूनिट के लिए बिल की गई कीमत {hospitalPrice} है; उपलब्ध reference कीमत {referencePrice} ({source}) है। बिल की कीमत उपलब्ध reference से अधिक है, इसलिए इसे अस्पताल से जाँचें; यह अपने आप में overcharge का प्रमाण नहीं है।",
      quantity: "बिल की गई मात्रा {quantity} है, जो review threshold से अधिक है। इसकी तुलना करने के लिए हमारे पास कोई authoritative standard quantity नहीं है, इसलिए अस्पताल से पूछें कि यह मात्रा क्यों ज़रूरी थी।",
      duplicate: "{item} {count} बार दिखता है{pages}। पुष्टि कर लें कि एक ही चार्ज एक से अधिक बार बिल नहीं हुआ है।",
      package_overlap: "{packageItem} पैकेज के रूप में बिल किया गया है और {componentItem} उसी दस्तावेज़ में अलग से बिल है। पुष्टि करें कि component पहले से पैकेज में शामिल तो नहीं है; इसे अपने आप duplicate नहीं माना जा सकता।",
      unexplained: "दस्तावेज़ में यह चार्ज इतना स्पष्ट itemized नहीं है कि इसकी जाँच की जा सके। अस्पताल से line-by-line विवरण माँगें।",
      medicine_savings: "अस्पताल का चार्ज {hospitalPrice} है; उपलब्ध {source} reference {referencePrice} है। संभावित अंतर {potentialDifference} है। यह तुलना के लिए संकेत है, यह इस बात की गारंटी नहीं है कि बिल की कीमत गैरकानूनी है।",
      unit_unverified: "उपलब्ध reference के साथ बिल की यूनिट या पैक का संदर्भ सत्यापित नहीं हो सका। कीमत की तुलना से पहले अस्पताल या pharmacist से यूनिट की पुष्टि करें।",
      coverage_gap: "यह पॉलिसी शर्त क्लेम में मिलने वाली राशि को प्रभावित कर सकती है। इंश्योरर से पुष्टि करें कि यह आपके क्लेम पर कैसे लागू होती है।",
    },
    evidence: {
      hospitalCharge: "अस्पताल का चार्ज",
      nppaReference: "NPPA reference",
      availableReference: "उपलब्ध reference",
      potentialDifference: "संभावित अंतर",
      basedOn: "आधार",
      source: "स्रोत",
      medicine: {
        hospitalCharge: "अस्पताल का चार्ज",
        effective: "प्रभावी",
        retrieved: "प्राप्त किया गया",
        viewSource: "स्रोत देखें",
        unitCouldNotBeVerified: "यूनिट की पुष्टि नहीं हो सकी",
        potentialSavings: "जाँचने योग्य संभावित बचत",
        potentialPriceDifference: "संभावित कीमत का अंतर",
        estimateDisclaimer: "यह उपलब्ध reference कीमत से अनुमान है। यह गारंटी नहीं है कि यह राशि वापस मिलेगी या अस्पताल का चार्ज गैरकानूनी है।",
      },
    },
    checklist: {
      takeWithYou: "इसे साथ ले जाएँ",
      questionsToAskNext: "आगे पूछने वाले सवाल",
      summary: "ऊपर मिली observations के आधार पर अंतिम checklist।",
      neutralDisclaimer: "ये MedBud को मिली जानकारी के आधार पर neutral सवाल हैं। ये किसी गलत काम का निष्कर्ष नहीं हैं।",
      generalReview: "सामान्य समीक्षा",
    },
  },
};

export function fillFindingTemplate(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
}

export function isFindingType(value: string): value is FindingType {
  return (FINDING_TYPES as readonly string[]).includes(value);
}
