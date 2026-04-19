import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type AuthTabProps = {
  activeTab?: 'Left' | 'Right';
  leftLabel?: string;
  rightLabel?: string;
  onTabChange?: (tab: 'Left' | 'Right') => void;
};

export default function AuthTab({
  activeTab = 'Left',
  leftLabel = 'Log In',
  rightLabel = 'Register',
  onTabChange,
}: AuthTabProps) {
  const isLeft = activeTab === 'Left';

  return (
    <View style={styles.container}>
      {isLeft && (
        <View style={styles.activeTab}>
          <Text style={styles.activeTabText}>{leftLabel}</Text>
        </View>
      )}
      <TouchableOpacity
        style={isLeft ? styles.inactiveTab : styles.activeTab}
        onPress={() => onTabChange?.('Left')}
        activeOpacity={0.7}
      >
        <Text style={isLeft ? styles.inactiveTabText : styles.activeTabText}>
          {leftLabel}
        </Text>
      </TouchableOpacity>

      {!isLeft && (
        <View style={styles.activeTab}>
          <Text style={styles.activeTabText}>{rightLabel}</Text>
        </View>
      )}
      <TouchableOpacity
        style={!isLeft ? styles.inactiveTab : styles.activeTab}
        onPress={() => onTabChange?.('Right')}
        activeOpacity={0.7}
      >
        <Text style={!isLeft ? styles.inactiveTabText : styles.activeTabText}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    height: 44,
  },
  activeTab: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // Android elevation
    elevation: 4,
  },
  inactiveTab: {
    flex: 1,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  inactiveTabText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '400',
    fontFamily: FONTS.body,
  },
});