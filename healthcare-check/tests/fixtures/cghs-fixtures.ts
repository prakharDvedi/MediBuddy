import type { CghsSourceRow } from "../../lib/reference/cghs.ts";
import type { SourceMetadata } from "../../lib/reference/ingestion.ts";

export const cghsMetadata: SourceMetadata = {
  sourceKind: "cghs",
  sourceName: "CGHS Rate List 2025",
  sourceUrl: "https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf",
  retrievedAt: "2026-08-10T00:00:00.000Z",
  effectiveDate: "2025-10-13",
};

type CghsBaseRateRow = {
  page: number;
  code: string;
  description: string;
  non: number;
  nabh: number;
  super: number;
  category: string;
};

const baseRows: CghsBaseRateRow[] = [
  {
    "page": 7,
    "code": "CN001",
    "description": "Consultation OPD",
    "non": 350,
    "nabh": 350,
    "super": 350,
    "category": "Consultation"
  },
  {
    "page": 7,
    "code": "CN002",
    "description": "Consultation for Inpatients",
    "non": 350,
    "nabh": 350,
    "super": 350,
    "category": "Consultation"
  },
  {
    "page": 7,
    "code": "CN003",
    "description": "Consultation OPD - Super speciality/Psychiatry",
    "non": 700,
    "nabh": 700,
    "super": 700,
    "category": "Consultation"
  },
  {
    "page": 7,
    "code": "LB001",
    "description": "Urine Routine- pH, Specific Gravity, Sugar, Protein and Microscopy",
    "non": 85,
    "nabh": 100,
    "super": 100,
    "category": "Laboratory Investigation"
  },
  {
    "page": 7,
    "code": "LB002",
    "description": "Urine Microalbumin",
    "non": 207,
    "nabh": 243,
    "super": 243,
    "category": "Laboratory Investigation"
  },
  {
    "page": 7,
    "code": "LB003",
    "description": "Stool Routine and Microscopy",
    "non": 68,
    "nabh": 80,
    "super": 80,
    "category": "Laboratory Investigation"
  },
  {
    "page": 20,
    "code": "RI001",
    "description": "2D echocardiography",
    "non": 1254,
    "nabh": 1475,
    "super": 1475,
    "category": "Radiological Investigation"
  },
  {
    "page": 20,
    "code": "RI002",
    "description": "Fetal Echo",
    "non": 1360,
    "nabh": 1600,
    "super": 1600,
    "category": "Radiological Investigation"
  },
  {
    "page": 20,
    "code": "RI003",
    "description": "2D Transoesophageal Echocardiography (TEE)",
    "non": 1403,
    "nabh": 1650,
    "super": 1650,
    "category": "Radiological Investigation"
  },
  {
    "page": 25,
    "code": "PI001",
    "description": "Pulmonary Function Test (PFT) / (Spirometry with Diffusing Capacity of the Lungs for Carbon monoxide (DLCO)",
    "non": 425,
    "nabh": 500,
    "super": 500,
    "category": "Pulmonology Investigation"
  },
  {
    "page": 26,
    "code": "PI002",
    "description": "Lung Ventilation & Perfusion Scan (V/Q Scan)",
    "non": 5100,
    "nabh": 6000,
    "super": 6000,
    "category": "Pulmonology Investigation"
  },
  {
    "page": 26,
    "code": "PI003",
    "description": "Lung Perfusion Scan",
    "non": 4250,
    "nabh": 5000,
    "super": 5000,
    "category": "Pulmonology Investigation"
  },
  {
    "page": 26,
    "code": "NM001",
    "description": "Whole Body Bone Scan with SPECT.",
    "non": 4250,
    "nabh": 5000,
    "super": 5000,
    "category": "Nuclear Medicine Investigation"
  },
  {
    "page": 26,
    "code": "NM002",
    "description": "Three phase whole body Bone Scan",
    "non": 5100,
    "nabh": 6000,
    "super": 6000,
    "category": "Nuclear Medicine Investigation"
  },
  {
    "page": 26,
    "code": "NM003",
    "description": "Brain Perfusion SPECT Scan with Technetium 99m radiopharmaceuticals.",
    "non": 11390,
    "nabh": 13400,
    "super": 13400,
    "category": "Nuclear Medicine Investigation"
  },
  {
    "page": 27,
    "code": "BY001",
    "description": "Skin Biopsy",
    "non": 1063,
    "nabh": 1250,
    "super": 1250,
    "category": "Biopsies"
  },
  {
    "page": 27,
    "code": "BY002",
    "description": "Punch/Wedge biopsy",
    "non": 2550,
    "nabh": 3000,
    "super": 3000,
    "category": "Biopsies"
  },
  {
    "page": 27,
    "code": "BY003",
    "description": "Excision Biopsy of Ulcers",
    "non": 4250,
    "nabh": 5000,
    "super": 5000,
    "category": "Biopsies"
  },
  {
    "page": 28,
    "code": "CA001",
    "description": "A, B, DR Molecular Typing PCR - SSP",
    "non": 8768,
    "nabh": 10315,
    "super": 10315,
    "category": "Oncology Investigations"
  },
  {
    "page": 28,
    "code": "CA002",
    "description": "ABL Kinase Domain Mutation for Chronic Myeloid leukemia (TKI Resistance, Imatinib Resistance",
    "non": 6885,
    "nabh": 8100,
    "super": 8100,
    "category": "Oncology Investigations"
  },
  {
    "page": 28,
    "code": "CA003",
    "description": "ABL Kinase Domain Mutation for Ph Positive Acute Lymphoblastic leukemia (TKI Resistance, I",
    "non": 6885,
    "nabh": 8100,
    "super": 8100,
    "category": "Oncology Investigations"
  },
  {
    "page": 35,
    "code": "CT001",
    "description": "Single drug Chemotherapy",
    "non": 1445,
    "nabh": 1700,
    "super": 1700,
    "category": "Chemotherapy"
  },
  {
    "page": 35,
    "code": "CT002",
    "description": "Multiple drugs Chemotherapy/Targeted therapy/Immunotherapy",
    "non": 1955,
    "nabh": 2300,
    "super": 2300,
    "category": "Chemotherapy"
  },
  {
    "page": 35,
    "code": "CT003",
    "description": "Neoadjuvant Chemotherapy",
    "non": 2295,
    "nabh": 2700,
    "super": 2700,
    "category": "Chemotherapy"
  },
  {
    "page": 35,
    "code": "RT001",
    "description": "Level 1- Brachytherapy (Eye Plaque or SIVA or CVS per insertion or application)",
    "non": 5950,
    "nabh": 7000,
    "super": 8050,
    "category": "Radiotherapy"
  },
  {
    "page": 35,
    "code": "RT002",
    "description": "Level 2- Brachytherapy (Simple ICA with Xray based 2D planning, ILRT, Endobilliary BCT)",
    "non": 8500,
    "nabh": 10000,
    "super": 11500,
    "category": "Radiotherapy"
  },
  {
    "page": 36,
    "code": "RT003",
    "description": "Level 3- Brachytherapy (Surface Mould, Radical Interstitial BCT, Intraoperative Template or interstitial brachytherapy catheter insertion)",
    "non": 21250,
    "nabh": 25000,
    "super": 28750,
    "category": "Radiotherapy"
  },
  {
    "page": 37,
    "code": "PT001",
    "description": "Cervical Traction (per session)",
    "non": 255,
    "nabh": 300,
    "super": 300,
    "category": "Physiotherapy"
  },
  {
    "page": 37,
    "code": "PT002",
    "description": "Lumbar Traction (per session)",
    "non": 255,
    "nabh": 300,
    "super": 300,
    "category": "Physiotherapy"
  },
  {
    "page": 37,
    "code": "PT003",
    "description": "Exercises /Post Natal Exercises/Prenatal Exercises/Therapeutic Exercises/Orthopaedic Rehabilitation (Joint Replacement/Post Surgery)/Hand Rehab (per session)",
    "non": 255,
    "nabh": 300,
    "super": 300,
    "category": "Physiotherapy"
  },
  {
    "page": 38,
    "code": "DP001",
    "description": "Abscess - Drainage-Dental",
    "non": 1275,
    "nabh": 1500,
    "super": 1500,
    "category": "Dental Procedure"
  },
  {
    "page": 38,
    "code": "DP002",
    "description": "Scaling",
    "non": 850,
    "nabh": 1000,
    "super": 1000,
    "category": "Dental Procedure"
  },
  {
    "page": 38,
    "code": "DP003",
    "description": "Curettage and Root Planning - Per Tooth",
    "non": 298,
    "nabh": 350,
    "super": 350,
    "category": "Dental Procedure"
  },
  {
    "page": 45,
    "code": "OP001",
    "description": "Subconjunctival/sub-tenon-s injections in one eye",
    "non": 425,
    "nabh": 500,
    "super": 500,
    "category": "Ophthalmology Procedure"
  },
  {
    "page": 45,
    "code": "OP002",
    "description": "Subconjunctival/sub-tenon-s injections in both eyes",
    "non": 680,
    "nabh": 800,
    "super": 800,
    "category": "Ophthalmology Procedure"
  },
  {
    "page": 45,
    "code": "OP003",
    "description": "Pterygium surgery with auto conjunctival graft per eye",
    "non": 11390,
    "nabh": 13400,
    "super": 13400,
    "category": "Ophthalmology Procedure"
  },
  {
    "page": 52,
    "code": "EP001",
    "description": "Removal of foreign body From Nose",
    "non": 595,
    "nabh": 700,
    "super": 700,
    "category": "ENT Procedure"
  },
  {
    "page": 52,
    "code": "EP002",
    "description": "Removal of foreign body From Ear/otoscopy diagnostic or therapeutic",
    "non": 595,
    "nabh": 700,
    "super": 700,
    "category": "ENT Procedure"
  },
  {
    "page": 52,
    "code": "EP003",
    "description": "Syringing (Ear)",
    "non": 425,
    "nabh": 500,
    "super": 500,
    "category": "ENT Procedure"
  },
  {
    "page": 56,
    "code": "CC001",
    "description": "ICU/CCU/PICU/MICU/HDU (For all categories of ward entitlement, inclusive of Room Rent)",
    "non": 5400,
    "nabh": 5400,
    "super": 5400,
    "category": "Critical Care"
  },
  {
    "page": 56,
    "code": "CC002",
    "description": "Compressed Air / Piped Oxygen per hour",
    "non": 85,
    "nabh": 100,
    "super": 100,
    "category": "Critical Care"
  },
  {
    "page": 56,
    "code": "CC003",
    "description": "Ventilator charges (Per day) inclusive of associated disposables",
    "non": 2550,
    "nabh": 3000,
    "super": 3000,
    "category": "Critical Care"
  },
  {
    "page": 56,
    "code": "GP001",
    "description": "Dressings of wounds",
    "non": 255,
    "nabh": 300,
    "super": 300,
    "category": "General Procedure"
  },
  {
    "page": 57,
    "code": "GP002",
    "description": "Aspiration Pleural Effusion - Diagnostic",
    "non": 595,
    "nabh": 700,
    "super": 700,
    "category": "General Procedure"
  },
  {
    "page": 57,
    "code": "GP003",
    "description": "Aspiration Pleural Effusion - Therapeutic",
    "non": 595,
    "nabh": 700,
    "super": 700,
    "category": "General Procedure"
  },
  {
    "page": 58,
    "code": "CP001",
    "description": "Balloon Coronary Angioplasty / Percutaneous transluminal coronary angioplasty (PTCA) /Percutaneous coronary intervention (PCI) with Vascular closure device (VCD) excluding the cost of Stent. Cost of Drug Eluting Balloon allowed in lieu of Stent",
    "non": 82450,
    "nabh": 97000,
    "super": 111550,
    "category": "Cardiology Procedure"
  },
  {
    "page": 58,
    "code": "CP002",
    "description": "Balloon Coronary Angioplasty / Percutaneous transluminal coronary angioplasty (PTCA) / Percutaneous coronary intervention (PCI) without Vascular closure device (VCD) excluding the cost of Stent.Cost of Drug Eluting Balloon allowed in lieu of Stent",
    "non": 71166,
    "nabh": 83725,
    "super": 96284,
    "category": "Cardiology Procedure"
  },
  {
    "page": 58,
    "code": "CP003",
    "description": "Rotablation excluding the cost of Rotablator Burr/Advancer",
    "non": 52553,
    "nabh": 61827,
    "super": 71101,
    "category": "Cardiology Procedure"
  },
  {
    "page": 105,
    "code": "BP001",
    "description": "Injection of Keloids - Ganglion",
    "non": 3400,
    "nabh": 4000,
    "super": 4000,
    "category": "Burns And Plastic Surgery Procedure"
  },
  {
    "page": 107,
    "code": "BP027",
    "description": "Plastic Surgery of the Nose - Minor",
    "non": 23375,
    "nabh": 27500,
    "super": 31625,
    "category": "Burns And Plastic Surgery Procedure"
  },
  {
    "page": 108,
    "code": "BP040",
    "description": "VAC Therapy/Dressing including all Consumables",
    "non": 8500,
    "nabh": 10000,
    "super": 10000,
    "category": "Burns And Plastic Surgery Procedure"
  }
];

