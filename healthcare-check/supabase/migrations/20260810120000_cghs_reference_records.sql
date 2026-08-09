-- Minimal CGHS procedure/package records linked to versioned reference snapshots.

alter table public.reference_snapshots
  drop constraint if exists reference_snapshots_source_kind_check;

alter table public.reference_snapshots
  add constraint reference_snapshots_source_kind_check
  check (source_kind in ('nppa', 'pmbi', 'cghs'));

create table if not exists public.cghs_reference_records (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.reference_snapshots(id) on delete restrict,
  source_record_id text not null,
  code text not null,
  record_kind text not null check (record_kind in ('procedure', 'package')),
  category text not null,
  description text not null,
  normalized_name text not null,
  rate numeric not null check (rate > 0),
  rate_unit text not null,
  rate_context text not null,
  room_type text,
  inclusion_notes text,
  exclusion_notes text,
  applicability_conditions text,
  source_page integer,
  source_section text,
  raw_source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (snapshot_id, source_record_id, rate_context)
);

create index if not exists cghs_reference_records_name_idx
  on public.cghs_reference_records (normalized_name, rate_context);

create index if not exists cghs_reference_records_snapshot_idx
  on public.cghs_reference_records (snapshot_id);

alter table public.cghs_reference_records enable row level security;

create policy "Authenticated users can read CGHS reference records"
  on public.cghs_reference_records for select
  to authenticated
  using (true);

