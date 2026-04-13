import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NavItem from './NavItem';

type NavType = 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';
type ActiveNav = 'Default' | NavType;

type BottomNavBarProps = {
  active?: NavType;
  onNavChange?: (nav: NavType) => void;
};

export default function BottomNavBar({
  active: externalActive,
  onNavChange,
}: BottomNavBarProps) {
  // Use internal state if external active prop not provided
  const [internalActive, setInternalActive] = useState<NavType>(externalActive ?? 'Feed');
  const activeNav = externalActive ?? internalActive;

  const handleNavChange = (nav: NavType) => {
    if (!externalActive) {
      setInternalActive(nav);
    }
    onNavChange?.(nav);
  };
  const navItems: NavType[] = ['Feed', 'Quests', 'Post', 'Shop', 'Profile'];

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        {navItems.map((item) => (
          <NavItem
            key={item}
            type={item}
            isActive={activeNav === item}
            onPress={() => handleNavChange(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(38, 38, 46, 0.67)',
    borderTopWidth: 1,
    borderTopColor: '#3a3a48',
    minHeight: 83,
    paddingVertical: 4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 57,
    paddingHorizontal: 16,
  },
});
