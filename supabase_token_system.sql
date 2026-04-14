-- Token System Migration for Lynk
-- Safe to run multiple times in Supabase SQL Editor.

-- 1) Add persistent token balance to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS token_balance INTEGER NOT NULL DEFAULT 52;

-- Keep data valid for future writes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_token_balance_non_negative'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_token_balance_non_negative CHECK (token_balance >= 0);
  END IF;
END
$$;

-- 2) Atomic spend function
-- Returns new balance on success, NULL on insufficient balance or missing profile
CREATE OR REPLACE FUNCTION public.spend_tokens(spend_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF spend_amount IS NULL OR spend_amount <= 0 THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
  SET token_balance = token_balance - spend_amount
  WHERE id = auth.uid()
    AND token_balance >= spend_amount
  RETURNING token_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

-- 3) Atomic earn function
-- Returns new balance on success, NULL on missing profile or invalid amount
CREATE OR REPLACE FUNCTION public.earn_tokens(earn_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF earn_amount IS NULL OR earn_amount <= 0 THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
  SET token_balance = token_balance + earn_amount
  WHERE id = auth.uid()
  RETURNING token_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

-- 4) Allow app users to call token RPCs
GRANT EXECUTE ON FUNCTION public.spend_tokens(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_tokens(INTEGER) TO authenticated;
