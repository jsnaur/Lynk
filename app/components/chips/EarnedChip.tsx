import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface EarnedChipProps {
  type: 'XP' | 'Token' | 'Item';
  amount: number | string;
}

export default function EarnedChip({ type, amount }: EarnedChipProps) {
  const getColor = () => {
    switch (type) {
      case 'XP': return COLORS.xp;
      case 'Token': return COLORS.study; // Can map to specific token color if added to COLORS
      case 'Item': return COLORS.item;
      default: return COLORS.textPrimary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'XP': return 'star';
      case 'Token': return 'currency-usd'; // Adjust to custom SVG token if necessary
      case 'Item': return 'gift';
      default: return 'star';
    }
  };

  const chipColor = getColor();

  return (
    <View style={[styles.container, { backgroundColor: withOpacity(chipColor, 0.15) }]}>
      <MaterialCommunityIcons name={getIcon()} size={14} color={chipColor} />
      <Text style={[styles.text, { color: chipColor }]}>
        {amount} {type}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontFamily: FONTS.body,
    fontWeight: '700',
  },
});