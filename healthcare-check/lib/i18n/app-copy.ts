import type { CaseIntent } from "../cases/intents.ts";
import type { WorkflowKey } from "../dashboard/data";
import type { Locale } from "./types";

type IntentCopy = {
  eyebrow: string;
  title: string;
  cardDescription: string;
  onboardingTitle: string;
  onboardingDescription: string;
  uploadGuidance: string;
};

export type AppCopy = {
  shell: {
    tagline: string;
    login: string;
    signup: string;
    logout: string;
    backToDashboard: string;
    newCheck: string;
    caseReview: string;
    language: string;
    renameCase: string;
    saveTitleError: string;
  };
  home: {
    headline: string;
    description: string;
    primaryAction: string;
    disclaimer: string;
    exampleReview: string;
    exampleTitle: string;
    worthInvestigating: string;
    totalEstimate: string;
    potentialDifference: string;
    medicinePrice: string;
    hospitalCharge: string;
    nppaReference: string;
    page: string;
    referenceDisclaimer: string;
    startWithQuestion: string;
    reviewDepends: string;
    originalDocuments: string;
    referenceDisclaimerLong: string;
    intents: Record<CaseIntent, IntentCopy>;
  };
  dashboard: {
    headline: string;
    description: string;
    startNewCheck: string;
    chooseStartingPoint: string;
    startHere: string;
    guidedDemos: string;
    seeInAction: string;
    demoDisclaimer: string;
    tryBill: string;
    tryBillDescription: string;
    tryPolicy: string;
    tryPolicyDescription: string;
    preparingDemo: string;
    creatingCase: string;
    createCase: string;
    demoError: string;
    yourWork: string;
    recentChecks: string;
    saved: string;
    noChecks: string;
    noChecksDescription: string;
    workflowLabels: Record<WorkflowKey, string>;
    statusLabels: { attention: string; processing: string; findings: string; finding: string; ready: string };
    actionLabels: { continue: string; view: string };
    opening?: string;
    potentialDifference: string;
  };
  auth: {
    welcomeBack: string;
    login: string;
    loginDescription: string;
    email: string;
    password: string;
    loggingIn: string;
    noAccount: string;
    signup: string;
    calmerWay: string;
    signupDescription: string;
    signingUp: string;
    alreadyHaveAccount: string;
    checkEmail: string;
    confirmationDescription: string;
    requestingLink: string;
    tryAgainIn: string;
    resendConfirmation: string;
    loginInstead: string;
    confirmationRequested: string;
    authError: string;
    unspecifiedError: string;
  };
  newCase: {
    step: string;
    nameCheck: string;
    optional: string;
    placeholder: string;
    privateDocument: string;
    createError: string;
  };
  upload: {
    documentTypes: Record<string, string>;
    standardStages: string[];
    policyStages: string[];
    invalidFile: string;
    prepareUpload: string;
    readDocument: string;
    preparePolicy: string;
    understandDocument: string;
    uploadPrompt: string;
    fileTypes: string;
    chooseFile: string;
    documentType: string;
    preparingReview: string;
    attention: string;
    ready: string;
    inProgress: string;
    policySummary: string;
    coverageDetails: string;
    lineItems: string;
    uploadFailed: string;
  };
  document: {
    statusLabels: Record<string, string>;
    syntheticPolicy: string;
    syntheticEstimate: string;
    syntheticBill: string;
    typeNotConfirmed: string;
    pages: string;
    loadingDetails: string;
    hideDetails: string;
    viewDetails: string;
    extractedItems: string;
    extractedText: string;
    loading: string;
    noItems: string;
    noPages: string;
    noExtractableText: string;
    item: string;
    type: string;
    quantity: string;
    unit: string;
    total: string;
    page: string;
    match: string;
  };
  caseReview: {
    caseReview: string;
    documents: string;
    addReviewDocuments: string;
    documentsDescription: string;
    atAGlance: string;
    documentsShow: string;
    insurance: string;
    policySays: string;
    policyDescription: string;
    findings: string;
    finding: string;
    findingPlural?: string;
    questions: string;
    questionPlural?: string;
    noFindings: string;
    noFindingsDescription: string;
    reviewGuide: string;
    guide: string[];
    status: { ready: string; attention: string; progress: string };
  };
  summary: {
    totalBill: string;
    thingsWorthChecking: string;
    nothingFlagged: string;
    verified: string;
    needClarification: string;
    potentialSavings: string;
    estimateDisclaimer: string;
    whatNext: string;
    reviewEach: string;
    evidenceClose: string;
  };
  review: {
    stages: string[];
    eyebrow: string;
    title: string;
    description: string;
    reviewCharges: string;
    reviewing: string;
    needsAttention: string;
    ready: string;
    inProgress: string;
    reviewReady: string;
    preparing: string;
    auditError: string;
    questionError: string;
  };
};

