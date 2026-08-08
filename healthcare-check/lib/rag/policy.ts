import type { createClient } from "@/lib/supabase/server";
import type { InsurancePolicyRow } from "@/lib/audit/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PolicyChunk = {
  page: number | null;
  sectionTitle: string | null;
  content: string;
};

export type RankedPolicyChunk = PolicyChunk & {
  id: string;
  documentId: string;
  chunkIndex: number;
  rank: number;
};

export type DerivedPolicyFact = {
  label: string;
  amount: number;
  formula: string;
};

// pdf.js extraction (lib/documents/pdf.ts) collapses each page to a single
// whitespace-flattened line, so there are no newlines to split on. Section/
// Clause numbers are the one reliably-structured marker in policy prose
// ("Section 3: ..."), so chunking splits on those. The label captured is
// only the marker itself ("Section 3"), never a guessed title — guessing a
// title from flattened text risks mislabeling a citation, which is worse
// than a plain section number.
const SECTION_MARKER_RE = /\b(Section|Clause|Part)\s+(\d+)\s*:/g;

/**
 * Splits a policy document's per-page text into search/citation chunks.
 * Falls back to one whole-page chunk when no section markers are found.
 */
export function chunkPolicyPages(
  pages: { pageNumber: number; content: string }[],
): PolicyChunk[] {
  const chunks: PolicyChunk[] = [];

  for (const page of pages) {
    const content = page.content ?? "";
    const matches = [...content.matchAll(SECTION_MARKER_RE)];

    if (matches.length === 0) {
      const trimmed = content.trim();
      if (trimmed) chunks.push({ page: page.pageNumber, sectionTitle: null, content: trimmed });
      continue;
    }

    const preamble = content.slice(0, matches[0].index).trim();
    if (preamble) chunks.push({ page: page.pageNumber, sectionTitle: null, content: preamble });

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const body = content.slice(start, end).trim();
      if (!body) continue;
      const label = `${matches[i][1]} ${matches[i][2]}`;
      chunks.push({ page: page.pageNumber, sectionTitle: label, content: body });
    }
  }

  return chunks;
}

/**
 * Deterministically expands percent-based sub-limits into rupee amounts
 * using the policy's own extracted sum insured. Kept separate from the LLM
 * entirely — the Q&A model is told to use these precomputed numbers rather
 * than doing the multiplication itself, per "keep arithmetic deterministic".
 */
export function computeDerivedPolicyFacts(policy: InsurancePolicyRow): DerivedPolicyFact[] {
  const facts: DerivedPolicyFact[] = [];

  for (const s of policy.sub_limits ?? []) {
    if (s.limit_percent != null && policy.sum_insured != null) {
      const amount = Number(((s.limit_percent / 100) * policy.sum_insured).toFixed(2));
      facts.push({
        label: `${s.category} sub-limit`,
        amount,
        formula: `${s.limit_percent}% of sum insured (₹${policy.sum_insured})`,
      });
    }
  }

  return facts;
}

/**
 * Ranked full-text search over policy_chunks via the search_policy_chunks
 * RPC (ts_rank over a generated tsvector column — see the M7 migration).
 * RLS still applies: the RPC is security invoker, scoped to the caller.
 */
export async function searchPolicyChunks(
  supabase: SupabaseServerClient,
  documentIds: string[],
  query: string,
  limit = 6,
): Promise<RankedPolicyChunk[]> {
  if (documentIds.length === 0 || !query.trim()) return [];

  const { data, error } = await supabase.rpc("search_policy_chunks", {
    p_document_ids: documentIds,
    p_query: query,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);

  type SearchRow = {
    id: string;
    document_id: string;
    chunk_index: number;
    page: number | null;
    section_title: string | null;
    content: string;
    rank: number;
  };
  const rows = (data ?? []) as SearchRow[];

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    page: row.page,
    sectionTitle: row.section_title,
    content: row.content,
    rank: row.rank,
  }));
}
