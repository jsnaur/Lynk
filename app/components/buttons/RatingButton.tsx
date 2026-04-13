import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

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
  const [isPressing, setIsPressing] = useState(false);
  const isUp = direction === 'Up';
  const isSelected = state === 'Selected';
  const isPressed = state === 'Pressed';

  let borderColor = '#3a3a48';
  let backgroundColor = '#26262e';
  let iconColor = '#8a8a9a';

  if (isSelected || isPressed) {
    const selectedColor = isUp ? FEED_COLORS.xp : FEED_COLORS.study;
    borderColor = selectedColor;
    backgroundColor = `${selectedColor}20`;
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
