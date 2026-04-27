alter table if exists public.comments
  add column if not exists moderation_status text not null default 'pending';

alter table if exists public.comments
  add column if not exists moderation_reason text;

alter table if exists public.comments
  add column if not exists moderation_confidence double precision;

alter table if exists public.comments
  add column if not exists moderated_at timestamptz;

alter table if exists public.comments
  drop constraint if exists comments_moderation_status_check;

alter table if exists public.comments
  add constraint comments_moderation_status_check
  check (moderation_status in ('pending', 'under_review', 'approved', 'flagged', 'error'));

create index if not exists comments_moderation_status_idx
  on public.comments (moderation_status);

update public.comments
set moderation_status = coalesce(moderation_status, 'approved')
where moderation_status is null;
