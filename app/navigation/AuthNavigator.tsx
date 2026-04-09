import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';
import ForgotPass1 from '../screens/auth/ForgotPass1';
import ForgotPass2 from '../screens/auth/ForgotPass2';
import ForgotPass3 from '../screens/auth/ForgotPass3';

export type AuthStackParamList = {
  Auth: undefined;
  ForgotPass1: undefined;
  ForgotPass2: undefined;
  ForgotPass3: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPass1" component={ForgotPass1} />
      <Stack.Screen name="ForgotPass2" component={ForgotPass2} />
      <Stack.Screen name="ForgotPass3" component={ForgotPass3} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;