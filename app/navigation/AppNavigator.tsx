import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import { supabase } from '../lib/supabase'; 
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check if the user has completed their profile setup
    const checkSessionAndProfile = async (currentSession: Session | null) => {
      if (currentSession) {
        const displayName = await AsyncStorage.getItem("@lynk/profileDisplayName");
        // If there's no display name in storage, they are considered a new user
        setIsNewUser(!displayName);
      }
    };

    const initializeAuth = async () => {
      if (__DEV__) {
        // Force log out on app start in development
        await supabase.auth.signOut();
        await AsyncStorage.removeItem("@lynk/profileDisplayName");
      }

      // 1. Check current session on mount
      const { data: { session } } = await supabase.auth.getSession();
      await checkSessionAndProfile(session);
      
      setSession(session);
      setLoading(false);
    };

    initializeAuth();

    // 2. Listen for auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await checkSessionAndProfile(session);
      
      setSession(session);
      setLoading(false);
      
      // If a refresh token error occurs, Supabase usually triggers SIGNED_OUT
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setIsNewUser(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session && session.user ? (
        // Swap initial route dynamically based on whether profile is completed
        isNewUser ? (
          <>
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Main" component={MainNavigator} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </>
        )
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;