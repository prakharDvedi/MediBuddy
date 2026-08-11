"use client";

import { useLocale } from "@/components/locale-provider";
import { LOCALE_COPY, SUPPORTED_LOCALES } from "@/lib/i18n/types";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const copy = LOCALE_COPY[locale];

  return (
    <div className="flex items-center gap-2" role="group" aria-label={copy.languageLabel}>
      <span className="text-xs font-medium text-text-muted">{copy.languageLabel}</span>
      <div className="flex rounded-full border border-info/20 bg-surface p-0.5">
        {SUPPORTED_LOCALES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={locale === option}
            onClick={() => setLocale(option)}
            className={`focus-ring rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${locale === option ? "bg-info text-white" : "text-info hover:bg-info-bg"}`}
          >
            {copy.names[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
