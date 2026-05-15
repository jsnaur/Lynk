import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreenA';
import ProfileSetupScreenB from '../screens/auth/ProfileSetupScreenB';
import ForgotPass3 from '../screens/auth/ForgotPass3';
import { supabase } from '../lib/supabase';
import appSoundManager from '../lib/SoundManager';
import { Session } from '@supabase/supabase-js';
import { Animated, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { createBaseStackScreenOptions } from './navigationMotion';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const shellOpacity = useRef(new Animated.Value(0)).current;

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
    Animated.timing(shellOpacity, {
      toValue: loading ? 0 : 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [loading, shellOpacity]);

  useEffect(() => {
    const initializeAuth = async () => {
      await appSoundManager.hydrateFromStorage();
      const { data: { session } } = await supabase.auth.getSession();
      await checkSessionAndProfile(session);
      setSession(session);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // verifyOtp with type:'recovery' fires this event — switch to the reset screen
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setLoading(false);
        return;
      }
      
      // Use setTimeout to avoid deadlocking the Supabase auth listener
      // when making database queries in checkSessionAndProfile
      setTimeout(async () => {
        await checkSessionAndProfile(session);
        setSession(session);
        setLoading(false);
        if (_event === 'SIGNED_OUT') {
          setSession(null);
          setIsNewUser(false);
          setIsPasswordRecovery(false);
        }
      }, 0);
    });

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkSessionAndProfile]);

  if (loading) {
    return (
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, opacity: shellOpacity }}>
        <ActivityIndicator size="large" color={COLORS.favor} />
      </Animated.View>
    );
  }

  // Password recovery: show the reset screen regardless of auth state
  if (isPasswordRecovery) {
    // We don't rely on supabase.auth.signOut() firing SIGNED_OUT to exit
    // recovery (on the recovery session it sometimes doesn't fire on RN).
    // The screen calls this directly when the user taps "Go to Login".
    const exitRecovery = async () => {
      try {
        supabase.auth.signOut().catch(() => {});
      } catch {
        // ignore — we still force-exit recovery below
      }
      setSession(null);
      setIsNewUser(false);
      setIsPasswordRecovery(false);
    };

    return (
      <Stack.Navigator
        screenOptions={createBaseStackScreenOptions(COLORS.bg)}
      >
        <Stack.Screen
          name="PasswordReset"
          initialParams={{ isRecoveryMode: true }}
        >
          {(props) => <ForgotPass3 {...props} onExitRecovery={exitRecovery} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={createBaseStackScreenOptions(COLORS.bg)}
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
