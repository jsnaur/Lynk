import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';

type AuthTabProps = {
  activeTab?: 'Left' | 'Right';
  leftLabel?: string;
  rightLabel?: string;
  onTabChange?: (tab: 'Left' | 'Right') => void;
  style?: StyleProp<ViewStyle>;
};

export default function AuthTab({
  activeTab = 'Left',
  leftLabel = 'Log In',
  rightLabel = 'Register',
  onTabChange,
  style,
}: AuthTabProps) {
  const isLeft = activeTab === 'Left';

  const handleTabChange = (tab: 'Left' | 'Right') => {
    if (tab !== activeTab) {
      void appSoundManager.play(AppSoundCategory.UIClicks);
      onTabChange?.(tab);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.tab, isLeft && styles.activeTab]}
        onPress={() => handleTabChange('Left')}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.tabText, isLeft ? styles.activeTabText : styles.inactiveTabText]}
          numberOfLines={1}
        >
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, !isLeft && styles.activeTab]}
        onPress={() => handleTabChange('Right')}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.tabText, !isLeft ? styles.activeTabText : styles.inactiveTabText]}
          numberOfLines={1}
        >
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
    height: 44,
    width: '100%',
  },
  tab: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeTab: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: COLORS.surface2,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // Android elevation
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
});