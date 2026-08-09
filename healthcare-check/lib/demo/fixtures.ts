import type { ExtractedMedicineIdentity } from "@/lib/medicines/types";

export type DemoQuestionSeed = {
  findingType: string;
  question: string;
};

export type DemoItemFixture = {
  item_type: "medicine" | "procedure" | "test" | "consumable" | "charge" | "service" | "misc";
  name: string;
  normalized_name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  source_page: number | null;
  raw_text: string;
  confidence: "high" | "medium" | "low";
  medicine_identity: ExtractedMedicineIdentity | null;
};

export type DemoDocumentFixture = {
  original_filename: string;
  doc_type: "bill" | "estimate" | "policy";
  pages: { page_number: number; content: string }[];
  items?: DemoItemFixture[];
};

export const DEMO_QUESTION_SEEDS: DemoQuestionSeed[] = [
  {
    findingType: "medicine_savings",
    question: "Could you confirm the billed medicine unit or pack size and explain how its price was calculated?",
  },
  {
    findingType: "price",
    question: "Could you clarify the rate and billing context used for this service?",
  },
  {
    findingType: "duplicate",
    question: "Could you confirm whether this charge appears more than once intentionally?",
  },
  {
    findingType: "unexplained",
    question: "Could you provide an itemized breakdown of this miscellaneous charge?",
  },
  {
    findingType: "coverage_gap",
    question: "Could you confirm how this policy term applies to this claim and point me to the relevant clause?",
  },
];

const ceftriaxoneIdentity: ExtractedMedicineIdentity = {
  brand_name: null,
  components: [
    {
      ingredient_name: "Ceftriaxone",
      strength_value: 1000,
      strength_unit: "mg",
      denominator_value: null,
      denominator_unit: null,
    },
  ],
  dosage_form: "powder for injection",
  route: "injectable",
  pack_text: "1 vial",
  pack_quantity: 1,
  pack_unit: "vial",
};

const paracetamolPackIdentity: ExtractedMedicineIdentity = {
  brand_name: null,
  components: [
    {
      ingredient_name: "Paracetamol",
      strength_value: 500,
      strength_unit: "mg",
      denominator_value: null,
      denominator_unit: null,
    },
  ],
  dosage_form: "tablet",
  route: "oral",
  pack_text: "strip of 10 tablets",
  pack_quantity: 10,
  pack_unit: "tablet",
};

