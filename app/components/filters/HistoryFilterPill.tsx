import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface HistoryFilterPillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function HistoryFilterPill({ 
  label, 
  selected = false, 
  onPress 
}: HistoryFilterPillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected ? COLORS.textPrimary : COLORS.surface,
          borderColor: selected ? COLORS.textPrimary : COLORS.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? COLORS.bg : COLORS.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.body,
    fontWeight: '500',
  },
});