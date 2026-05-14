-- ============================================================
-- BADGE: reputation_master_of_disguise
--   Criteria: own 25 unique PURCHASED avatar items.
--
--   user_inventory contains both free/setup items (seeded on
--   signup) and purchased items, so we must exclude the
--   default-owned ids. This list mirrors DEFAULT_OWNED_IDS in
--   app/constants/accessories.ts — every item with
--   price === 0 OR isSetup === true. Keep these in sync.
-- ============================================================

-- 0. Canonical list of "free / default-owned" item ids.
--    Wrapped in a function so the dispatcher and cleanup share
--    one source of truth.
create or replace function public._default_owned_item_ids()
returns text[]
language sql
immutable
as $$
  select array[
    -- price === 0 ------------------------------------------------
    'body-masc-a','body-masc-b','body-masc-c','body-masc-d',
    'body-fem-a','body-fem-b','body-fem-c','body-fem-d',
    'eyes-default','eyes-wide','eyes-closed',
    'mouth-neutral','mouth-oop',
    'bot-cit-m','bot-pjs-m',
    'top-cit-m','top-pjs-m',
    'bot-pjs-f','bot-gala-f','bot-cituniformf-f',
    'top-pjs-f','top-gala-f','top-cituniformf-f',
    'hairb-flat-m','hairf-chill-m',
    'bg-bluegray','right-laptop','acc-id',
    -- isSetup === true (priced but still default-owned) ----------
    'hairb-mullet-m','hairf-mac-m',
    'hairb-calm-f','hairb-pigtails-f',
    'hairf-mid-f','hairf-natural-f'
  ]::text[];
$$;

-- 1. Replace the reputation dispatcher with the real rule.
create or replace function public.award_reputation_badges(p_user uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_purchased_items int;
begin
  select count(distinct item_id) into v_purchased_items
    from public.user_inventory
   where user_id = p_user
     and not (item_id = any(public._default_owned_item_ids()));

  -- BADGE: reputation_master_of_disguise — 25 unique purchased items
  if v_purchased_items >= 25 then
    perform public.award_badge(p_user, 'reputation_master_of_disguise');
  end if;
end;
$$;

-- 2. Trigger: re-evaluate reputation badges every time a purchase lands.
create or replace function public._tg_award_reputation_on_inventory()
returns trigger language plpgsql as $$
begin
  perform public.award_reputation_badges(new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_award_reputation_on_inventory on public.user_inventory;

create trigger trg_award_reputation_on_inventory
  after insert on public.user_inventory
  for each row
  execute function public._tg_award_reputation_on_inventory();

-- 3. Revoke the badge from any user who currently holds it without
--    meeting the 25 purchased-item threshold (stale rows from
--    earlier logic / manual seeding / the bug where free items
--    were counted).
delete from public.user_badges ub
 where ub.badge_id = 'reputation_master_of_disguise'
   and (
     select count(distinct item_id)
       from public.user_inventory ui
      where ui.user_id = ub.user_id
        and not (ui.item_id = any(public._default_owned_item_ids()))
   ) < 25;

-- 4. Strip the badge out of any equipped_badges loadout where the user
--    no longer owns it. profiles.equipped_badges is stored as jsonb in
--    this database, so rebuild the array minus the revoked id.
update public.profiles p
   set equipped_badges = (
     select coalesce(jsonb_agg(elem), '[]'::jsonb)
       from jsonb_array_elements_text(p.equipped_badges) elem
      where elem <> 'reputation_master_of_disguise'
   )
 where p.equipped_badges ? 'reputation_master_of_disguise'
   and not exists (
     select 1 from public.user_badges ub
      where ub.user_id = p.id
        and ub.badge_id = 'reputation_master_of_disguise'
   );
