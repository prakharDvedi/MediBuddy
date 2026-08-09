"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="focus-ring min-h-9 rounded-xl border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-elevated"
    >
      Log out
    </button>
  );
}
