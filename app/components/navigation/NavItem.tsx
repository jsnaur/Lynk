import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type NavType = 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';

type NavItemProps = {
  type?: NavType;
  isActive?: boolean;
  onPress?: () => void;
};

export default function NavItem({
  type = 'Feed',
  isActive = false,
  onPress,
}: NavItemProps) {
  const iconMap: { [key in NavType]: string } = {
    Feed: 'home',
    Quests: 'list',
    Post: 'add-circle',
    Shop: 'bag',
    Profile: 'person',
  };

  const textColor = isActive ? FEED_COLORS.favor : '#8a8a9a';
  const iconName = iconMap[type];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={24} color={textColor} />
      </View>
      <Text style={[styles.label, { color: textColor }]}>
        {type}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'DM_Sans-Medium',
    textAlign: 'center',
  },
});
