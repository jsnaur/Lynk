import React, { useState, useEffect, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreenA';
import ProfileSetupScreenB from '../screens/auth/ProfileSetupScreenB';
import ForgotPass3 from '../screens/auth/ForgotPass3';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const checkSessionAndProfile = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentSession.user.id)
          .single();
        setIsNewUser(!data?.display_name);
      } catch {
        setIsNewUser(true);
      }
    } else {
      setIsNewUser(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (__DEV__) {
        await supabase.auth.signOut();
      }
      const { data: { session } } = await supabase.auth.getSession();
      await checkSessionAndProfile(session);
      setSession(session);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // verifyOtp with type:'recovery' fires this event — switch to the reset screen
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setLoading(false);
        return;
      }
      await checkSessionAndProfile(session);
      setSession(session);
      setLoading(false);
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setIsNewUser(false);
        setIsPasswordRecovery(false);
      }
    });

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkSessionAndProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.favor} />
      </View>
    );
  }

  // Password recovery: show the reset screen regardless of auth state
  if (isPasswordRecovery) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen
          name="PasswordReset"
          component={ForgotPass3}
          initialParams={{ isRecoveryMode: true }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      {session && session.user ? (
        isNewUser ? (
          <>
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="ProfileSetupB" component={ProfileSetupScreenB} />
            <Stack.Screen name="Main" component={MainNavigator} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="ProfileSetupB" component={ProfileSetupScreenB} />
          </>
        )
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
