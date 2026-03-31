import { useEffect } from 'react';
import { AppState } from 'react-native';
import AuthScreen from './app/screens/auth/AuthScreen';
import { supabase } from './app/lib/supabase';

export default function App() {
  useEffect(() => {
    // Manage automatic token refreshing based on app state safely
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    // Cleanup subscription to prevent memory leaks
    return () => {
      subscription.remove();
    };
  }, []);

  return <AuthScreen />;
}