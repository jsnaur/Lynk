import React from 'react';
import { COLORS } from '../constants/colors';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreenA';
import ProfileSetupScreenB from '../screens/auth/ProfileSetupScreenB';
import ForgotPass1 from '../screens/auth/ForgotPass1';
import ForgotPass2 from '../screens/auth/ForgotPass2';
import ForgotPass3 from '../screens/auth/ForgotPass3';

export type AuthStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  ProfileSetupB: {
    displayName: string;
    selectedMajor: string;
    graduationYear: string;
    selectedId: string;
  };
  ForgotPass1: undefined;
  ForgotPass2: { email: string };
  ForgotPass3: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPass1" component={ForgotPass1} />
      <Stack.Screen name="ForgotPass2" component={ForgotPass2} />
      <Stack.Screen name="ForgotPass3" component={ForgotPass3} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="ProfileSetupB" component={ProfileSetupScreenB} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
