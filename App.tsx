import React, { useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

import AppNavigator from './app/navigation/AppNavigator';
import AnimatedSplashScreen from './app/screens/AnimatedSplashScreen';
import { TokenBalanceProvider } from './app/contexts/TokenContext';
import { ThemeProvider, useTheme } from './app/contexts/ThemeContext';
import { COLORS } from './app/constants/colors';

// Separate inner component to consume the ThemeContext
function MainApp() {
  const { theme, colors } = useTheme();

  const customTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
    },
  };

  return (
    <TokenBalanceProvider>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <NavigationContainer theme={customTheme}>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </TokenBalanceProvider>
  );
}

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  // Load all required fonts and map them to the exact strings defined in constants/fonts.ts
  const [fontsLoaded] = useFonts({
    DMSans: DMSans_400Regular, 
    DMSansBold: DMSans_700Bold, 
    PressStart2P: PressStart2P_400Regular,
    SpaceMono: SpaceMono_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Render Splash Screen OR App Navigator, but not both concurrently to prevent load delays */}
        {!isSplashComplete ? (
          <View style={styles.root}>
            <AnimatedSplashScreen onAnimationComplete={() => setIsSplashComplete(true)} />
          </View>
        ) : (
          <MainApp />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg, // Initial fallback before theme is hydrated
  },
});