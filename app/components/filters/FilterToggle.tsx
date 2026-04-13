import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type FilterToggleProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function FilterToggle({ label, selected = false, onPress }: FilterToggleProps) {
  let backgroundColor = '#26262e';
  let borderColor = '#3a3a48';
  let textColor = '#8a8a9a';
  let borderWidth = 1;

  if (selected) {
    const labelToColor: { [key: string]: string } = {
      'Favor': FEED_COLORS.favor,
      'Study': FEED_COLORS.study,
      'Item': FEED_COLORS.item,
    };
    const selectedColor = labelToColor[label] || FEED_COLORS.favor;
    
    backgroundColor = `${selectedColor}20`;
    borderColor = selectedColor;
    textColor = selectedColor;
    borderWidth = 1.5;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DM_Sans-Medium',
  },
});
