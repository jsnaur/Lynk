import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type DropdownSelectFieldProps = {
  placeholder?: string;
  selectedValue?: string;
  state?: 'Inactive' | 'Active' | 'Selected';
  onPress?: () => void;
};

export default function DropdownSelectField({
  placeholder = 'Placeholder',
  selectedValue = 'Chosen Item',
  state = 'Inactive',
  onPress,
}: DropdownSelectFieldProps) {
  const isActive = state === 'Active';
  const isSelected = state === 'Selected';
  const displayText = isSelected ? selectedValue : placeholder;
  const textColor = isSelected || isActive ? '#f0f0f5' : '#8a8a9a';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: '#3a3a48',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {displayText}
      </Text>
      <MaterialCommunityIcons
        name={isActive ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={textColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#26262e',
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
    fontFamily: 'DM_Sans-Regular',
  },
});
