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
  "service",
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
  medicine_identity: {
    brand_name: string | null;
    components: {
      ingredient_name: string;
      strength_value: number | null;
      strength_unit: string | null;
      denominator_value: number | null;
      denominator_unit: string | null;
    }[];
    dosage_form: string | null;
    route: string | null;
    pack_text: string | null;
    pack_quantity: number | null;
    pack_unit: string | null;
  } | null;
};

export type ClassifyAndExtractResult = {
  docType: (typeof DOC_TYPES)[number];
  items: ExtractedItem[];
  suggestedTitle: string;
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    doc_type: { type: "string", enum: DOC_TYPES },
    suggested_title: { type: "string" },
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
          medicine_identity: {
            anyOf: [
              { type: "null" },
              {
                type: "object",
                properties: {
                  brand_name: { type: ["string", "null"] },
                  components: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ingredient_name: { type: "string" },
                        strength_value: { type: ["number", "null"] },
                        strength_unit: { type: ["string", "null"] },
                        denominator_value: { type: ["number", "null"] },
                        denominator_unit: { type: ["string", "null"] },
                      },
                      required: [
                        "ingredient_name",
                        "strength_value",
                        "strength_unit",
                        "denominator_value",
                        "denominator_unit",
                      ],
                      additionalProperties: false,
                    },
                  },
                  dosage_form: { type: ["string", "null"] },
                  route: { type: ["string", "null"] },
                  pack_text: { type: ["string", "null"] },
                  pack_quantity: { type: ["number", "null"] },
                  pack_unit: { type: ["string", "null"] },
                },
                required: [
                  "brand_name",
                  "components",
                  "dosage_form",
                  "route",
                  "pack_text",
                  "pack_quantity",
                  "pack_unit",
                ],
                additionalProperties: false,
              },
            ],
          },
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
          "medicine_identity",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["doc_type", "suggested_title", "items"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You classify a healthcare document and extract its billable line items.

doc_type: classify as one of estimate, bill, prescription, quotation, policy, approval, or unknown.
If it's an insurance policy or approval letter (no per-item pricing table), classify accordingly and return an empty items array — item extraction only applies to hospital/pharmacy documents with priced line items.

suggested_title: a short, human-readable title for this case, combining the hospital/clinic/pharmacy
name as written on the document with the document type, e.g. "City Care Hospital — Estimate" or
"Apollo Pharmacy — Bill". If no organization name is stated anywhere in the text, fall back to a
generic label like "Hospital Estimate" or "Hospital Bill" — never invent an organization name.
Keep it under 60 characters.

items: for hospital-side documents (estimate, bill, prescription, quotation), extract every distinct billable line: medicines, procedures, tests, consumables, services, or other charges. Use item_type "service" for a priced service that is not a procedure, test, medicine, consumable, or general charge.
- name: as written on the document.
- normalized_name: lowercase, strip punctuation, keep strength/dosage/unit if present (e.g. "paracetamol 500mg tablet"), so it can be matched against a reference price list later.
- medicine_identity: for medicine items only, extract the identity fields needed for safe matching. Keep the active ingredient or salt and every combination component exactly as stated. Normalize strength to a number plus unit (for example 1000 and "mg" rather than 1 and "g") when the conversion is explicit. Keep dosage_form and route separate. Preserve pack_text, pack_quantity, and pack_unit only when the bill states them. Use denominator_value and denominator_unit only for concentration strength such as "5 mg per 5 ml"; never use them for a pack count or sale unit such as tablets, capsules, vials, strips, or packs. For non-medicine items, return null.
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
    items: (parsed.items ?? []).map((item: ExtractedItem) => ({
      ...item,
      medicine_identity: item.medicine_identity ?? null,
    })),
    suggestedTitle: parsed.suggested_title || "Untitled case",
  };
}
