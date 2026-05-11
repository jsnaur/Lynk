import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../constants/colors';
import { FONTS } from '../constants/fonts';

type ThemeType = 'light' | 'dark';

// Combine both exact literal types so TypeScript accepts either the Dark or Light palette
type ColorsType = typeof darkColors | typeof lightColors;

interface ThemeContextProps {
  theme: ThemeType;
  colors: ColorsType;
  toggleTheme: () => void;
}

export const screenHeaderTheme = {
  layout: {
    height: 64,
    horizontalPadding: 20,
    topPadding: 8,
    bottomPadding: 12,
  },
  text: {
    title: {
      fontFamily: FONTS.display,
      fontSize: 16,
      lineHeight: 34,
      letterSpacing: 0.2,
    },
  },
} as const;

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('dark'); // Default to dark

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@lynk/theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('@lynk/theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);