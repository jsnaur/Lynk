import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type FilterToggleProps = {
  label: string;
  selected?: boolean;
  onPress?: (isSelected: boolean) => void;
};

export default function FilterToggle({ label, selected, onPress }: FilterToggleProps) {
  // Use internal state if external selected prop not provided
  const [internalSelected, setInternalSelected] = useState(selected ?? false);
  const isSelected = selected !== undefined ? selected : internalSelected;

  const handlePress = () => {
    const newState = !isSelected;
    if (selected === undefined) {
      setInternalSelected(newState);
    }
    onPress?.(newState);
  };


  let backgroundColor: string = COLORS.surface;
  let borderColor: string = COLORS.border;
  let textColor: string = COLORS.textSecondary;
  let borderWidth = 1;

  if (isSelected) {
    const labelToColor: { [key: string]: string } = {
      'Favor': COLORS.favor,
      'Study': COLORS.study,
      'Item': COLORS.item,
    };
    const selectedColor = labelToColor[label] || COLORS.favor;
    
    backgroundColor = withOpacity(selectedColor, 0.2);
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
      onPress={handlePress}
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
    fontFamily: FONTS.body,
  },
});