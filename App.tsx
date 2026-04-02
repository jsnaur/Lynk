import { useEffect, useState } from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import AuthScreen from './app/screens/auth/AuthScreen';
import HomeFeedScreen from './app/screens/main/HomeFeedScreen';
import ProfileDashboardScreen from './app/screens/main/ProfileDashboardScreen';
import { supabase } from './app/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { MainTab } from './app/components/BottomNav';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>('Feed');

  useEffect(() => {
    // 1. Fetch the initial session on startup
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session error cleared:', error.message);
        // If the refresh token is invalid, force a sign-out to clear AsyncStorage
        supabase.auth.signOut();
      } else {
        setSession(session);
      }
      setIsInitializing(false);
    });

    // 2. Listen for authentication state changes continuously
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
        }
      }
    );

    // 3. Manage automatic token refreshing based on app state safely
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    // 4. Cleanup subscriptions to prevent memory leaks
    return () => {
      authSubscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  // Show a loading indicator while we check the local storage for a token
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1F' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Auth Guard: Route based on the active session
  if (session && session.user) {
    const handleMainTabPress = (tab: MainTab) => {
      if (tab === 'Profile' || tab === 'Feed') {
        setActiveTab(tab);
      }
    };

    if (activeTab === 'Profile') {
      return <ProfileDashboardScreen onTabPress={handleMainTabPress} />;
    }

    return <HomeFeedScreen onTabPress={handleMainTabPress} />;
  }
  
  // Renders the Auth screen when no session exists
  return <AuthScreen />;
}