const EN_INTENTS: Record<CaseIntent, IntentCopy> = {
  bill: {
    eyebrow: "Hospital costs",
    title: "Check a hospital bill or estimate",
    cardDescription: "Find charges and medicine prices worth checking. See what to ask.",
    onboardingTitle: "Upload your hospital bill or estimate",
    onboardingDescription: "We'll extract the charges, compare available reference prices, and highlight things worth checking.",
    uploadGuidance: "Start with a hospital bill or estimate. You can add another document later.",
  },
  policy: {
    eyebrow: "Policy clarity",
    title: "Understand my insurance policy",
    cardDescription: "See coverage limits and exclusions. Ask questions in plain language.",
    onboardingTitle: "Upload your insurance policy",
    onboardingDescription: "We'll summarize coverage limits and help you ask clear questions about what is covered.",
    uploadGuidance: "Start with your insurance policy. We will extract its coverage details for you.",
  },
  compare: {
    eyebrow: "Planning ahead",
    title: "Check what insurance may pay",
    cardDescription: "Estimate what insurance may pay and what you may need to pay.",
    onboardingTitle: "Start with your hospital bill or estimate",
    onboardingDescription: "Add your insurance policy next to estimate what insurance may pay and what you may pay.",
    uploadGuidance: "Start with a hospital bill or estimate. You can add your insurance policy on the next screen.",
  },
};

const HI_INTENTS: Record<CaseIntent, IntentCopy> = {
  bill: {
    eyebrow: "अस्पताल का खर्च",
    title: "अस्पताल का बिल या अनुमान जाँचें",
    cardDescription: "जाँचने योग्य शुल्क और दवाओं की कीमतें देखें। जानें क्या पूछना है।",
    onboardingTitle: "अस्पताल का बिल या अनुमान अपलोड करें",
    onboardingDescription: "हम शुल्क निकालेंगे, उपलब्ध संदर्भ कीमतों से तुलना करेंगे और जाँचने योग्य बातें दिखाएँगे।",
    uploadGuidance: "अस्पताल के बिल या अनुमान से शुरू करें। बाद में एक और दस्तावेज़ जोड़ सकते हैं।",
  },
  policy: {
    eyebrow: "पॉलिसी की स्पष्टता",
    title: "अपनी बीमा पॉलिसी समझें",
    cardDescription: "कवरेज सीमाएँ और अपवर्जन देखें। आसान भाषा में सवाल पूछें।",
    onboardingTitle: "अपनी बीमा पॉलिसी अपलोड करें",
    onboardingDescription: "हम कवरेज सीमाओं का सारांश बनाएँगे और कवर की गई चीज़ों के बारे में स्पष्ट सवाल पूछने में मदद करेंगे।",
    uploadGuidance: "अपनी बीमा पॉलिसी से शुरू करें। हम इसकी कवरेज जानकारी निकालेंगे।",
  },
  compare: {
    eyebrow: "पहले से योजना",
    title: "जानें बीमा कितना भुगतान कर सकता है",
    cardDescription: "अनुमान लगाएँ कि बीमा कितना देगा और आपको कितना देना पड़ सकता है।",
    onboardingTitle: "अस्पताल के बिल या अनुमान से शुरू करें",
    onboardingDescription: "बीमा कितना दे सकता है और आपको कितना देना पड़ सकता है, इसका अनुमान लगाने के लिए पॉलिसी भी जोड़ें।",
    uploadGuidance: "अस्पताल के बिल या अनुमान से शुरू करें। अगली स्क्रीन पर बीमा पॉलिसी जोड़ सकते हैं।",
  },
};

