import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type DropdownSelectFieldProps = {
  placeholder?: string;
  selectedValue?: string;
  state?: 'Inactive' | 'Active' | 'Selected';
  onPress?: (isOpen: boolean) => void;
};

export default function DropdownSelectField({
  placeholder = 'Placeholder',
  selectedValue = 'Chosen Item',
  state: externalState = 'Inactive',
  onPress,
}: DropdownSelectFieldProps) {
  // Manage internal dropdown open state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Map state to visual representation
  const displayState = isDropdownOpen ? 'Active' : externalState;

  const handlePress = () => {
    const newOpenState = !isDropdownOpen;
    setIsDropdownOpen(newOpenState);
    onPress?.(newOpenState);
  };

  const getColor = () => {
    if (displayState === 'Selected') return COLORS.favor;
    if (displayState === 'Active') return COLORS.textPrimary;
    return COLORS.textSecondary;
  };

  const getBorderColor = () => {
    if (displayState === 'Active') return COLORS.textPrimary;
    if (displayState === 'Selected') return COLORS.favor;
    return COLORS.border;
  };

  const displayText = displayState === 'Selected' ? selectedValue : placeholder;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: getBorderColor(),
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: getColor() }]}>
        {displayText}
      </Text>
      <MaterialCommunityIcons
        name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={getColor()}
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