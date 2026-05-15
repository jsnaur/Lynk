-- ============================================================
-- FIX QUEST RESOLUTION XP DISCREPANCY
--
-- The app awards XP through resolve_group_quest, which credited
-- a completed participant ONLY quests.bonus_xp. But every screen
-- (QuestScreen, QuestDetails, the resolution reward card, and the
-- PostScreen publish dialog) shows the quest's total XP as
-- GUILD_BASE_XP (50) + bonus_xp. A quest advertised as "150 XP"
-- therefore credited the accepter just 100 XP -- short by the
-- 50-point base every quest carries.
--
-- This migration redefines resolve_group_quest so a completed
-- accepter receives EXACTLY the XP the UI promised:
--     total_xp += (GUILD_BASE_XP + bonus_xp)
--
-- GUILD_BASE_XP mirrors the client constant in
-- app/services/AppraiserService.ts (GUILD_BASE_XP = 50).
--
-- Token payout logic is unchanged -- tokens were already exact.
-- Idempotent. Safe to re-run.
-- ============================================================

create or replace function public.resolve_group_quest(p_quest_id uuid, p_resolutions jsonb)
returns boolean as $$
declare
  -- Keep in sync with GUILD_BASE_XP in app/services/AppraiserService.ts
  c_base_xp constant integer := 50;

  v_poster_id uuid;
  v_status text;
  v_bounty integer;
  v_bonus_xp integer;
  v_max_p integer;
  v_award_xp integer;          -- base + bonus = the XP the UI displays
  v_res_item jsonb;
  v_target_user uuid;
  v_res_status text;
  v_rating text;
  v_per_slot integer;
  v_completed_count integer := 0;
  v_refund integer := 0;
begin
  select user_id, status, token_bounty, bonus_xp, max_participants
    from public.quests
   where id = p_quest_id
   for update
    into v_poster_id, v_status, v_bounty, v_bonus_xp, v_max_p;

  if v_poster_id != auth.uid() then raise exception 'Not authorized'; end if;
  if v_status = 'completed' then raise exception 'Quest is already completed'; end if;

  v_per_slot := v_bounty / greatest(v_max_p, 1);

  -- The exact total XP shown to the accepter for this quest.
  v_award_xp := c_base_xp + coalesce(v_bonus_xp, 0);

  for v_res_item in select value from jsonb_array_elements(p_resolutions) as t(value) loop
    v_target_user := (v_res_item->>'user_id')::uuid;
    v_res_status  := v_res_item->>'status';
    v_rating      := v_res_item->>'rating';

    update public.quest_participants
       set status = v_res_status, individual_rating = v_rating
     where quest_id = p_quest_id and user_id = v_target_user and status = 'accepted';

    if v_res_status = 'completed' then
      update public.profiles
         set token_balance = token_balance + v_per_slot,
             total_xp      = total_xp + v_award_xp
       where id = v_target_user;
      v_completed_count := v_completed_count + 1;
    end if;
  end loop;

  v_refund := v_bounty - (v_completed_count * v_per_slot);
  if v_refund > 0 then
    update public.profiles set token_balance = token_balance + v_refund where id = v_poster_id;
  end if;

  update public.quests set status = 'completed' where id = p_quest_id;
  return true;
end;
$$ language plpgsql security definer;

grant execute on function public.resolve_group_quest(uuid, jsonb) to authenticated;
