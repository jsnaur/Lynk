import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

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


  let backgroundColor = '#26262e';
  let borderColor = '#3a3a48';
  let textColor = '#8a8a9a';
  let borderWidth = 1;

  if (isSelected) {
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
    fontFamily: 'DM_Sans-Medium',
  },
});
