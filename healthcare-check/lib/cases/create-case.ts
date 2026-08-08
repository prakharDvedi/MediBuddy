export type CreatedCase = { id: string; title: string; status: string; created_at: string };

/**
 * Client-side POST /api/cases wrapper. Shared by the new-case shell's title
 * field and its upload widget so whichever the user touches first is the
 * only thing that actually creates a row — see components/new-case-shell.tsx.
 */
export async function createCase(title?: string): Promise<CreatedCase> {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(title ? { title } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not create case");
  return data.case;
}
