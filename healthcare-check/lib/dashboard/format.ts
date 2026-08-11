import type { Locale } from "@/lib/i18n/types";

export function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatRelativeTime(value: string, now = Date.now(), locale: Locale = "en") {
  const timestamp = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (seconds < 60) return locale === "hi" ? "अभी" : "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "hi" ? `${minutes} मिनट पहले अपडेट` : `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "hi" ? `${hours} घंटे पहले अपडेट` : `Updated ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "hi" ? `${days} दिन पहले अपडेट` : `Updated ${days}d ago`;

  const date = new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return locale === "hi" ? `${date} को अपडेट` : `Updated ${date}`;
}
