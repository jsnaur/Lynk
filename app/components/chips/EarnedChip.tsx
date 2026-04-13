import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type EarnedChipProps = {
  type?: 'Tokens' | 'Experience';
  value?: number;
};

export default function EarnedChip({ type = 'Tokens', value = 30 }: EarnedChipProps) {
  const isTokens = type === 'Tokens';
  const backgroundColor = isTokens ? 
    'rgba(255, 215, 0, 0.1)' : 
    'rgba(192, 132, 252, 0.1)';
  const textColor = isTokens ? FEED_COLORS.token : FEED_COLORS.xp;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.value, { color: textColor }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: textColor }]}>
        {isTokens ? 'TK' : 'XP'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  value: {
    fontFamily: 'Space_Mono-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontFamily: 'Space_Mono-Bold',
    fontSize: 9,
    fontWeight: '700',
  },
});
