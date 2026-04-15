import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type TokenContextValue = {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  spendTokens: (amount: number) => Promise<boolean>;
  earnTokens: (amount: number) => Promise<boolean>;
};

const GUEST_TOKENS = 0;

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenBalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(GUEST_TOKENS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBalance(GUEST_TOKENS);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Unable to load token balance.', error.message);
        return;
      }

      setBalance(Math.max(0, data?.token_balance ?? 0));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBalance();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void refreshBalance();
    });

    // Supabase Realtime Listener for immediate token updates across the app
    let channel: any;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase.channel('token_context_changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new && payload.new.token_balance !== undefined) {
              setBalance(Math.max(0, payload.new.token_balance));
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshBalance]);

  const spendTokens = useCallback(async (amount: number) => {
    if (amount <= 0) return true;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('spend_tokens', {
      spend_amount: amount,
    });

    if (error) {
      console.warn('Unable to spend tokens.', error.message);
      return false;
    }

    if (typeof data !== 'number') {
      return false;
    }

    setBalance(Math.max(0, data));
    return true;
  }, []);

  const earnTokens = useCallback(async (amount: number) => {
    if (amount <= 0) return true;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('earn_tokens', {
      earn_amount: amount,
    });

    if (error) {
      console.warn('Unable to earn tokens.', error.message);
      return false;
    }

    if (typeof data !== 'number') {
      return false;
    }

    setBalance(Math.max(0, data));
    return true;
  }, []);

  const value = useMemo(
    () => ({
      balance,
      isLoading,
      refreshBalance,
      spendTokens,
      earnTokens,
    }),
    [balance, isLoading, refreshBalance, spendTokens, earnTokens],
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokenBalance() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenBalance must be used within a TokenBalanceProvider.');
  }

  return context;
}