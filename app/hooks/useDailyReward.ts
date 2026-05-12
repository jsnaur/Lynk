import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTokenBalance } from '../contexts/TokenContext';
import appSoundManager, { AppSoundCategory } from '../lib/SoundManager';

export type ClaimResult = {
  cycle_day: number;
  tokens_awarded: number;
  xp_awarded: number;
};

const DISMISSED_KEY = 'dailyReward.dismissedDateUTC';

const getTodayUTC = () => new Date().toISOString().slice(0, 10);

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

      const todayUTC = getTodayUTC();
      const lastClaimUTC = lastClaim ? new Date(lastClaim).toISOString().slice(0, 10) : null;
      const hasClaimedToday = lastClaimUTC === todayUTC;

      // Compute which 1-7 cycle day to display
      let displayDay = 1;
      if (hasClaimedToday) {
        displayDay = ((streak - 1) % 7) + 1;
      } else {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayUTC = yesterday.toISOString().slice(0, 10);
        displayDay = lastClaimUTC === yesterdayUTC ? (streak % 7) + 1 : 1;
      }

      // Show once per UTC day: suppress if user already dismissed/claimed today
      const dismissedDate = await AsyncStorage.getItem(`${DISMISSED_KEY}.${user.id}`);
      const dismissedToday = dismissedDate === todayUTC;

      setCurrentDay(displayDay);
      setAlreadyClaimed(hasClaimedToday);
      setShouldShowSheet(!hasClaimedToday && !dismissedToday);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markDismissedToday = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await AsyncStorage.setItem(`${DISMISSED_KEY}.${user.id}`, getTodayUTC());
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
      await markDismissedToday();
      // Play a swelling chime on actual successful claim
      try {
        void appSoundManager.play(AppSoundCategory.DailyReward, { force: true });
      } catch (e) {
        // noop
      }
      // TokenContext realtime listener picks up the DB update.
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [markDismissedToday]);

  const dismissSheet = useCallback(() => {
    setShouldShowSheet(false);
    void markDismissedToday();
  }, [markDismissedToday]);

  // Manual entry point — bypasses the auto-popup suppression so the user can
  // tap a button and reopen the sheet to claim later in the day.
  const openSheet = useCallback(async () => {
    await checkDailyReward();
    setShouldShowSheet(true);
  }, [checkDailyReward]);

  return {
    isLoading,
    shouldShowSheet,
    currentDay,
    alreadyClaimed,
    lastClaimResult,
    checkDailyReward,
    claimReward,
    dismissSheet,
    openSheet,
  };
}