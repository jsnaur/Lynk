import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type DropdownSelectFieldProps = {
  placeholder?: string;
  selectedValue?: string;
  onPress?: (isOpen: boolean) => void;
};

export default function DropdownSelectField({
  placeholder = 'Placeholder',
  selectedValue,
  onPress,
}: DropdownSelectFieldProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handlePress = () => {
    const newOpenState = !isDropdownOpen;
    setIsDropdownOpen(newOpenState);
    onPress?.(newOpenState);
  };

  const displayText = selectedValue ? selectedValue : placeholder;
  const textColor = selectedValue ? COLORS.textPrimary : COLORS.textSecondary;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: textColor }]}> 
        {displayText}
      </Text>
      <MaterialCommunityIcons
        name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={textColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    width: '100%',
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    fontFamily: FONTS.body,
  },
});