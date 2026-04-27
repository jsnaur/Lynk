-- First, standardize the old type name to the new standard
update public.notifications
set type = 'moderator_warning'
where type = 'moderation_warning';

-- Set any NULL or invalid type values to a safe default
update public.notifications
set type = 'new_comment'
where type is null or type not in (
  'quest_applied',
  'applicant_accepted',
  'quest_started',
  'quest_completed',
  'high_bounty_quest',
  'new_comment',
  'moderator_warning'
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
      'moderator_warning'
    )
  );