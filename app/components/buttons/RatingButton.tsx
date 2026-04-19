import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';

type RatingButtonProps = {
  direction?: 'Up' | 'Down';
  state?: 'Default' | 'Selected' | 'Pressed';
  onPress?: () => void;
};

export default function RatingButton({
  direction = 'Up',
  state = 'Default',
  onPress,
}: RatingButtonProps) {
  const isUp = direction === 'Up';
  const isSelected = state === 'Selected';
  const isPressed = state === 'Pressed';

  let borderColor: string = COLORS.border;
  let backgroundColor: string = COLORS.surface;
  let iconColor: string = COLORS.textSecondary;

  if (isSelected || isPressed) {
    const selectedColor = isUp ? COLORS.xp : COLORS.study;
    borderColor = selectedColor;
    backgroundColor = withOpacity(selectedColor, 0.2);
    iconColor = selectedColor;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: isSelected ? 1.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={isUp ? 'thumb-up' : 'thumb-down'}
        size={20}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});