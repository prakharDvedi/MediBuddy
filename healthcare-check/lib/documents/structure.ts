const GROQ_STRUCTURE_MODEL = "openai/gpt-oss-20b";

export const DOC_TYPES = [
  "estimate",
  "bill",
  "prescription",
  "quotation",
  "policy",
  "approval",
  "unknown",
] as const;

export const ITEM_TYPES = [
  "medicine",
  "procedure",
  "test",
  "consumable",
  "charge",
  "misc",
] as const;

export type ExtractedItem = {
  item_type: (typeof ITEM_TYPES)[number];
  name: string;
  normalized_name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  source_page: number | null;
  raw_text: string;
  confidence: "high" | "medium" | "low";
};

export type ClassifyAndExtractResult = {
  docType: (typeof DOC_TYPES)[number];
  items: ExtractedItem[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    doc_type: { type: "string", enum: DOC_TYPES },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item_type: { type: "string", enum: ITEM_TYPES },
          name: { type: "string" },
          normalized_name: { type: "string" },
          quantity: { type: ["number", "null"] },
          unit_price: { type: ["number", "null"] },
          total_price: { type: ["number", "null"] },
          source_page: { type: ["integer", "null"] },
          raw_text: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "item_type",
          "name",
          "normalized_name",
          "quantity",
          "unit_price",
          "total_price",
          "source_page",
          "raw_text",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["doc_type", "items"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You classify a healthcare document and extract its billable line items.

doc_type: classify as one of estimate, bill, prescription, quotation, policy, approval, or unknown.
If it's an insurance policy or approval letter (no per-item pricing table), classify accordingly and return an empty items array — item extraction only applies to hospital/pharmacy documents with priced line items.

items: for hospital-side documents (estimate, bill, prescription, quotation), extract every distinct billable line: medicines, procedures, tests, consumables, or other charges.
- name: as written on the document.
- normalized_name: lowercase, strip punctuation, keep strength/dosage/unit if present (e.g. "paracetamol 500mg tablet"), so it can be matched against a reference price list later.
- quantity, unit_price, total_price: numbers only, no currency symbols. Use null if genuinely not stated — never guess a number that isn't on the document.
- source_page: the page number (as given in the "--- Page N ---" markers) the line appears on.
- raw_text: the original line/row text as it appears, for evidence.
- confidence: "high" if the line is unambiguous, "low" if the OCR/text looks garbled or the values are uncertain.

Never invent items that aren't in the text. If the document has no extractable items, return an empty array.`;

/**
 * Classifies a document's type and extracts structured billable line
 * items from its page text, in one call. Insurance documents are
 * classified but return no items — structured policy extraction is a
 * separate concern (see the insurance milestone).
 */
export async function classifyAndExtractItems(
  pages: { pageNumber: number; content: string }[],
): Promise<ClassifyAndExtractResult> {
  const documentText = pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.content}`)
    .join("\n\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_STRUCTURE_MODEL,
      temperature: 0,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: documentText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_classification",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq structure request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");

  return {
    docType: parsed.doc_type ?? "unknown",
    items: parsed.items ?? [],
  };
}