export const DEMO_BILL_FIXTURE: {
  title: string;
  references: {
    nppa: { normalizedIdentity: string; saleUnit: string };
    pmbi: { normalizedIdentity: string; saleUnit: string; packQuantity: number; packUnit: string };
    cghs: { normalizedName: string; rate: number; rateContext: string };
  };
  documents: [DemoDocumentFixture];
} = {
  title: "Synthetic demo · Hospital bill",
  references: {
    // These values mirror the reviewed seed records. The creator validates
    // them against the deployed tables before creating the demo case.
    nppa: {
      normalizedIdentity: "ceftriaxone powder for injection 1000 mg",
      saleUnit: "each vial",
    },
    pmbi: {
      normalizedIdentity: "paracetamol tablet 500 mg",
      saleUnit: "pack",
      packQuantity: 10,
      packUnit: "tablet_or_capsule",
    },
    cghs: {
      normalizedName: "consultation opd",
      rate: 350,
      rateContext: "uniform",
    },
  },
  documents: [
    {
      original_filename: "synthetic-demo-hospital-bill.pdf",
      doc_type: "bill",
      pages: [
        {
          page_number: 1,
          content:
            "Synthetic demo document — not a real hospital bill. SUNRISE SAMPLE HOSPITAL. Itemized inpatient bill. Bill reference SYN-BILL-001. All names, charges, and values on this document are fictional and controlled for demonstration.",
        },
        {
          page_number: 2,
          content:
            "Synthetic demo document — not a real hospital bill. Pharmacy and medicines. Ceftriaxone powder for injection 1000 mg | Qty 1 | Unit vial | Unit price ₹480.00 | Amount ₹480.00. Paracetamol Tablets IP 500 mg — strip of 10 tablets | Qty 1 | Unit strip | Unit price ₹80.00 | Amount ₹80.00.",
        },
        {
          page_number: 3,
          content:
            "Synthetic demo document — not a real hospital bill. Services and other charges. Consultation OPD | Qty 1 | Unit consultation | Unit price ₹500.00 | Amount ₹500.00. Miscellaneous charges | Qty 1 | Unit charge | Unit price ₹1,200.00 | Amount ₹1,200.00. Miscellaneous charges | Qty 1 | Unit charge | Unit price ₹1,200.00 | Amount ₹1,200.00. Note: the repeated miscellaneous line is intentionally unclear and duplicated for audit demonstration.",
        },
      ],
      items: [
        {
          item_type: "medicine",
          name: "Ceftriaxone powder for injection 1000 mg — 1 vial",
          normalized_name: "ceftriaxone powder for injection 1000 mg",
          quantity: 1,
          unit_price: 480,
          total_price: 480,
          source_page: 2,
          raw_text: "Ceftriaxone powder for injection 1000 mg | Qty 1 | Unit vial | Unit price ₹480.00 | Amount ₹480.00",
          confidence: "high",
          medicine_identity: ceftriaxoneIdentity,
        },
        {
          item_type: "medicine",
          name: "Paracetamol Tablets IP 500 mg — strip of 10 tablets",
          normalized_name: "paracetamol tablet 500 mg",
          quantity: 1,
          unit_price: 80,
          total_price: 80,
          source_page: 2,
          raw_text: "Paracetamol Tablets IP 500 mg — strip of 10 tablets | Qty 1 | Unit strip | Unit price ₹80.00 | Amount ₹80.00",
          confidence: "high",
          medicine_identity: paracetamolPackIdentity,
        },
        {
          item_type: "procedure",
          name: "Consultation OPD",
          normalized_name: "consultation opd",
          quantity: 1,
          unit_price: 500,
          total_price: 500,
          source_page: 3,
          raw_text: "Consultation OPD | Qty 1 | Unit consultation | Unit price ₹500.00 | Amount ₹500.00",
          confidence: "high",
          medicine_identity: null,
        },
        {
          item_type: "charge",
          name: "Miscellaneous charges",
          normalized_name: "miscellaneous charges",
          quantity: 1,
          unit_price: 1200,
          total_price: 1200,
          source_page: 3,
          raw_text: "Miscellaneous charges | Qty 1 | Unit charge | Unit price ₹1,200.00 | Amount ₹1,200.00",
          confidence: "medium",
          medicine_identity: null,
        },
        {
          item_type: "charge",
          name: "Miscellaneous charges",
          normalized_name: "miscellaneous charges",
          quantity: 1,
          unit_price: 1200,
          total_price: 1200,
          source_page: 3,
          raw_text: "Miscellaneous charges | Qty 1 | Unit charge | Unit price ₹1,200.00 | Amount ₹1,200.00",
          confidence: "medium",
          medicine_identity: null,
        },
      ],
    },
  ],
};

const DEMO_POLICY_PROVENANCE = {
  sum_insured: { values: [{ value: 1000000, page: 1, section: "Section 1", chunk_index: 0 }], status: "confirmed" },
  room_rent_limit: { values: [{ value: 7500, page: 2, section: "Section 2", chunk_index: 1 }], status: "confirmed" },
  icu_limit: { values: [{ value: 20000, page: 2, section: "Section 2", chunk_index: 1 }], status: "confirmed" },
  copay_percent: { values: [{ value: 10, page: 3, section: "Section 3", chunk_index: 2 }], status: "confirmed" },
  deductible: { values: [{ value: 10000, page: 3, section: "Section 3", chunk_index: 2 }], status: "confirmed" },
  waiting_periods: { values: [{ value: { condition: "Cataract surgery", duration: "24 months" }, page: 4, section: "Section 4", chunk_index: 3 }], status: "confirmed" },
  sub_limits: { values: [{ value: { category: "Cataract surgery", limit_amount: 40000, limit_percent: null }, page: 4, section: "Section 4", chunk_index: 3 }], status: "confirmed" },
  exclusions: { values: [{ value: "Consumables", page: 4, section: "Section 4", chunk_index: 3 }], status: "confirmed" },
  consumables_covered: { values: [{ value: false, page: 4, section: "Section 4", chunk_index: 3 }], status: "confirmed" },
};

