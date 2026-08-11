import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/locale-provider";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.medbud.space"),
  title: "MedBud | Understand your healthcare costs",
  description: "Understand your hospital bill, insurance policy, and next questions.",
  openGraph: {
    type: "website",
    url: "https://www.medbud.space/",
    siteName: "MedBud",
    title: "MedBud | Understand your healthcare costs",
    description: "Understand your hospital bill, insurance policy, and next questions.",
    images: [
      {
        url: "/logo/logo.webp",
        width: 246,
        height: 257,
        alt: "MedBud logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MedBud | Understand your healthcare costs",
    description: "Understand your hospital bill, insurance policy, and next questions.",
    images: ["/logo/logo.webp"],
  },
  icons: {
    icon: "/logo/logo.webp",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider></body>
    </html>
  );
}
