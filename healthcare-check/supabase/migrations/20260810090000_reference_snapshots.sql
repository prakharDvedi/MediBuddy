-- Versioned authoritative reference snapshots for NPPA and PMBI.
-- Existing rows remain valid with a NULL snapshot_id; new ingestion runs attach
-- every observation to an accepted snapshot and never overwrite prior history.

create table if not exists public.reference_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null check (source_kind in ('nppa', 'pmbi')),
  source_name text not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  effective_date date,
  content_hash text not null,
  status text not null default 'staged' check (status in ('staged', 'accepted', 'rejected')),
  row_count integer not null default 0 check (row_count >= 0),
  validation_errors jsonb not null default '[]'::jsonb,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_kind, content_hash)
);

create index if not exists reference_snapshots_latest_idx
  on public.reference_snapshots (source_kind, status, retrieved_at desc);

alter table public.reference_snapshots enable row level security;

create policy "Authenticated users can read reference snapshots"
  on public.reference_snapshots for select
  to authenticated
  using (true);

alter table public.medicine_price_observations
  add column if not exists snapshot_id uuid references public.reference_snapshots(id) on delete restrict;

alter table public.medicine_price_observations
  drop constraint if exists medicine_price_observations_source_kind_source_record_id_key;

create unique index if not exists medicine_price_observations_snapshot_record_idx
  on public.medicine_price_observations (snapshot_id, source_kind, source_record_id)
  where snapshot_id is not null;

create index if not exists medicine_price_observations_snapshot_idx
  on public.medicine_price_observations (snapshot_id);
