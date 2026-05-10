import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type NotificationPreferences = {
  questActivity: boolean;
  comments: boolean;
  ratings: boolean;
  xpLevelUp: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  questActivity: true,
  comments: true,
  ratings: true,
  xpLevelUp: true,
};

const PREF_TYPE_MAP: Record<keyof NotificationPreferences, string[]> = {
  questActivity: ['quest_applied', 'applicant_accepted', 'quest_started', 'quest_completed', 'quest_dropped', 'high_bounty_quest'],
  comments: ['new_comment', 'new_reply'],
  ratings: ['quest_rated'],
  xpLevelUp: ['daily_reward', 'badge_awarded', 'xp_levelup'],
};

type NotificationPrefsContextValue = {
  prefs: NotificationPreferences;
  setPrefs: (updates: Partial<NotificationPreferences>) => void;
  isTypeAllowed: (type: string) => boolean;
};

const NotificationPrefsContext = createContext<NotificationPrefsContextValue | undefined>(undefined);

export function NotificationPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadPrefs = async (uid: string) => {
      try {
        const raw = await AsyncStorage.getItem(`@lynk/notifPrefs/${uid}`);
        if (raw) {
          setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
        } else {
          setPrefsState(DEFAULT_PREFS);
        }
      } catch {}
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        userIdRef.current = user.id;
        loadPrefs(user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      userIdRef.current = uid;
      if (uid) {
        await loadPrefs(uid);
      } else {
        setPrefsState(DEFAULT_PREFS);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const setPrefs = useCallback((updates: Partial<NotificationPreferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...updates };
      const uid = userIdRef.current;
      if (uid) {
        AsyncStorage.setItem(`@lynk/notifPrefs/${uid}`, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  }, []);

  const isTypeAllowed = useCallback((type: string): boolean => {
    for (const [key, types] of Object.entries(PREF_TYPE_MAP)) {
      if (types.includes(type)) {
        return prefs[key as keyof NotificationPreferences];
      }
    }
    return true;
  }, [prefs]);

  const value = useMemo(
    () => ({ prefs, setPrefs, isTypeAllowed }),
    [prefs, setPrefs, isTypeAllowed],
  );

  return (
    <NotificationPrefsContext.Provider value={value}>
      {children}
    </NotificationPrefsContext.Provider>
  );
}

export function useNotificationPreferences() {
  const ctx = useContext(NotificationPrefsContext);
  if (!ctx) throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
  return ctx;
}
