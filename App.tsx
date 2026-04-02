import { useEffect, useState } from 'react';
import { AppState, View, ActivityIndicator, Text } from 'react-native';
import AuthScreen from './app/screens/auth/AuthScreen';
import HomeFeedScreen from './app/screens/main/HomeFeedScreen';
import ProfileDashboardScreen from './app/screens/main/ProfileDashboardScreen';
import BottomNav, { MainTab } from './app/components/BottomNav';
import { supabase } from './app/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Reusable placeholder for tabs that are under construction
const PlaceholderScreen = ({ tab, onTabPress }: { tab: MainTab; onTabPress: (t: MainTab) => void }) => (
  <View style={{ flex: 1, backgroundColor: '#1A1A1F' }}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' }}>{tab}</Text>
      <Text style={{ color: '#8A8E9B', fontSize: 16, marginTop: 8 }}>Coming Soon</Text>
    </View>
    <BottomNav activeTab={tab} onTabPress={onTabPress} />
  </View>
);

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
      // Allow state updates for all tabs so navigation works fluidly
      setActiveTab(tab);
    };

    // Scalable route switching mechanism
    switch (activeTab) {
      case 'Profile':
        return <ProfileDashboardScreen onTabPress={handleMainTabPress} />;
      case 'Feed':
        return <HomeFeedScreen onTabPress={handleMainTabPress} />;
      case 'Quests':
      case 'Post':
      case 'Shop':
      default:
        // Graceful fallback for incomplete tabs
        return <PlaceholderScreen tab={activeTab} onTabPress={handleMainTabPress} />;
    }
  }
  
  // Renders the Auth screen when no session exists
  return <AuthScreen />;
}