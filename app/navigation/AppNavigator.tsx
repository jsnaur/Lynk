import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { supabase } from '../lib/supabase'; //
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      
      // If a refresh token error occurs, Supabase usually triggers SIGNED_OUT
      if (_event === 'SIGNED_OUT') {
        setSession(null);
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
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;