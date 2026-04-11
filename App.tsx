import React, { useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './app/navigation/AppNavigator';
import AnimatedSplashScreen from './app/screens/AnimatedSplashScreen';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#1A1A1F',
  },
};

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  return (
    <SafeAreaProvider>
      {/* 1. Use ternary instead of && to prevent 'false' object render errors */}
      {isSplashComplete ? null : (
        <AnimatedSplashScreen onAnimationComplete={() => setIsSplashComplete(true)} />
      )}
      
      <NavigationContainer theme={customDarkTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}