const contexts = [
  ["semi_private_tier_i_non_nabh", "non"],
  ["semi_private_tier_i_nabh", "nabh"],
  ["semi_private_tier_i_super_speciality", "super"],
] as const;

function expandRow(row: CghsBaseRateRow): CghsSourceRow[] {
  const rates = [row.non, row.nabh, row.super];
  const variants = rates[0] === rates[1] && rates[1] === rates[2]
    ? [["uniform", rates[0]] as const]
    : contexts.map(([context, rateKey]) => [context, row[rateKey]] as const);

  return variants.map(([rateContext, rate]) => ({
    sourceRecordId: `${row.code}:${rateContext}`,
    code: row.code,
    recordKind: row.code === "BP040" ? "package" : "procedure",
    category: row.category,
    description: row.description,
    rate,
    rateUnit: row.category === "Consultation" ? "per consultation" : "per listed service/package",
    rateContext,
    inclusionNotes: row.code === "BP040" ? "Source description states including all Consumables." : null,
    applicabilityConditions: "Tier I (X city); rates for semi-private ward entitlement; context identifies HCO accreditation/speciality column.",
    sourcePage: row.page,
    sourceSection: "Annexure I - Tier I (X City), Semi-Private Ward",
  }));
}

export const cghsSlice: CghsSourceRow[] = baseRows.flatMap(expandRow);

