import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/auth/AuthScreen';

export type AuthStackParamList = {
	Auth: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;