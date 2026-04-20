import React, { useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { COLORS } from './app/constants/colors';

import AppNavigator from './app/navigation/AppNavigator';
import AnimatedSplashScreen from './app/screens/AnimatedSplashScreen';
import { TokenBalanceProvider } from './app/contexts/TokenContext';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
  },
};

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  // Load all required fonts and map them to the exact strings defined in constants/fonts.ts
  const [fontsLoaded] = useFonts({
    DMSans: DMSans_400Regular, 
    DMSansBold: DMSans_700Bold, // Included bold variant for general UI usage
    PressStart2P: PressStart2P_400Regular,
    SpaceMono: SpaceMono_400Regular,
  });

  // Do not render anything until fonts are loaded to prevent crashing or unstyled text
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {/* 1. Use ternary instead of && to prevent 'false' object render errors */}
        {isSplashComplete ? null : (
          <AnimatedSplashScreen onAnimationComplete={() => setIsSplashComplete(true)} />
        )}

        <TokenBalanceProvider>
          <NavigationContainer theme={customDarkTheme}>
            <AppNavigator />
          </NavigationContainer>
        </TokenBalanceProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});