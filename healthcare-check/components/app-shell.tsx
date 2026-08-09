import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/components/ui";

export function Brand({ href = "/", variant = "compact" }: { href?: string; variant?: "compact" | "full" }) {
  if (variant === "full") {
    return <Link href={href} className="focus-ring inline-flex items-center gap-2.5 rounded-lg py-1"><Image src="/logo/logo.webp" alt="" width={48} height={48} priority className="h-9 w-9 rounded-xl object-cover mix-blend-multiply" /><span className="flex flex-col"><span className="text-lg font-semibold leading-none tracking-tight"><span className="text-primary">Med</span><span className="text-success">Bud</span></span><span className="mt-1 text-[0.5rem] font-semibold uppercase leading-none tracking-[0.18em] text-text-muted">Understand. Verify. Save.</span></span></Link>;
  }

  return <Link href={href} className="focus-ring inline-flex items-center gap-2 rounded-lg"><Image src="/logo/logo.webp" alt="" width={48} height={48} className="h-8 w-8 rounded-xl object-cover mix-blend-multiply" /><span className="text-base font-semibold tracking-tight text-text-primary">MedBud</span></Link>;
}

export function PublicHeader() {
  return <header className="relative z-10 border-b border-border/80 bg-background/90 backdrop-blur"><div className="content-width flex min-h-16 items-center justify-between gap-4"><Brand variant="full" /><nav className="flex items-center gap-2 text-sm"><Link href="/login" className="focus-ring rounded-lg px-3 py-2 text-text-muted hover:text-text-primary">Log in</Link><Link href="/signup" className="focus-ring rounded-xl bg-primary px-3.5 py-2 text-white hover:bg-primary-hover">Sign up</Link></nav></div></header>;
}

export function AppShell({ children, email, context }: { children: ReactNode; email?: string; context?: string }) {
  return <div className="min-h-screen bg-background text-text-primary"><header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur"><div className="content-width flex min-h-16 items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><Brand href="/dashboard" />{context && <span className="hidden truncate border-l border-border pl-4 text-sm text-text-muted sm:block">{context}</span>}</div><div className="flex items-center gap-3">{email && <span className="hidden max-w-52 truncate text-sm text-text-muted md:block">{email}</span>}<LogoutButton /></div></div></header>{children}</div>;
}

export function BackLink({ href = "/dashboard", children = "Back to dashboard" }: { href?: string; children?: ReactNode }) {
  return <Link href={href} className={cn("focus-ring inline-flex rounded-lg text-sm text-text-muted hover:text-text-primary", "underline decoration-border-strong underline-offset-4")}>← {children}</Link>;
}
