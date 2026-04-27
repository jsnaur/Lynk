import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTokenBalance } from '../contexts/TokenContext';

export type ClaimResult = {
  cycle_day: number;
  tokens_awarded: number;
  xp_awarded: number;
};

type ClaimError = 'already_claimed' | 'not_authenticated' | 'rpc_error' | 'parse_error';

export function useDailyReward() {
  const { refreshBalance } = useTokenBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowSheet, setShouldShowSheet] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState<ClaimResult | null>(null);

  const checkDailyReward = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('last_reward_claimed_at, current_login_streak')
        .eq('id', user.id)
        .single();

      if (error || !data) return;

      const lastClaim = data.last_reward_claimed_at;
      const streak = data.current_login_streak ?? 0;

      // UTC Date Calculation
      const now = new Date();
      const todayUTC = now.toISOString().slice(0, 10);
      const lastClaimUTC = lastClaim ? new Date(lastClaim).toISOString().slice(0, 10) : null;
      
      const hasClaimedToday = lastClaimUTC === todayUTC;
      
      // Calculate which day of the 1-7 cycle to show
      // If claimed today: show current day in "claimed" state
      // If not claimed: if streak was yesterday, show streak+1. If older, show day 1.
      let displayDay = 1;
      if (hasClaimedToday) {
        displayDay = ((streak - 1) % 7) + 1;
      } else {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayUTC = yesterday.toISOString().slice(0, 10);
        
        if (lastClaimUTC === yesterdayUTC) {
          displayDay = (streak % 7) + 1;
        } else {
          displayDay = 1;
        }
      }

      setCurrentDay(displayDay);
      setAlreadyClaimed(hasClaimedToday);
      setShouldShowSheet(!hasClaimedToday);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const claimReward = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward');
      
      if (error) {
        if (error.message.includes('already claimed')) setAlreadyClaimed(true);
        return null;
      }

      const result: ClaimResult = {
        cycle_day: data.cycle_day,
        tokens_awarded: data.tokens_awarded,
        xp_awarded: data.xp_awarded,
      };

      setLastClaimResult(result);
      setAlreadyClaimed(true);
      // We don't call earnTokens here because TokenContext.tsx realtime listener 
      // will pick up the DB change from the RPC update automatically.
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    shouldShowSheet,
    currentDay,
    alreadyClaimed,
    lastClaimResult,
    checkDailyReward,
    claimReward,
    dismissSheet: () => setShouldShowSheet(false),
  };
}