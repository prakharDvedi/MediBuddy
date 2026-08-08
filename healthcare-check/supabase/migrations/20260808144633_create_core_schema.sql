-- Healthcare Check MVP — core schema
-- Ownership model: every row traces back to cases.user_id = auth.uid(),
-- either directly or via document_id -> documents.case_id -> cases.user_id.
-- reference_items is the one shared, non-user-scoped table (curated demo data).

-- ============================================================
-- cases
-- ============================================================
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled case',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index cases_user_id_idx on public.cases (user_id);

alter table public.cases enable row level security;

create policy "cases_select_own" on public.cases
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "cases_insert_own" on public.cases
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "cases_update_own" on public.cases
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "cases_delete_own" on public.cases
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================
-- documents
-- One uploaded file (hospital estimate/bill/prescription/quotation/
-- insurance policy/approval) per row. storage_path points at the private
-- Storage object; the original file and its extracted text are kept
-- separate on purpose — this table is metadata + pointer only.
-- ============================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  storage_path text,
  doc_type text check (
    doc_type in (
      'estimate', 'bill', 'prescription', 'quotation',
      'policy', 'approval', 'unknown'
    )
  ),
  original_filename text not null,
  mime_type text,
  page_count integer,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index documents_case_id_idx on public.documents (case_id);

alter table public.documents enable row level security;

create policy "documents_select_own" on public.documents
  for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "documents_insert_own" on public.documents
  for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "documents_update_own" on public.documents
  for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "documents_delete_own" on public.documents
  for delete to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- document_pages
-- Extracted text per page, stored separately from the original file.
-- This is what later feeds both the audit engine (via extracted_items)
-- and policy Q&A (via full-text search over content), and is what
-- findings cite back to for page-level evidence.
-- ============================================================
create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  page_number integer not null,
  content text,
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);

create index document_pages_document_id_idx on public.document_pages (document_id);

alter table public.document_pages enable row level security;

create policy "document_pages_select_own" on public.document_pages
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = document_pages.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "document_pages_insert_own" on public.document_pages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = document_pages.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "document_pages_update_own" on public.document_pages
  for update to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = document_pages.document_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = document_pages.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "document_pages_delete_own" on public.document_pages
  for delete to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = document_pages.document_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- extracted_items
-- Structured line items (medicines/procedures/tests/consumables/charges)
-- pulled from a hospital document. Feeds the audit engine.
-- ============================================================
create table public.extracted_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  item_type text check (
    item_type in ('medicine', 'procedure', 'test', 'consumable', 'charge', 'misc')
  ),
  name text not null,
  normalized_name text,
  quantity numeric,
  unit_price numeric,
  total_price numeric,
  source_page integer,
  raw_text text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

create index extracted_items_document_id_idx on public.extracted_items (document_id);

alter table public.extracted_items enable row level security;

create policy "extracted_items_select_own" on public.extracted_items
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = extracted_items.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "extracted_items_insert_own" on public.extracted_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = extracted_items.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "extracted_items_update_own" on public.extracted_items
  for update to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = extracted_items.document_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = extracted_items.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "extracted_items_delete_own" on public.extracted_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = extracted_items.document_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- insurance_policies
-- One structured summary row per policy document. Kept separate from a
-- jsonb blob so the M7 estimate-vs-policy comparison can query real
-- columns instead of parsing json every time.
-- ============================================================
create table public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  sum_insured numeric,
  room_rent_limit numeric,
  icu_limit numeric,
  copay_percent numeric,
  deductible numeric,
  waiting_periods jsonb,
  sub_limits jsonb,
  exclusions jsonb,
  consumables_covered boolean,
  other_conditions jsonb,
  created_at timestamptz not null default now()
);

alter table public.insurance_policies enable row level security;

create policy "insurance_policies_select_own" on public.insurance_policies
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = insurance_policies.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "insurance_policies_insert_own" on public.insurance_policies
  for insert to authenticated
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = insurance_policies.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "insurance_policies_update_own" on public.insurance_policies
  for update to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = insurance_policies.document_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = insurance_policies.document_id and c.user_id = (select auth.uid())
    )
  );

create policy "insurance_policies_delete_own" on public.insurance_policies
  for delete to authenticated
  using (
    exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.id = insurance_policies.document_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- reference_items
-- Curated, shared reference dataset (medicine/procedure/test/consumable
-- prices). Not user-scoped: every authenticated user can read it, only
-- service_role can write it (RLS has no insert/update/delete policy for
-- `authenticated`, so those are denied by default).
-- ============================================================
create table public.reference_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('medicine', 'procedure', 'test', 'consumable')
  ),
  name text not null,
  normalized_name text not null,
  reference_price numeric not null,
  unit text,
  source_name text not null,
  source_url text,
  effective_date date,
  retrieved_at timestamptz,
  is_demo_data boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index reference_items_normalized_name_idx on public.reference_items (normalized_name);

alter table public.reference_items enable row level security;

create policy "reference_items_select_all" on public.reference_items
  for select to authenticated
  using (true);

-- ============================================================
-- audit_findings
-- ============================================================
create table public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  document_id uuid references public.documents (id) on delete cascade,
  finding_type text check (
    finding_type in (
      'price', 'quantity', 'duplicate', 'package_overlap',
      'unexplained', 'medicine_savings', 'coverage_gap'
    )
  ),
  title text not null,
  description text,
  evidence jsonb,
  confidence text check (confidence in ('high', 'medium', 'low')),
  related_item_id uuid references public.extracted_items (id) on delete set null,
  created_at timestamptz not null default now()
);

create index audit_findings_case_id_idx on public.audit_findings (case_id);
create index audit_findings_document_id_idx on public.audit_findings (document_id);

alter table public.audit_findings enable row level security;

create policy "audit_findings_select_own" on public.audit_findings
  for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = audit_findings.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "audit_findings_insert_own" on public.audit_findings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = audit_findings.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "audit_findings_update_own" on public.audit_findings
  for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = audit_findings.case_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = audit_findings.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "audit_findings_delete_own" on public.audit_findings
  for delete to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = audit_findings.case_id and c.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- questions
-- ============================================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  finding_id uuid references public.audit_findings (id) on delete cascade,
  question_text text not null,
  created_at timestamptz not null default now()
);

create index questions_case_id_idx on public.questions (case_id);

alter table public.questions enable row level security;

create policy "questions_select_own" on public.questions
  for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = questions.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "questions_insert_own" on public.questions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = questions.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "questions_update_own" on public.questions
  for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = questions.case_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = questions.case_id and c.user_id = (select auth.uid())
    )
  );

create policy "questions_delete_own" on public.questions
  for delete to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = questions.case_id and c.user_id = (select auth.uid())
    )
  );
