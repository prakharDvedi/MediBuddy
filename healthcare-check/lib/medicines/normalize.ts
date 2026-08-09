import type {
  ExtractedMedicineIdentity,
  MedicineComponentIdentity,
  NormalizedMedicineComponent,
  NormalizedMedicineIdentity,
} from "./types";

const FORM_PATTERNS: Array<[RegExp, string]> = [
  [/\bpowder\s+for\s+injection\b/, "powder for injection"],
  [/\b(?:solution\s+for\s+)?injection\b|\binj\b/, "injection"],
  [/\btablets?\b|\btabs?\b/, "tablet"],
  [/\bcapsules?\b|\bcaps?\b/, "capsule"],
  [/\bsyrup\b/, "syrup"],
  [/\bsuspension\b/, "suspension"],
  [/\bsuppositor(?:y|ies)\b/, "suppository"],
  [/\bcream\b/, "cream"],
  [/\bointment\b/, "ointment"],
  [/\bgel\b/, "gel"],
  [/\beye\s+drops?\b/, "eye drops"],
];

const STRENGTH_PATTERN = /(\d+(?:\.\d+)?)\s*(mcg|μg|ug|mg|g|kg|ml|l)\b/gi;
const UNIT_TO_MG: Record<string, number> = { mcg: 0.001, "μg": 0.001, ug: 0.001, mg: 1, g: 1000, kg: 1_000_000 };
const CONCENTRATION_DENOMINATOR_UNITS = new Set(["mcg", "μg", "ug", "mg", "g", "kg", "ml", "l"]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[×*]/g, " x ")
    .replace(/\b(?:ip|usp|bp)\b/g, " ")
    .replace(/[^a-z0-9μ+/. -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase() === "μg" ? "mcg" : unit.toLowerCase();
  return normalized === "ug" ? "mcg" : normalized;
}

function normalizeStrength(value: number, unit: string): string {
  const normalizedUnit = normalizeUnit(unit);
  const multiplier = UNIT_TO_MG[normalizedUnit];
  if (multiplier) {
    const mg = value * multiplier;
    return `${Number.isInteger(mg) ? mg : Number(mg.toFixed(6))} mg`;
  }
  return `${Number.isInteger(value) ? value : Number(value.toFixed(6))} ${normalizedUnit}`;
}

function normalizedStrengths(text: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(STRENGTH_PATTERN.source, "gi");
  while ((match = pattern.exec(text)) !== null) {
    const value = Number(match[1]);
    const unit = normalizeUnit(match[2]);
    const nextText = text.slice(pattern.lastIndex).match(/^\s*(?:per|\/)\s*(\d+(?:\.\d+)?)\s*(mcg|μg|ug|mg|g|kg|ml|l)\b/i);
    matches.push(nextText ? `${normalizeStrength(value, unit)}/${normalizeStrength(Number(nextText[1]), nextText[2])}` : normalizeStrength(value, unit));
  }
  return matches;
}

export function normalizeDosageForm(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = normalizeText(value);
  for (const [pattern, form] of FORM_PATTERNS) {
    if (pattern.test(text)) return form;
  }
  return text || null;
}

function parseTextIdentity(text: string): {
  ingredients: string[];
  strengths: string[];
  dosage_form: string | null;
} {
  let remaining = normalizeText(text);
  let dosageForm: string | null = null;
  for (const [pattern, form] of FORM_PATTERNS) {
    if (pattern.test(remaining)) {
      dosageForm = form;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  const strengths = normalizedStrengths(remaining);
  remaining = remaining.replace(new RegExp(STRENGTH_PATTERN.source, "gi"), " ");
  remaining = remaining.replace(/\b(?:per|for|oral|iv|im|intravenous|intramuscular)\b/g, " ");
  const ingredients = remaining
    .split("+")
    .map((part) => part.replace(/[^a-z0-9 -]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return { ingredients, strengths, dosage_form: dosageForm };
}

function componentKey(component: NormalizedMedicineComponent): string {
  const strength = component.strength_value !== null && component.strength_unit
    ? normalizeStrength(component.strength_value, component.strength_unit)
    : "strength-unknown";
  const denominator = component.denominator_value !== null && component.denominator_unit && CONCENTRATION_DENOMINATOR_UNITS.has(normalizeUnit(component.denominator_unit))
    ? `/${normalizeStrength(component.denominator_value, component.denominator_unit)}`
    : "";
  return `${component.normalized_ingredient} ${strength}${denominator}`.trim();
}

function componentFromStructured(component: MedicineComponentIdentity): NormalizedMedicineComponent {
  return {
    ...component,
    normalized_ingredient: normalizeText(component.ingredient_name),
    strength_unit: component.strength_unit ? normalizeUnit(component.strength_unit) : null,
    denominator_unit: component.denominator_unit ? normalizeUnit(component.denominator_unit) : null,
  };
}

function structuredComponents(identity: ExtractedMedicineIdentity): NormalizedMedicineComponent[] {
  return identity.components
    .filter((component) => Boolean(component.ingredient_name?.trim()))
    .map(componentFromStructured)
    .sort((a, b) => a.normalized_ingredient.localeCompare(b.normalized_ingredient));
}

export function normalizeMedicineIdentity(
  identity: ExtractedMedicineIdentity | null | undefined,
  fallbackName: string,
  fallbackNormalizedName?: string | null,
): NormalizedMedicineIdentity {
  const structured = identity ? structuredComponents(identity) : [];
  const fallback = parseTextIdentity(fallbackNormalizedName || fallbackName);
  const components = structured.length
    ? structured
    : fallback.ingredients.map((ingredient, index) => ({
        ingredient_name: ingredient,
        normalized_ingredient: normalizeText(ingredient),
        strength_value: null,
        strength_unit: null,
        denominator_value: null,
        denominator_unit: null,
        ...(fallback.strengths[index]
          ? { strength_value: Number(fallback.strengths[index].split(" ")[0]), strength_unit: fallback.strengths[index].split(" ")[1] }
          : {}),
      }));
  const dosageForm = normalizeDosageForm(identity?.dosage_form) || fallback.dosage_form;
  const textStrengths = structured.length
    ? structured.flatMap((component) => {
        const key = componentKey(component);
        return key.match(/\d+(?:\.\d+)?\s+(?:mcg|mg|g|kg|ml|l)(?:\/\d+(?:\.\d+)?\s+(?:mcg|mg|g|kg|ml|l))?/) ?? [];
      })
    : fallback.strengths;
  const componentText = components.length
    ? components.map(componentKey).join(" + ")
    : fallback.ingredients.join(" + ");
  const canonicalText = [componentText, dosageForm].filter(Boolean).join(" ").trim();
  const signature = [
    components.map(componentKey).join("+") || fallback.ingredients.join("+"),
    `form:${dosageForm ?? "unknown"}`,
    `strength:${textStrengths.join(",") || "unknown"}`,
  ].join("|");

  return {
    signature,
    canonical_text: canonicalText,
    components,
    dosage_form: dosageForm,
    route: identity?.route ? normalizeText(identity.route) : null,
    pack_text: identity?.pack_text ?? null,
    pack_quantity: identity?.pack_quantity ?? null,
    pack_unit: identity?.pack_unit ? normalizeText(identity.pack_unit) : null,
    has_combination: components.length > 1 || /\+/.test(fallbackName),
    has_strength: textStrengths.length > 0,
  };
}

export function normalizeMedicineText(text: string): string {
  return normalizeMedicineIdentity(null, text, text).signature;
}

export function medicineTextTokens(identity: NormalizedMedicineIdentity): Set<string> {
  return new Set(identity.canonical_text.split(/\s+/).filter((token) => token && !token.startsWith("form:") && !token.startsWith("strength:")));
}
