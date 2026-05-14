-- ============================================================
-- BADGE TRIGGERS — single source of truth
-- Categories: quest | reputation | special
-- Convention: every awarded badge is preceded by:
--   -- BADGE: <id> — <criteria>
-- Idempotent. Safe to re-run.
-- ============================================================

-- ============================================================
-- 1. DROP LEGACY SCATTERED TRIGGERS / FUNCTIONS
--    These are being consolidated into the dispatchers in step 4.
-- ============================================================
drop trigger  if exists award_quest_post_badges     on public.quests;
drop trigger  if exists award_quest_complete_badges on public.quest_participants;
drop function if exists public.check_quest_post_badges();
drop function if exists public.check_quest_complete_badges();

-- ============================================================
-- 2. DROP MACHINERY ONLY USED BY REMOVED BADGES
--    accepted_at / completed_at existed solely for:
--      - quest_swift_resolution  (now removed)
--      - quest_marathoner        (now removed)
-- ============================================================
drop trigger  if exists qp_timestamps on public.quest_participants;
drop function if exists public.track_qp_timestamps();
alter table public.quest_participants drop column if exists accepted_at;
alter table public.quest_participants drop column if exists completed_at;

-- ============================================================
-- 3. CATEGORY RENAME: milestone -> reputation
--    The client app uses 'reputation'; the DB previously used 'milestone'.
-- ============================================================
alter table public.badges drop constraint if exists badges_category_check;
update public.badges set category = 'reputation' where category = 'milestone';
alter table public.badges
  add constraint badges_category_check
  check (category in ('quest', 'reputation', 'special'));

-- ============================================================
-- 4. REMOVE RETIRED QUEST BADGES
--    Keeping only: quest_initiator, quest_adventurer, quest_prolific_patron.
--    user_badges rows clean up via ON DELETE CASCADE.
-- ============================================================
delete from public.badges where id in (
  'quest_seasoned_mercenary',
  'quest_flawless_executor',
  'quest_swift_resolution',
  'quest_jack_of_all_trades',
  'quest_marathoner'
);

-- ============================================================
-- 5. DISPATCHERS — one per category, contains every rule
--    Reuses existing public.award_badge(p_user, p_badge_id).
-- ============================================================

-- --- quest -----------------------------------------------------
create or replace function public.award_quest_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_posted_count    int;
  v_completed_count int;
begin
  select count(*) into v_posted_count
    from public.quests
   where user_id = p_user;

  select count(*) into v_completed_count
    from public.quest_participants
   where user_id = p_user and status = 'completed';

  -- BADGE: quest_initiator — first quest posted
  if v_posted_count >= 1 then
    perform public.award_badge(p_user, 'quest_initiator');
  end if;

  -- BADGE: quest_prolific_patron — 10 quests posted
  if v_posted_count >= 10 then
    perform public.award_badge(p_user, 'quest_prolific_patron');
  end if;

  -- BADGE: quest_adventurer — first quest completed
  if v_completed_count >= 1 then
    perform public.award_badge(p_user, 'quest_adventurer');
  end if;
end;
$$;

-- --- reputation ------------------------------------------------
create or replace function public.award_reputation_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- TODO: reputation rules go here. Pattern:
  --   -- BADGE: <id> — <criteria>
  --   if <condition> then
  --     perform public.award_badge(p_user, '<id>');
  --   end if;
  return;
end;
$$;

-- --- special ---------------------------------------------------
-- Event-driven: not bound to a single table. Call explicitly from
-- an RPC or another trigger with p_event/p_payload describing the event.
create or replace function public.award_special_badges(
  p_user    uuid,
  p_event   text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  -- TODO: special / one-off / event badges. Pattern:
  --   if p_event = '<event_name>' then
  --     -- BADGE: <id> — <criteria>
  --     perform public.award_badge(p_user, '<id>');
  --   end if;
  return;
end;
$$;

-- ============================================================
-- 6. THIN TRIGGER WRAPPERS
--    Each table event routes to the right dispatcher.
-- ============================================================

create or replace function public._tg_award_quest_on_post()
returns trigger language plpgsql as $$
begin
  perform public.award_quest_badges(new.user_id);
  return new;
end;
$$;

create or replace function public._tg_award_quest_on_complete()
returns trigger language plpgsql as $$
begin
  perform public.award_quest_badges(new.user_id);
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

-- Reputation: no rules yet, so no trigger is wired. Uncomment and
-- bind to the appropriate table (e.g. comments) once rules exist:
--
-- create or replace function public._tg_award_reputation_on_comment()
-- returns trigger language plpgsql as $$
-- begin
--   perform public.award_reputation_badges(new.user_id);
--   return new;
-- end;
-- $$;
--
-- create trigger trg_award_reputation_on_comment
--   after insert on public.comments
--   for each row execute function public._tg_award_reputation_on_comment();