export const APP_COPY: Record<Locale, AppCopy> = {
  en: {
    shell: { tagline: "Understand. Verify. Save.", login: "Log in", signup: "Sign up", logout: "Log out", backToDashboard: "Back to dashboard", newCheck: "New check", caseReview: "Case review", language: "Language", renameCase: "Click to rename", saveTitleError: "Could not save title" },
    home: {
      headline: "Understand the bill. Know what to ask next.",
      description: "Review hospital bills and insurance policies with reference-backed findings and plain-language explanations.",
      primaryAction: "Check a bill or policy",
      disclaimer: "MedBud helps you ask better questions. It does not diagnose, judge clinical care, or decide that a hospital has acted unlawfully.",
      exampleReview: "Example review", exampleTitle: "Surgery estimate", worthInvestigating: "Worth investigating", totalEstimate: "Total estimate", potentialDifference: "Potential difference", medicinePrice: "Medicine price", hospitalCharge: "Hospital charge", nppaReference: "NPPA reference", page: "Page", referenceDisclaimer: "A reference price is evidence to discuss, not a guarantee that money is recoverable.", startWithQuestion: "Start with a question", reviewDepends: "The right review depends on what you need to know.", originalDocuments: "MedBud keeps your original documents separate from extracted information and shows where important numbers came from.", referenceDisclaimerLong: "Reference prices are not hospital billing caps or guaranteed recoverable amounts. Always confirm with your hospital, pharmacist, or insurer.", intents: EN_INTENTS,
    },
    dashboard: {
      headline: "Understand your healthcare costs", description: "Review bills, check medicine and procedure references, and understand what your insurance may cover.", startNewCheck: "Start a new check", chooseStartingPoint: "Choose your starting point", startHere: "Start here", guidedDemos: "Guided demos", seeInAction: "See MedBud in action", demoDisclaimer: "These are controlled synthetic documents, created privately for your account, to demonstrate all capabilities. They are not real medical or insurance records.", tryBill: "Try a sample hospital bill", tryBillDescription: "See medicine references, a CGHS comparison, and duplicate-charge checks with cited source pages.", tryPolicy: "Try a sample insurance case", tryPolicyDescription: "Explore policy retrieval, coverage findings, questions, and an estimate-versus-policy comparison.", preparingDemo: "Preparing your demo...", creatingCase: "Creating a fresh case", createCase: "Create a fresh case →", demoError: "Could not create the demo case", yourWork: "Your work", recentChecks: "Recent checks", saved: "saved", noChecks: "No checks yet", noChecksDescription: "Start by uploading a hospital bill or insurance policy. Your work will appear here.", workflowLabels: { billAndPolicy: "Bill + insurance policy", insurancePolicy: "Insurance policy", hospitalBill: "Hospital bill", hospitalEstimate: "Hospital estimate", procedureQuote: "Procedure quote", prescription: "Prescription", insuranceApproval: "Insurance approval", healthcareDocument: "Healthcare document", noDocument: "No document yet" }, statusLabels: { attention: "Needs attention", processing: "Processing", findings: "{count} things worth checking", finding: "{count} thing worth checking", ready: "Ready to review" }, actionLabels: { continue: "Continue", view: "View" }, opening: "Opening…", potentialDifference: "Potential difference",
    },
    auth: { welcomeBack: "Welcome back", login: "Log in", loginDescription: "Return to your saved bills, policy summaries, and questions.", email: "Email", password: "Password", loggingIn: "Logging in...", noAccount: "No account?", signup: "Sign up", calmerWay: "A calmer way to review", signupDescription: "Create a private workspace for your hospital bills and insurance questions.", signingUp: "Signing up...", alreadyHaveAccount: "Already have an account?", checkEmail: "Check your email", confirmationDescription: "If this address can receive mail, you'll receive a confirmation link at {email}. Check your spam folder too. If you already have an account, log in instead.", requestingLink: "Requesting link...", tryAgainIn: "Try again in {seconds}s", resendConfirmation: "Resend confirmation email", loginInstead: "Log in instead", confirmationRequested: "If this address can receive mail, a new confirmation link was requested.", authError: "Authentication error", unspecifiedError: "An unspecified error occurred." },
    newCase: { step: "Step 1 of 2 · Add a document", nameCheck: "Name this check", optional: "optional", placeholder: "e.g. Sunrise Hospital estimate", privateDocument: "Your original document stays private. MedBud shows source pages alongside important findings so you can verify the details yourself.", createError: "Could not create this check" },
    upload: { documentTypes: { unknown: "Not sure", estimate: "Hospital estimate", bill: "Hospital bill", prescription: "Prescription", quotation: "Procedure quotation", policy: "Insurance policy", approval: "Insurance approval" }, standardStages: ["Uploading document", "Reading pages", "Understanding details"], policyStages: ["Uploading document", "Reading pages", "Understanding policy", "Preparing summary"], invalidFile: "Please choose a PDF, JPG, or PNG file.", prepareUpload: "Could not prepare upload", readDocument: "Could not read this document", preparePolicy: "Could not prepare the policy summary", understandDocument: "Could not understand this document", uploadPrompt: "Drop a document here or choose a file", fileTypes: "PDF, JPG, or PNG · Your original stays private", chooseFile: "Choose a file", documentType: "Document type", preparingReview: "Preparing your review", attention: "Needs attention", ready: "Ready", inProgress: "In progress", policySummary: "Read {pages} page(s) and prepared {chunks} policy section(s).", coverageDetails: "Read {pages} page(s) and prepared the coverage details.", lineItems: "Read {pages} page(s) and found {items} line item(s).", uploadFailed: "Upload failed" },
    document: { statusLabels: { uploaded: "Uploaded", processing: "Reading document", extracted: "Pages read", structured: "Ready to review", error: "Needs attention" }, syntheticPolicy: "Synthetic demo document — not a real insurance policy", syntheticEstimate: "Synthetic demo document — not a real hospital estimate", syntheticBill: "Synthetic demo document — not a real hospital bill", typeNotConfirmed: "Document type not confirmed", pages: "{count} page(s)", loadingDetails: "Loading extracted details…", hideDetails: "Hide extracted details", viewDetails: "View extracted details", extractedItems: "Line items", extractedText: "Extracted text", loading: "Loading extracted details...", noItems: "No line items extracted yet.", noPages: "No pages extracted yet.", noExtractableText: "No extractable text on this page.", item: "Item", type: "Type", quantity: "Qty", unit: "Unit", total: "Total", page: "Page", match: "Match" },
    caseReview: { caseReview: "Case review", documents: "Documents", addReviewDocuments: "Add or review your documents", documentsDescription: "Upload a bill, estimate, policy, or supporting page. MedBud keeps the source close to the result.", atAGlance: "At a glance", documentsShow: "What the documents show", insurance: "Insurance", policySays: "What your policy says", policyDescription: "Important limits and conditions are shown with the language of your policy in mind.", findings: "Findings", finding: "finding", questions: "question", noFindings: "No findings yet", noFindingsDescription: "Upload a hospital document, then review charges to prepare the evidence-backed findings.", reviewGuide: "Review guide", guide: ["Add the document that matters most.", "Start with the summary and amounts.", "Open evidence for anything unclear.", "Take the suggested question with you."], status: { ready: "Ready to review", attention: "Needs attention", progress: "In progress" } },
    summary: { totalBill: "Total bill or estimate", thingsWorthChecking: "{count} things worth checking", nothingFlagged: "Nothing flagged yet", verified: "{count} verified", needClarification: "{count} need clarification", potentialSavings: "Potential savings to investigate", estimateDisclaimer: "Estimated from the available reference price. This does not guarantee that the amount is recoverable or that the hospital charge is unlawful.", whatNext: "What happens next", reviewEach: "Review each finding with its source page.", evidenceClose: "MedBud keeps the interpretation close to the evidence so you can decide what to ask." },
    review: { stages: ["Checking", "Preparing questions"], eyebrow: "Your review", title: "Things worth checking", description: "These are observations to clarify, not accusations. Open the evidence before deciding what to ask.", reviewCharges: "Review charges", reviewing: "Reviewing...", needsAttention: "Review needs attention", ready: "Ready", inProgress: "In progress", reviewReady: "Review ready", preparing: "Preparing your review", auditError: "Audit failed", questionError: "Question generation failed" },
  },
  hi: {
    shell: { tagline: "समझें। सत्यापित करें। बचत करें।", login: "लॉग इन", signup: "साइन अप", logout: "लॉग आउट", backToDashboard: "डैशबोर्ड पर वापस जाएँ", newCheck: "नई जाँच", caseReview: "केस समीक्षा", language: "भाषा", renameCase: "नाम बदलने के लिए क्लिक करें", saveTitleError: "नाम save नहीं हो सका" },
    home: { headline: "बिल समझें। अगला सवाल जानें।", description: "संदर्भ-आधारित निष्कर्षों और आसान भाषा में समझाई गई जानकारी के साथ अस्पताल के बिलों और बीमा पॉलिसियों की समीक्षा करें।", primaryAction: "बिल या पॉलिसी जाँचें", disclaimer: "MedBud आपको बेहतर सवाल पूछने में मदद करता है। यह निदान नहीं करता, चिकित्सा देखभाल का मूल्यांकन नहीं करता और यह तय नहीं करता कि अस्पताल ने कानून तोड़ा है।", exampleReview: "उदाहरण समीक्षा", exampleTitle: "सर्जरी का अनुमान", worthInvestigating: "जाँचने योग्य", totalEstimate: "कुल अनुमान", potentialDifference: "संभावित अंतर", medicinePrice: "दवा की कीमत", hospitalCharge: "अस्पताल का शुल्क", nppaReference: "NPPA संदर्भ", page: "पृष्ठ", referenceDisclaimer: "संदर्भ कीमत चर्चा के लिए प्रमाण है; इससे पैसे वापस मिलने की गारंटी नहीं है।", startWithQuestion: "एक सवाल से शुरू करें", reviewDepends: "सही समीक्षा इस बात पर निर्भर करती है कि आपको क्या जानना है।", originalDocuments: "MedBud आपके मूल दस्तावेज़ों को निकाली गई जानकारी से अलग रखता है और महत्वपूर्ण संख्याओं के स्रोत दिखाता है।", referenceDisclaimerLong: "संदर्भ कीमतें अस्पताल की बिलिंग सीमा या वापस मिलने वाली गारंटीकृत रकम नहीं हैं। अपने अस्पताल, फार्मासिस्ट या बीमा कंपनी से हमेशा पुष्टि करें।", intents: HI_INTENTS },
    dashboard: { headline: "अपने स्वास्थ्य खर्च समझें", description: "बिलों की समीक्षा करें, दवाओं और प्रक्रियाओं की संदर्भ जानकारी जाँचें और समझें कि आपका बीमा क्या कवर कर सकता है।", startNewCheck: "नई जाँच शुरू करें", chooseStartingPoint: "शुरुआत चुनें", startHere: "यहाँ से शुरू करें", guidedDemos: "निर्देशित डेमो", seeInAction: "MedBud को काम करते देखें", demoDisclaimer: "ये नियंत्रित कृत्रिम दस्तावेज़ हैं, जो आपके खाते के लिए निजी रूप से बनाए गए हैं। ये असली चिकित्सा या बीमा रिकॉर्ड नहीं हैं।", tryBill: "नमूना अस्पताल का बिल आज़माएँ", tryBillDescription: "दवाओं के संदर्भ, CGHS तुलना और स्रोत पृष्ठों के उद्धरणों के साथ डुप्लिकेट शुल्क की जाँच देखें।", tryPolicy: "नमूना बीमा केस आज़माएँ", tryPolicyDescription: "पॉलिसी खोज, कवरेज निष्कर्ष, सवाल और अनुमान-बनाम-पॉलिसी तुलना देखें।", preparingDemo: "आपका डेमो तैयार हो रहा है...", creatingCase: "नई केस बनाई जा रही है", createCase: "नई केस बनाएँ →", demoError: "डेमो केस नहीं बन सकी", yourWork: "आपका काम", recentChecks: "हाल की जाँच", saved: "सहेजे गए", noChecks: "अभी कोई जाँच नहीं", noChecksDescription: "अस्पताल का बिल या बीमा पॉलिसी अपलोड करके शुरू करें। आपका काम यहाँ दिखेगा।", workflowLabels: { billAndPolicy: "बिल और बीमा पॉलिसी", insurancePolicy: "बीमा पॉलिसी", hospitalBill: "अस्पताल का बिल", hospitalEstimate: "अस्पताल का अनुमान", procedureQuote: "प्रक्रिया का कोटेशन", prescription: "दवा का नुस्खा", insuranceApproval: "बीमा स्वीकृति", healthcareDocument: "स्वास्थ्य दस्तावेज़", noDocument: "अभी कोई दस्तावेज़ नहीं" }, statusLabels: { attention: "ध्यान देने की ज़रूरत", processing: "प्रक्रिया जारी है", findings: "{count} जाँचने योग्य बातें", finding: "{count} जाँचने योग्य बात", ready: "समीक्षा के लिए तैयार" }, actionLabels: { continue: "जारी रखें", view: "देखें" }, potentialDifference: "संभावित अंतर" },
    auth: { welcomeBack: "वापसी पर स्वागत है", login: "लॉग इन", loginDescription: "अपने saved bills, policy summaries और questions पर वापस जाएँ।", email: "Email", password: "Password", loggingIn: "लॉग इन हो रहा है...", noAccount: "Account नहीं है?", signup: "साइन अप", calmerWay: "Review करने का आसान तरीका", signupDescription: "अपने hospital bills और insurance questions के लिए private workspace बनाएँ।", signingUp: "साइन अप हो रहा है...", alreadyHaveAccount: "पहले से account है?", checkEmail: "अपना email देखें", confirmationDescription: "अगर यह address mail प्राप्त कर सकता है, तो {email} पर confirmation link आएगा। Spam folder भी देखें। Account पहले से है तो लॉग इन करें।", requestingLink: "Link माँगा जा रहा है...", tryAgainIn: "{seconds}s में फिर कोशिश करें", resendConfirmation: "Confirmation email फिर भेजें", loginInstead: "इसके बजाय लॉग इन करें", confirmationRequested: "अगर यह address mail प्राप्त कर सकता है, तो नया confirmation link माँगा गया है।", authError: "Authentication error", unspecifiedError: "एक अज्ञात error हुआ।" },
    newCase: { step: "Step 1 of 2 · Document जोड़ें", nameCheck: "इस जाँच का नाम", optional: "वैकल्पिक", placeholder: "जैसे Sunrise Hospital estimate", privateDocument: "आपका original document private रहता है। MedBud important findings के साथ source pages दिखाता है ताकि आप details खुद verify कर सकें।", createError: "यह जाँच नहीं बन सकी" },
    upload: { documentTypes: { unknown: "पता नहीं", estimate: "Hospital estimate", bill: "Hospital bill", prescription: "Prescription", quotation: "Procedure quotation", policy: "Insurance policy", approval: "Insurance approval" }, standardStages: ["Document upload हो रहा है", "Pages पढ़े जा रहे हैं", "Details समझी जा रही हैं"], policyStages: ["Document upload हो रहा है", "Pages पढ़े जा रहे हैं", "Policy समझी जा रही है", "Summary तैयार हो रहा है"], invalidFile: "कृपया PDF, JPG या PNG file चुनें।", prepareUpload: "Upload तैयार नहीं हो सका", readDocument: "Document पढ़ा नहीं जा सका", preparePolicy: "Policy summary तैयार नहीं हो सकी", understandDocument: "Document समझा नहीं जा सका", uploadPrompt: "Document यहाँ छोड़ें या file चुनें", fileTypes: "PDF, JPG या PNG · आपका original private रहता है", chooseFile: "File चुनें", documentType: "Document type", preparingReview: "आपका review तैयार हो रहा है", attention: "ध्यान देने की ज़रूरत", ready: "तैयार", inProgress: "जारी है", policySummary: "{pages} page पढ़े गए और {chunks} policy sections तैयार किए गए।", coverageDetails: "{pages} page पढ़े गए और coverage details तैयार की गईं।", lineItems: "{pages} page पढ़े गए और {items} line items मिले।", uploadFailed: "Upload असफल रहा" },
    document: { statusLabels: { uploaded: "Upload हुआ", processing: "Document पढ़ा जा रहा है", extracted: "Pages पढ़े गए", structured: "Review के लिए तैयार", error: "ध्यान देने की ज़रूरत" }, syntheticPolicy: "Synthetic demo document — असली insurance policy नहीं", syntheticEstimate: "Synthetic demo document — असली hospital estimate नहीं", syntheticBill: "Synthetic demo document — असली hospital bill नहीं", typeNotConfirmed: "Document type की पुष्टि नहीं", pages: "{count} page", loadingDetails: "Extracted details लोड हो रहे हैं…", hideDetails: "Extracted details छिपाएँ", viewDetails: "Extracted details देखें", extractedItems: "Line items", extractedText: "Extracted text", loading: "Extracted details लोड हो रहे हैं...", noItems: "अभी कोई line item नहीं मिला।", noPages: "अभी कोई page नहीं मिला।", noExtractableText: "इस page पर पढ़ने योग्य text नहीं है।", item: "Item", type: "Type", quantity: "Qty", unit: "Unit", total: "Total", page: "Page", match: "Match" },
    caseReview: { caseReview: "केस समीक्षा", documents: "Documents", addReviewDocuments: "अपने documents जोड़ें या देखें", documentsDescription: "Bill, estimate, policy या supporting page upload करें। MedBud source को result के पास रखता है।", atAGlance: "एक नज़र में", documentsShow: "Documents क्या दिखाते हैं", insurance: "Insurance", policySays: "आपकी policy क्या कहती है", policyDescription: "Important limits और conditions आपकी policy की भाषा को ध्यान में रखकर दिखाई गई हैं।", findings: "Findings", finding: "finding", questions: "question", noFindings: "अभी कोई finding नहीं", noFindingsDescription: "Hospital document upload करें, फिर evidence-backed findings तैयार करने के लिए charges review करें।", reviewGuide: "Review guide", guide: ["सबसे महत्वपूर्ण document जोड़ें।", "Summary और amounts से शुरू करें।", "जो स्पष्ट नहीं है उसका evidence खोलें।", "Suggested question साथ ले जाएँ।"], status: { ready: "Review के लिए तैयार", attention: "ध्यान देने की ज़रूरत", progress: "जारी है" } },
    summary: { totalBill: "कुल bill या estimate", thingsWorthChecking: "{count} जाँचने योग्य बातें", nothingFlagged: "कुछ flag नहीं हुआ", verified: "{count} verified", needClarification: "{count} clarification चाहिए", potentialSavings: "जाँचने योग्य संभावित बचत", estimateDisclaimer: "यह available reference price से अनुमान है। यह गारंटी नहीं कि रकम वापस मिलेगी या hospital charge गैरकानूनी है।", whatNext: "अब क्या होगा", reviewEach: "हर finding को उसके source page के साथ review करें।", evidenceClose: "MedBud interpretation को evidence के पास रखता है ताकि आप तय कर सकें कि क्या पूछना है।" },
    review: { stages: ["जाँच हो रही है", "Questions तैयार हो रहे हैं"], eyebrow: "आपका review", title: "जाँचने योग्य बातें", description: "ये clarification के लिए observations हैं, आरोप नहीं। क्या पूछना है तय करने से पहले evidence खोलें।", reviewCharges: "Charges review करें", reviewing: "Review हो रहा है...", needsAttention: "Review पर ध्यान चाहिए", ready: "तैयार", inProgress: "जारी है", reviewReady: "Review तैयार है", preparing: "आपका review तैयार हो रहा है", auditError: "Audit असफल रहा", questionError: "Questions तैयार नहीं हो सके" },
  },
};

export function fillAppTemplate(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));
}
