-- Add equipped_badges column to profiles for the user-chosen badge loadout
-- shown on their profile dashboard and when others view their profile preview.

alter table public.profiles
  add column if not exists equipped_badges text[] not null default '{}'::text[];
