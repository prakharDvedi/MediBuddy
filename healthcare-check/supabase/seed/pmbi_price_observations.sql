-- Official PMBI Product & MRP List snapshot.
-- Source: https://janaushadhi.gov.in/product-portfolio/product-mrp-list
-- Retrieved through the official structured endpoint on 09-Aug-2026.
-- PMBI does not publish an effective date for these rows; effective_date stays NULL.
-- Only exact, non-zero, safely representable products that overlap the reviewed NPPA
-- catalog are included. Raw source fields are retained in raw_source.

with pmbi(product_id, drug_code, generic_name, unit_size, mrp, group_name, normalized_identity) as (
  values
    ('2076', '72', 'Azithromycin Tablets IP 500 mg', '3''s', 39.38, 'Antibiotics', 'azithromycin tablet 500 mg'),
    ('1909', '55', 'Cefixime Tablets IP 200 mg', '10''s', 52.55, 'Antibiotics', 'cefixime tablet 200 mg'),
    ('2099', '757', 'Cefuroxime Injection IP 1500mg', 'Vial & Wfi', 65.63, 'Antibiotics', 'cefuroxime injection 1500 mg'),
    ('549', '186', 'Domperidone Tablets IP 10 mg', '10''s', 4.54, 'Gastrointestinal', 'domperidone tablet 10 mg'),
    ('2392', '92', 'Doxycycline Capsules IP 100mg', '10''s', 15.88, 'Antibiotics', 'doxycycline capsule 100 mg'),
    ('242', '15', 'Ibuprofen Tablets IP 200 mg', '10''s', 2.81, 'Analgesics', 'ibuprofen tablet 200 mg'),
    ('337', '16', 'Ibuprofen Tablets IP 400 mg', '15''s', 9.08, 'Analgesics', 'ibuprofen tablet 400 mg'),
    ('2419', '96', 'Levofloxacin Tablets IP 500mg', '10''s', 34.03, 'Antibiotics', 'levofloxacin tablet 500 mg'),
    ('1700', '382', 'Linezolid Tablets IP 600 mg', '10''s', 154.69, 'Antibiotics', 'linezolid tablet 600 mg'),
    ('2423', '97', 'Meropenem Injection IP 1 g', 'Vial & Wfi', 221.25, 'Antibiotics', 'meropenem injection 1000 mg'),
    ('155', '1345', 'Meropenem Injection IP 500 mg', 'Vial & Wfi', 154.69, 'Antibiotics', 'meropenem injection 500 mg'),
    ('707', '202', 'Metronidazole Tablets IP 400mg', '10''s', 7.22, 'Antibiotics', 'metronidazole tablet 400 mg'),
    ('749', '207', 'Omeprazole Gastro-resistant Capsules IP 20 mg', '10''s', 10.21, 'Gastrointestinal', 'omeprazole capsule 20 mg'),
    ('811', '213', 'Pantoprazole Injection 40mg', 'Vial', 23.83, 'Gastrointestinal', 'pantoprazole injection 40 mg'),
    ('982', '23', 'Paracetamol Tablets IP 500 mg', '10''s', 6.56, 'Analgesics', 'paracetamol tablet 500 mg'),
    ('1882', '511', 'Paracetamol Tablets IP 650 mg', '15''s', 15.47, 'Analgesics', 'paracetamol tablet 650 mg')
), snapshot as (
  select now() as retrieved_at
)
insert into public.medicine_price_observations
  (medicine_product_id, source_kind, source_record_id, price_kind, amount, currency,
   sale_unit, pack_text, pack_quantity, pack_unit, tax_status, effective_date,
   observed_at, source_name, source_url, raw_source)
select
  p.id,
  'pmbi',
  'product_id:' || pmbi.product_id,
  'listed_mrp',
  pmbi.mrp,
  'INR',
  'pack',
  pmbi.unit_size,
  case
    when pmbi.unit_size ~ '^[0-9]+''s$' then regexp_replace(pmbi.unit_size, '''s$', '')::numeric
    when pmbi.unit_size in ('Vial', 'Vial & Wfi') then 1
    else null
  end,
  case
    when pmbi.unit_size ~ '^[0-9]+''s$' then 'tablet_or_capsule'
    when pmbi.unit_size = 'Vial' then 'vial'
    when pmbi.unit_size = 'Vial & Wfi' then 'vial_with_wfi'
    else null
  end,
  'unknown',
  null,
  snapshot.retrieved_at,
  'Jan Aushadhi / PMBI listed MRP',
  'https://janaushadhi.gov.in/product-portfolio/product-mrp-list',
  jsonb_build_object(
    'productId', pmbi.product_id,
    'drugCode', pmbi.drug_code,
    'genericName', pmbi.generic_name,
    'unitSize', pmbi.unit_size,
    'mrp', pmbi.mrp,
    'groupName', pmbi.group_name,
    'retrievedAt', snapshot.retrieved_at
  )
from pmbi
cross join snapshot
join public.medicine_products p on p.normalized_identity = pmbi.normalized_identity
on conflict (source_kind, source_record_id) do update
set medicine_product_id = excluded.medicine_product_id,
    amount = excluded.amount,
    sale_unit = excluded.sale_unit,
    pack_text = excluded.pack_text,
    pack_quantity = excluded.pack_quantity,
    pack_unit = excluded.pack_unit,
    observed_at = excluded.observed_at,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    raw_source = excluded.raw_source;
