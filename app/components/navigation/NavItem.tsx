import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface NavItemProps {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}

export default function NavItem({ label, iconName, isActive, onPress }: NavItemProps) {
  const activeColor = COLORS.textPrimary; // Can be swapped to COLORS.favor if theme prefers tinted tabs
  const inactiveColor = COLORS.textSecondary;
  const color = isActive ? activeColor : inactiveColor;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={isActive ? iconName : `${iconName}-outline` as any} 
          size={26} 
          color={color} 
        />
        {isActive && <View style={styles.activeDot} />}
      </View>
      <Text style={[styles.label, { color, fontWeight: isActive ? '700' : '500' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    gap: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textPrimary,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.body,
  },
});