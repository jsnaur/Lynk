update public.notifications
set type = 'moderator_warning'
where type = 'moderation_warning';

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