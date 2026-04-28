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

-- Normalize any notification rows that would fail the stricter type check.
update public.notifications
set type = 'moderation_warning'
where type is null
   or type not in (
     'quest_applied',
     'applicant_accepted',
     'quest_started',
     'quest_completed',
     'high_bounty_quest',
     'new_comment',
     'moderation_warning'
   );

alter table if exists public.notifications
  drop constraint if exists notifications_type_check;

alter table if exists public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'quest_applied',
      'applicant_accepted',
      'quest_started',
      'quest_completed',
      'high_bounty_quest',
      'new_comment',
      'moderation_warning'
    )
  );
