-- ============================================================
-- SPLIT QUEST BADGE RULES BY EVENT
-- The previous unified dispatcher fired both posting and completion
-- checks on every quest event. When an accepter completed their first
-- quest, the post-side rules ran again and could re-award (or notify
-- on) "The Initiator" — a posting badge that should never be touched
-- by a completion event. This migration splits the dispatcher so each
-- trigger only evaluates the rules tied to its event.
--
-- Idempotent. Safe to re-run.
-- ============================================================

-- --- post-side rules: ONLY badges earned by posting a quest --------
create or replace function public.award_quest_post_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_posted_count int;
begin
  select count(*) into v_posted_count
    from public.quests
   where user_id = p_user;

  -- BADGE: quest_initiator — first quest posted
  if v_posted_count >= 1 then
    perform public.award_badge(p_user, 'quest_initiator');
  end if;

  -- BADGE: quest_prolific_patron — 10 quests posted
  if v_posted_count >= 10 then
    perform public.award_badge(p_user, 'quest_prolific_patron');
  end if;
end;
$$;

-- --- completion-side rules: ONLY badges earned by completing -------
create or replace function public.award_quest_complete_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_completed_count int;
begin
  select count(*) into v_completed_count
    from public.quest_participants
   where user_id = p_user and status = 'completed';

  -- BADGE: quest_adventurer — first quest completed
  if v_completed_count >= 1 then
    perform public.award_badge(p_user, 'quest_adventurer');
  end if;
end;
$$;

-- --- thin wrappers ------------------------------------------------
create or replace function public._tg_award_quest_on_post()
returns trigger language plpgsql as $$
begin
  perform public.award_quest_post_badges(new.user_id);
  return new;
end;
$$;

create or replace function public._tg_award_quest_on_complete()
returns trigger language plpgsql as $$
begin
  perform public.award_quest_complete_badges(new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_award_quest_on_post     on public.quests;
drop trigger if exists trg_award_quest_on_complete on public.quest_participants;

create trigger trg_award_quest_on_post
  after insert on public.quests
  for each row
  execute function public._tg_award_quest_on_post();

create trigger trg_award_quest_on_complete
  after update of status on public.quest_participants
  for each row
  when (old.status is distinct from new.status and new.status = 'completed')
  execute function public._tg_award_quest_on_complete();

-- The unified dispatcher is no longer the one referenced by triggers.
-- Keep it around as a no-op wrapper that routes to both event paths so
-- any explicit callers in older code still behave sensibly.
create or replace function public.award_quest_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform public.award_quest_post_badges(p_user);
  perform public.award_quest_complete_badges(p_user);
end;
$$;