export const DEMO_INSURANCE_FIXTURE = {
  title: "Synthetic demo · Insurance claim comparison",
  documents: [
    {
      original_filename: "synthetic-demo-insurance-estimate.pdf",
      doc_type: "estimate" as const,
      pages: [
        {
          page_number: 1,
          content:
            "Synthetic demo document — not a real hospital estimate. HARBORLINE SAMPLE EYE CENTRE. Treatment estimate for a fictional right-eye cataract procedure. All names, charges, and values are fictional and controlled for demonstration.",
        },
        {
          page_number: 2,
          content:
            "Synthetic demo document — not a real hospital estimate. Estimate breakdown. Cataract surgery package — right eye | Qty 1 | Unit rate ₹62,000 | Amount ₹62,000. Foldable monofocal IOL lens | Qty 1 | Unit rate ₹18,000 | Amount ₹18,000. Pre-operative investigations | Qty 1 | Unit rate ₹3,500 | Amount ₹3,500. Room and nursing charges | Qty 1 day | Unit rate ₹8,000 | Amount ₹8,000. Pharmacy and surgical consumables | Qty 1 | Unit rate ₹8,500 | Amount ₹8,500. Estimated gross total ₹1,00,000.",
        },
      ],
      items: [
        {
          item_type: "procedure" as const,
          name: "Cataract surgery package — right eye",
          normalized_name: "cataract surgery package right eye",
          quantity: 1,
          unit_price: 62000,
          total_price: 62000,
          source_page: 2,
          raw_text: "Cataract surgery package — right eye | Qty 1 | Unit rate ₹62,000 | Amount ₹62,000",
          confidence: "high" as const,
          medicine_identity: null,
        },
        {
          item_type: "procedure" as const,
          name: "Foldable monofocal IOL lens",
          normalized_name: "foldable monofocal iol lens",
          quantity: 1,
          unit_price: 18000,
          total_price: 18000,
          source_page: 2,
          raw_text: "Foldable monofocal IOL lens | Qty 1 | Unit rate ₹18,000 | Amount ₹18,000",
          confidence: "high" as const,
          medicine_identity: null,
        },
        {
          item_type: "test" as const,
          name: "Pre-operative investigations",
          normalized_name: "pre operative investigations",
          quantity: 1,
          unit_price: 3500,
          total_price: 3500,
          source_page: 2,
          raw_text: "Pre-operative investigations | Qty 1 | Unit rate ₹3,500 | Amount ₹3,500",
          confidence: "high" as const,
          medicine_identity: null,
        },
        {
          item_type: "charge" as const,
          name: "Room and nursing charges",
          normalized_name: "room and nursing charges",
          quantity: 1,
          unit_price: 8000,
          total_price: 8000,
          source_page: 2,
          raw_text: "Room and nursing charges | Qty 1 day | Unit rate ₹8,000 | Amount ₹8,000",
          confidence: "high" as const,
          medicine_identity: null,
        },
        {
          item_type: "consumable" as const,
          name: "Pharmacy and surgical consumables",
          normalized_name: "pharmacy and surgical consumables",
          quantity: 1,
          unit_price: 8500,
          total_price: 8500,
          source_page: 2,
          raw_text: "Pharmacy and surgical consumables | Qty 1 | Unit rate ₹8,500 | Amount ₹8,500",
          confidence: "high" as const,
          medicine_identity: null,
        },
      ],
    },
    {
      original_filename: "synthetic-demo-insurance-policy.pdf",
      doc_type: "policy" as const,
      pages: [
        {
          page_number: 1,
          content:
            "Synthetic demo document — not a real insurance policy. HARBORLINE SAMPLE HEALTH ASSURANCE. Section 1: Policy at a glance. Sum insured is ₹10,00,000 for the policy year.",
        },
        {
          page_number: 2,
          content:
            "Synthetic demo document — not a real insurance policy. Section 2: Hospitalization benefits. Room-rent limit is ₹7,500 per day for a single private room. ICU limit is ₹20,000 per day. Choosing a room above the eligible category may trigger proportionate deductions.",
        },
        {
          page_number: 3,
          content:
            "Synthetic demo document — not a real insurance policy. Section 3: Cost sharing. Co-payment of 10% applies to the admissible claim amount. A deductible of ₹10,000 applies once per claim before the policy pays.",
        },
        {
          page_number: 4,
          content:
            "Synthetic demo document — not a real insurance policy. Section 4: Limits, exclusions, and waiting periods. Cataract surgery is limited to ₹40,000 per eye. Cataract surgery has a waiting period of 24 months. Consumables are excluded and are not covered under this policy.",
        },
      ],
    },
  ],
  policy: {
    sum_insured: 1000000,
    room_rent_limit: 7500,
    icu_limit: 20000,
    copay_percent: 10,
    deductible: 10000,
    waiting_periods: [{ condition: "Cataract surgery", duration: "24 months" }],
    sub_limits: [{ category: "Cataract surgery", limit_amount: 40000, limit_percent: null }],
    exclusions: ["Consumables"],
    consumables_covered: false,
    other_conditions: ["Room above the eligible category may trigger proportionate deductions."],
  },
  policyProvenance: DEMO_POLICY_PROVENANCE,
};
