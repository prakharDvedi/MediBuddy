export const SUPPORTED_LOCALES = ["en", "hi"] as const;
export const LOCALE_COOKIE_NAME = "medbud-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_COPY: Record<Locale, { languageLabel: string; names: Record<Locale, string> }> = {
  en: {
    languageLabel: "Language",
    names: { en: "English", hi: "हिंदी" },
  },
  hi: {
    languageLabel: "भाषा",
    names: { en: "English", hi: "हिंदी" },
  },
};

export function normalizeLocale(value: unknown): Locale {
  return value === "hi" ? "hi" : "en";
}
