-- ============================================================
-- QUEST RESOLUTION NOTIFICATIONS
-- Notify each participant the moment the poster marks them
-- completed or failed, so clients can react in real time
-- (badge count + chime in the home feed subscription).
-- Idempotent. Safe to re-run.
-- ============================================================

create or replace function public._tg_notify_quest_resolved()
returns trigger
language plpgsql
security definer
as $$
declare
  v_title text;
begin
  if old.status is distinct from new.status
     and new.status in ('completed', 'failed') then

    select title into v_title from public.quests where id = new.quest_id;

    insert into public.notifications (
      recipient_id,
      type,
      title,
      description,
      reference_id,
      is_read
    )
    values (
      new.user_id,
      'quest_resolved',
      case when new.status = 'completed' then 'Quest Completed' else 'Quest Resolved' end,
      case when new.status = 'completed'
           then 'Your quest "' || coalesce(v_title, 'a quest') || '" was marked complete. Rewards applied.'
           else 'Your participation in "' || coalesce(v_title, 'a quest') || '" has been resolved.'
      end,
      new.quest_id,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_quest_resolved on public.quest_participants;

create trigger trg_notify_quest_resolved
  after update of status on public.quest_participants
  for each row
  execute function public._tg_notify_quest_resolved();
