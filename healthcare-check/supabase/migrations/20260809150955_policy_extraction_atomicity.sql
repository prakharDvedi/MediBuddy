-- Keep the source and conflicts for the structured policy summary so the
-- application never has to guess where a value came from.
alter table public.insurance_policies
  add column if not exists extraction_provenance jsonb;

-- Replace the summary and its searchable chunks in one transaction. The
-- function is security invoker so the existing RLS policies still scope the
-- operation to the authenticated user's document.
create or replace function public.replace_policy_extraction(
  p_document_id uuid,
  p_policy jsonb,
  p_provenance jsonb,
  p_chunks jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.insurance_policies (
    document_id,
    sum_insured,
    room_rent_limit,
    icu_limit,
    copay_percent,
    deductible,
    waiting_periods,
    sub_limits,
    exclusions,
    consumables_covered,
    other_conditions,
    extraction_provenance
  )
  values (
    p_document_id,
    (p_policy->>'sum_insured')::numeric,
    (p_policy->>'room_rent_limit')::numeric,
    (p_policy->>'icu_limit')::numeric,
    (p_policy->>'copay_percent')::numeric,
    (p_policy->>'deductible')::numeric,
    coalesce(p_policy->'waiting_periods', '[]'::jsonb),
    coalesce(p_policy->'sub_limits', '[]'::jsonb),
    coalesce(p_policy->'exclusions', '[]'::jsonb),
    (p_policy->>'consumables_covered')::boolean,
    coalesce(p_policy->'other_conditions', '[]'::jsonb),
    coalesce(p_provenance, '{}'::jsonb)
  )
  on conflict (document_id) do update set
    sum_insured = excluded.sum_insured,
    room_rent_limit = excluded.room_rent_limit,
    icu_limit = excluded.icu_limit,
    copay_percent = excluded.copay_percent,
    deductible = excluded.deductible,
    waiting_periods = excluded.waiting_periods,
    sub_limits = excluded.sub_limits,
    exclusions = excluded.exclusions,
    consumables_covered = excluded.consumables_covered,
    other_conditions = excluded.other_conditions,
    extraction_provenance = excluded.extraction_provenance;

  delete from public.policy_chunks
  where document_id = p_document_id;

  insert into public.policy_chunks (document_id, chunk_index, page, section_title, content)
  select p_document_id, chunk.chunk_index, chunk.page, chunk.section_title, chunk.content
  from jsonb_to_recordset(coalesce(p_chunks, '[]'::jsonb)) as chunk(
    chunk_index integer,
    page integer,
    section_title text,
    content text
  );

  update public.documents
  set status = 'structured'
  where id = p_document_id;
end;
$$;

grant execute on function public.replace_policy_extraction(uuid, jsonb, jsonb, jsonb) to authenticated;
