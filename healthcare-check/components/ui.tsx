import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { formatMoney } from "@/lib/dashboard/format";
import { TONE_ACCENTS, TONE_CLASSES, type Tone } from "@/lib/presentation";

export function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  return <button className={cn("focus-ring inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-primary text-white hover:bg-primary-hover", variant === "secondary" && "border border-border-strong bg-surface text-text-primary hover:bg-surface-elevated", variant === "quiet" && "text-text-muted hover:bg-surface hover:text-text-primary", className)} {...props} />;
}

export function Surface({ tone = "neutral", className, children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return <div className={cn("rounded-[0.875rem] border p-5 shadow-[0_10px_30px_rgb(23_43_58_/_0.035)]", TONE_CLASSES[tone], className)} {...props}>{children}</div>;
}

export function ImpactCard({ tone = "neutral", label, value, description, children, className }: { tone?: Tone; label: string; value?: string; description?: string; children?: ReactNode; className?: string }) {
  return <div className={cn("impact-card border p-5", TONE_CLASSES[tone], className)}><p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{label}</p>{value && <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{value}</p>}{description && <p className="mt-2 max-w-md text-sm leading-6 opacity-80">{description}</p>}{children}</div>;
}

export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", TONE_CLASSES[tone])}>{children}</span>;
}

export function SourceBadge({ children = "Source" }: { children?: ReactNode }) { return <StatusBadge tone="info">{children}</StatusBadge>; }

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>}<h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">{title}</h2>{description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>}</div>{action}</div>;
}

export function MoneyValue({ value, size = "md", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  return <span className={cn("font-semibold tabular-nums tracking-tight", size === "sm" && "text-base", size === "md" && "text-2xl", size === "lg" && "text-4xl sm:text-5xl", className)}>{formatMoney(value)}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-[0.875rem] border border-dashed border-border-strong bg-surface/70 p-6 text-center"><p className="font-medium text-text-primary">{title}</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
  return <div className="rounded-[0.875rem] border border-danger/25 bg-danger-bg p-4 text-sm text-danger"><p>{message}</p>{action && <div className="mt-3">{action}</div>}</div>;
}

export function FindingSurface({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[0.875rem] border border-l-4 bg-surface p-5 shadow-[0_10px_30px_rgb(23_43_58_/_0.035)]", TONE_ACCENTS[tone], className)}>{children}</div>;
}
