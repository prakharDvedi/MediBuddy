"use client";

import { Brand } from "@/components/app-shell";
import { ErrorState } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";

export function AuthErrorContent({ message }: { message: string }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].auth;
  return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-sm"><div className="mb-4 flex justify-end"><LocaleSwitcher /></div><div className="mb-8 flex justify-center"><Brand variant="full" /></div><div className="surface p-6 text-center"><h1 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary">{copy.authError}</h1><ErrorState message={message || copy.unspecifiedError} /></div></div></div>;
}
