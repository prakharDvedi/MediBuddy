-- Link the existing reviewed 65-row NPPA subset to the medicine catalog.
-- This file intentionally does not create or update any NPPA reference values.
-- Run after nppa_reference_items.sql and the medicine schema migration.

insert into public.medicine_products (canonical_name, normalized_identity, dosage_form, route)
select
  r.name,
  r.normalized_name,
  case
    when r.normalized_name like '%powder for injection%' then 'powder for injection'
    when r.normalized_name like '%injection%' then 'injection'
    when r.normalized_name like '%tablet%' then 'tablet'
    when r.normalized_name like '%capsule%' then 'capsule'
    when r.normalized_name like '%suppository%' then 'suppository'
    when r.normalized_name like '%syrup%' then 'syrup'
    when r.normalized_name like '%oral liquid%' or r.normalized_name like '%oral solution%' then 'oral liquid'
    when r.normalized_name like '%infusion%' then 'infusion'
    else null
  end,
  case
    when r.normalized_name like '%injection%' then 'injectable'
    when r.normalized_name like '%oral%' or r.normalized_name like '%tablet%' or r.normalized_name like '%capsule%' then 'oral'
    else null
  end
from public.reference_items r
where r.category = 'medicine'
  and r.is_demo_data = false
on conflict (normalized_identity) do update
set canonical_name = excluded.canonical_name,
    dosage_form = excluded.dosage_form,
    route = excluded.route,
    updated_at = now();

update public.reference_items r
set medicine_product_id = p.id
from public.medicine_products p
where r.category = 'medicine'
  and r.is_demo_data = false
  and p.normalized_identity = r.normalized_name;

insert into public.medicine_aliases
  (medicine_product_id, alias_text, normalized_alias, alias_type, source_name, confidence, review_status)
select
  p.id,
  p.canonical_name,
  p.normalized_identity,
  'generic',
  'NPPA reviewed 65-row subset',
  'high',
  'reviewed'
from public.medicine_products p
where not exists (
  select 1
  from public.medicine_aliases a
  where a.medicine_product_id = p.id
    and a.normalized_alias = p.normalized_identity
);

insert into public.medicine_product_components
  (medicine_product_id, ordinal, ingredient_name, normalized_ingredient, strength_value, strength_unit)
select
  p.id,
  1,
  trim(regexp_replace(
    p.normalized_identity,
    '\s+(powder for injection|injection|tablet|capsule|suppository|syrup|oral liquid|oral solution|infusion).*$',''
  )),
  trim(regexp_replace(
    p.normalized_identity,
    '\s+(powder for injection|injection|tablet|capsule|suppository|syrup|oral liquid|oral solution|infusion).*$',''
  )),
  (regexp_match(p.normalized_identity, '(\d+(?:\.\d+)?)\s*(mcg|mg|g|kg|ml|l)'))[1]::numeric,
  (regexp_match(p.normalized_identity, '(\d+(?:\.\d+)?)\s*(mcg|mg|g|kg|ml|l)'))[2]
from public.medicine_products p
where not exists (
  select 1
  from public.medicine_product_components c
  where c.medicine_product_id = p.id
    and c.ordinal = 1
)
  and p.normalized_identity not like '% + %';

insert into public.medicine_price_observations
  (medicine_product_id, reference_item_id, source_kind, source_record_id, price_kind,
   amount, currency, sale_unit, pack_text, pack_quantity, pack_unit, tax_status,
   effective_date, observed_at, source_name, source_url, raw_source)
select
  p.id,
  r.id,
  'nppa',
  r.id::text,
  'ceiling_price',
  r.reference_price,
  'INR',
  lower(r.unit),
  r.notes,
  case
    when lower(r.unit) = '1 tablet' then 1
    when lower(r.unit) = '1 capsule' then 1
    when lower(r.unit) = '1 suppository' then 1
    when lower(r.unit) = 'each vial' then 1
    when lower(r.unit) = '1 ml' then 1
    when lower(r.unit) = '2 ml pack' then 2
    else null
  end,
  case
    when lower(r.unit) = '1 tablet' then 'tablet'
    when lower(r.unit) = '1 capsule' then 'capsule'
    when lower(r.unit) = '1 suppository' then 'suppository'
    when lower(r.unit) = 'each vial' then 'vial'
    when lower(r.unit) in ('1 ml', '2 ml pack') then 'ml'
    else null
  end,
  'excluded',
  r.effective_date,
  coalesce(r.retrieved_at, now()),
  r.source_name,
  coalesce(r.source_url, 'https://nppaipdms.gov.in'),
  jsonb_build_object(
    'reference_item_id', r.id,
    'raw_source_notes', r.notes,
    'published_unit', r.unit,
    'source_effective_date', r.effective_date
  )
from public.reference_items r
join public.medicine_products p on p.id = r.medicine_product_id
where r.category = 'medicine'
  and r.is_demo_data = false
on conflict (source_kind, source_record_id) do update
set medicine_product_id = excluded.medicine_product_id,
    reference_item_id = excluded.reference_item_id,
    amount = excluded.amount,
    sale_unit = excluded.sale_unit,
    pack_text = excluded.pack_text,
    pack_quantity = excluded.pack_quantity,
    pack_unit = excluded.pack_unit,
    effective_date = excluded.effective_date,
    observed_at = excluded.observed_at,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    raw_source = excluded.raw_source;
