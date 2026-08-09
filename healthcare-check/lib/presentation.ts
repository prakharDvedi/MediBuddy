export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface text-text-primary border-border",
  info: "bg-info-bg text-info border-info/20",
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-warning-bg text-warning border-warning/25",
  danger: "bg-danger-bg text-danger border-danger/25",
};

export const TONE_ACCENTS: Record<Tone, string> = {
  neutral: "border-l-border-strong",
  info: "border-l-info",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
};

export function confidenceLabel(confidence: string) {
  if (confidence === "high") return "Verified match";
  if (confidence === "medium") return "Worth investigating";
  return "Needs confirmation";
}

export function confidenceTone(confidence: string): Tone {
  if (confidence === "high") return "success";
  if (confidence === "medium") return "warning";
  return "neutral";
}

export function findingTone(type: string, confidence = "medium"): Tone {
  if (type === "coverage_gap" || type === "unit_unverified" || type === "medicine_savings") return "warning";
  if (type === "unexplained") return "neutral";
  return confidenceTone(confidence);
}

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Reading document",
  extracted: "Pages read",
  structured: "Ready to review",
  error: "Needs attention",
};

export function documentStatusLabel(status: string) {
  return DOCUMENT_STATUS_LABELS[status] ?? status;
}

export function documentStatusTone(status: string): Tone {
  if (status === "error") return "danger";
  if (status === "structured") return "success";
  if (status === "processing" || status === "extracted") return "info";
  return "neutral";
}

export function coverageTone(value: boolean | null): Tone {
  if (value === true) return "success";
  if (value === false) return "danger";
  return "warning";
}
