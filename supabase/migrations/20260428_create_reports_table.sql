create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  reason text not null,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_content_type_check check (content_type in ('comment', 'quest')),
  constraint reports_status_check check (status in ('pending', 'reviewed', 'resolved', 'dismissed'))
);

create index if not exists reports_content_idx
  on public.reports (content_type, content_id);

create index if not exists reports_reporter_idx
  on public.reports (reporter_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
  on public.reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own
  on public.reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

create or replace function public.set_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_reports_updated_at();
