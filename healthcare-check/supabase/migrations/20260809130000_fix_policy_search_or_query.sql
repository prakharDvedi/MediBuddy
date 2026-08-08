-- websearch_to_tsquery ANDs bare words together. A natural-language
-- question ("cataract surgery how much... waiting periods") then requires
-- every stemmed word to appear in the SAME chunk, which almost never
-- happens against small section-sized chunks — recall was effectively
-- zero on any multi-topic question. Inserting "or" between words switches
-- websearch_to_tsquery to OR semantics (its documented behavior for the
-- "or" keyword) while keeping its input-never-errors parsing, so ts_rank
-- can do the job of surfacing the best-matching chunk(s) instead of an
-- exact-match requirement.
create or replace function public.search_policy_chunks(
  p_document_ids uuid[],
  p_query text,
  p_limit integer default 6
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index integer,
  page integer,
  section_title text,
  content text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english', regexp_replace(trim(p_query), '\s+', ' or ', 'g')) as tsq
  )
  select
    pc.id, pc.document_id, pc.chunk_index, pc.page, pc.section_title, pc.content,
    ts_rank(pc.fts, q.tsq) as rank
  from public.policy_chunks pc, q
  where pc.document_id = any(p_document_ids)
    and pc.fts @@ q.tsq
  order by rank desc
  limit p_limit;
$$;
