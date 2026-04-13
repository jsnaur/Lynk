import React from 'react';
import { View, StyleSheet } from 'react-native';
import NavItem from './NavItem';

type NavType = 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';
type ActiveNav = 'Default' | NavType;

type BottomNavBarProps = {
  active?: ActiveNav;
  onNavChange?: (nav: NavType) => void;
};

export default function BottomNavBar({
  active = 'Feed',
  onNavChange,
}: BottomNavBarProps) {
  const navItems: NavType[] = ['Feed', 'Quests', 'Post', 'Shop', 'Profile'];

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        {navItems.map((item) => (
          <NavItem
            key={item}
            type={item}
            isActive={active === item}
            onPress={() => onNavChange?.(item)}
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
