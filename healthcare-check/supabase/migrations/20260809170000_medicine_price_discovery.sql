create table if not exists public.medicine_products (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_identity text not null unique,
  dosage_form text,
  route text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicine_product_components (
  id uuid primary key default gen_random_uuid(),
  medicine_product_id uuid not null references public.medicine_products(id) on delete cascade,
  ordinal integer not null,
  ingredient_name text not null,
  normalized_ingredient text not null,
  strength_value numeric,
  strength_unit text,
  denominator_value numeric,
  denominator_unit text,
  created_at timestamptz not null default now(),
  unique (medicine_product_id, ordinal)
);

create table if not exists public.medicine_aliases (
  id uuid primary key default gen_random_uuid(),
  medicine_product_id uuid not null references public.medicine_products(id) on delete cascade,
  alias_text text not null,
  normalized_alias text not null,
  alias_type text not null check (alias_type in ('brand', 'generic', 'bill_text')),
  source_name text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  review_status text not null default 'reviewed' check (review_status in ('reviewed', 'candidate', 'rejected')),
  created_at timestamptz not null default now(),
  unique (medicine_product_id, normalized_alias)
);

create table if not exists public.medicine_price_observations (
  id uuid primary key default gen_random_uuid(),
  medicine_product_id uuid not null references public.medicine_products(id) on delete cascade,
  reference_item_id uuid references public.reference_items(id) on delete set null,
  source_kind text not null check (source_kind in ('nppa', 'pmbi')),
  source_record_id text not null,
  price_kind text not null check (price_kind in ('ceiling_price', 'listed_mrp')),
  amount numeric not null check (amount >= 0),
  currency text not null default 'INR',
  sale_unit text not null,
  pack_text text,
  pack_quantity numeric,
  pack_unit text,
  tax_status text not null check (tax_status in ('included', 'excluded', 'unknown')),
  effective_date date,
  observed_at timestamptz not null,
  source_name text not null,
  source_url text not null,
  raw_source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_kind, source_record_id)
);

alter table public.extracted_items
  add column if not exists medicine_identity jsonb,
  add column if not exists medicine_product_id uuid references public.medicine_products(id) on delete set null,
  add column if not exists medicine_match_status text check (
    medicine_match_status in ('unresolved', 'matched_exact', 'matched_alias', 'needs_review', 'combination_unresolved', 'unit_unverified')
  ),
  add column if not exists medicine_match_confidence text check (
    medicine_match_confidence in ('high', 'medium', 'low')
  ),
  add column if not exists medicine_match_reason text;

alter table public.reference_items
  add column if not exists medicine_product_id uuid references public.medicine_products(id) on delete set null;

create index if not exists medicine_products_normalized_identity_idx
  on public.medicine_products (normalized_identity);

create index if not exists medicine_product_components_product_idx
  on public.medicine_product_components (medicine_product_id);

create index if not exists medicine_aliases_normalized_alias_idx
  on public.medicine_aliases (normalized_alias);

create index if not exists medicine_price_observations_product_idx
  on public.medicine_price_observations (medicine_product_id, source_kind, effective_date desc);

alter table public.medicine_products enable row level security;
alter table public.medicine_product_components enable row level security;
alter table public.medicine_aliases enable row level security;
alter table public.medicine_price_observations enable row level security;

create policy "Authenticated users can read medicine products"
  on public.medicine_products for select
  to authenticated
  using (true);

create policy "Authenticated users can read medicine components"
  on public.medicine_product_components for select
  to authenticated
  using (true);

create policy "Authenticated users can read medicine aliases"
  on public.medicine_aliases for select
  to authenticated
  using (true);

create policy "Authenticated users can read medicine price observations"
  on public.medicine_price_observations for select
  to authenticated
  using (true);
