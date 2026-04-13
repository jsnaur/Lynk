import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

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
    backgroundColor: '#26262e',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    height: 44,
  },
  activeTab: {
    flex: 1,
    backgroundColor: '#31313c',
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
    color: '#f0f0f5',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
  inactiveTabText: {
    color: '#8a8a9a',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
  },
});
