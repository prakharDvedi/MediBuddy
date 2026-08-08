import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_TITLE = "Untitled case";

/**
 * Sets a case's title to the LLM-suggested one, but only the first time —
 * once a case has a real title (auto-set or user-edited), later documents
 * uploaded into the same case never overwrite it.
 */
export async function maybeSetCaseTitle(
  supabase: SupabaseServerClient,
  documentId: string,
  suggestedTitle: string,
): Promise<void> {
  if (!suggestedTitle || suggestedTitle === DEFAULT_TITLE) return;

  const { data: document } = await supabase
    .from("documents")
    .select("case_id")
    .eq("id", documentId)
    .single();
  if (!document) return;

  const { data: caseRow } = await supabase
    .from("cases")
    .select("title")
    .eq("id", document.case_id)
    .single();
  if (!caseRow || caseRow.title !== DEFAULT_TITLE) return;

  await supabase.from("cases").update({ title: suggestedTitle }).eq("id", document.case_id);
}
