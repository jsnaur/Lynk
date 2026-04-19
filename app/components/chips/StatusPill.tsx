import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export type QuestStatus = 'Active' | 'Completed' | 'Failed' | 'Pending';

interface StatusPillProps {
  status: QuestStatus;
}

export default function StatusPill({ status }: StatusPillProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'Active':
        return { color: COLORS.favor, bg: withOpacity(COLORS.favor, 0.15) };
      case 'Completed':
        return { color: COLORS.xp, bg: withOpacity(COLORS.xp, 0.15) };
      case 'Failed':
        return { color: COLORS.error, bg: withOpacity(COLORS.error, 0.15) };
      case 'Pending':
      default:
        return { color: COLORS.textSecondary, bg: COLORS.surface2 };
    }
  };

  const { color, bg } = getStatusStyle();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    fontFamily: FONTS.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});