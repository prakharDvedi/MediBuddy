-- Keep unit uncertainty separate from price findings. A missing or
-- incompatible sale unit must never be rendered as an overcharge comparison.
alter table public.audit_findings drop constraint if exists audit_findings_finding_type_check;

alter table public.audit_findings
  add constraint audit_findings_finding_type_check check (
    finding_type in (
      'price', 'quantity', 'duplicate', 'package_overlap',
      'unexplained', 'medicine_savings', 'coverage_gap', 'unit_unverified'
    )
  );
