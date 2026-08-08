-- M7: policy_chunks — page/section-tagged text chunks of insurance policy
-- documents, full-text searchable. No embedding column (see plan.md §D) —
-- Postgres tsvector/ts_rank is the day-1 retrieval mechanism.

create table public.policy_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  page integer,
  section_title text,
  content text not null,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(section_title, '') || ' ' || content)
  ) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index policy_chunks_document_id_idx on public.policy_chunks (document_id);
create index policy_chunks_fts_idx on public.policy_chunks using gin (fts);

alter table public.policy_chunks enable row level security;

create policy "policy_chunks_select_own" on public.policy_chunks
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = policy_chunks.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "policy_chunks_insert_own" on public.policy_chunks
  for insert to authenticated
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = policy_chunks.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "policy_chunks_update_own" on public.policy_chunks
  for update to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = policy_chunks.document_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = policy_chunks.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "policy_chunks_delete_own" on public.policy_chunks
  for delete to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = policy_chunks.document_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- search_policy_chunks
-- Ranked full-text search over policy_chunks, scoped to a caller-supplied
-- list of document ids. security invoker (the default) so RLS on
-- policy_chunks still applies to the calling user — this function only
-- centralizes the ts_rank ordering, it does not widen access.
-- ============================================================
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
  select
    pc.id, pc.document_id, pc.chunk_index, pc.page, pc.section_title, pc.content,
    ts_rank(pc.fts, websearch_to_tsquery('english', p_query)) as rank
  from public.policy_chunks pc
  where pc.document_id = any(p_document_ids)
    and pc.fts @@ websearch_to_tsquery('english', p_query)
  order by rank desc
  limit p_limit;
$$;

grant execute on function public.search_policy_chunks(uuid[], text, integer) to authenticated;
