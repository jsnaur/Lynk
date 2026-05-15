-- ============================================================
-- QUEST ACCEPTED NOTIFICATIONS
-- Notify the quest poster whenever a participant's status
-- becomes 'accepted' — covers both auto-accept (INSERT) and
-- manual poster-accept (UPDATE). Idempotent. Safe to re-run.
-- ============================================================

create or replace function public._tg_notify_quest_accepted()
returns trigger
language plpgsql
security definer
as $$
declare
  v_quest_user_id uuid;
  v_quest_title   text;
  v_accepter_name text;
begin
  if (TG_OP = 'INSERT' and new.status = 'accepted') or
     (TG_OP = 'UPDATE' and old.status is distinct from new.status and new.status = 'accepted') then

    select user_id, title
      into v_quest_user_id, v_quest_title
      from public.quests
     where id = new.quest_id;

    -- Skip self-accept (poster applied to their own quest edge-case)
    if v_quest_user_id is null or v_quest_user_id = new.user_id then
      return new;
    end if;

    select coalesce(display_name, 'Someone')
      into v_accepter_name
      from public.profiles
     where id = new.user_id;

    insert into public.notifications (
      recipient_id,
      type,
      title,
      description,
      reference_id,
      is_read
    ) values (
      v_quest_user_id,
      'quest_accepted',
      'Quest Accepted!',
      v_accepter_name || ' has joined your quest "' || coalesce(v_quest_title, 'Untitled') || '".',
      new.quest_id,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_quest_accepted on public.quest_participants;

create trigger trg_notify_quest_accepted
  after insert or update of status on public.quest_participants
  for each row
  execute function public._tg_notify_quest_accepted();
