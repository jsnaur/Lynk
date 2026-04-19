import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type Category = 'Favor' | 'Study' | 'Item';
type ButtonState = 'Default' | 'Selected' | 'Error';

interface CategorySelectButtonProps {
  category: Category;
  state?: ButtonState;
  onPress?: (category: Category, isSelected: boolean) => void;
}

const CategorySelectButton: React.FC<CategorySelectButtonProps> = ({
  category,
  state: externalState = 'Default',
  onPress,
}) => {
  // Manage internal selection state
  const [isInternalSelected, setIsInternalSelected] = useState(false);
  const isSelected = externalState === 'Selected' || (externalState === 'Default' && isInternalSelected);
  const displayState = isSelected ? 'Selected' : externalState;

  const handlePress = () => {
    const newSelectedState = !isSelected;
    if (externalState === 'Default') {
      setIsInternalSelected(newSelectedState);
    }
    onPress?.(category, newSelectedState);
  };
  const getCategoryColor = (): string => {
    switch (category) {
      case 'Favor':
        return COLORS.favor;
      case 'Study':
        return COLORS.study;
      case 'Item':
        return COLORS.item;
    }
  };

  const getCategoryIcon = (): 'heart' | 'book' | 'gift' => {
    switch (category) {
      case 'Favor':
        return 'heart';
      case 'Study':
        return 'book';
      case 'Item':
        return 'gift';
    }
  };

  const getIconColor = (): string => {
    if (displayState === 'Default') return '#8a8a9a';
    if (displayState === 'Selected') return getCategoryColor();
    if (displayState === 'Error') return COLORS.error;
    return '#8a8a9a';
  };

  const styles = StyleSheet.create({
    container: {
      width: 64,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      backgroundColor:
        displayState === 'Default'
          ? '#26262e'
          : displayState === 'Selected'
          ? withOpacity(getCategoryColor(), 0.15)
          : withOpacity(COLORS.error, 0.15),
      borderWidth: displayState === 'Default' ? 0 : 2,
      borderColor:
        displayState === 'Selected' ? getCategoryColor() : displayState === 'Error' ? COLORS.error : 'transparent',
    },
    content: {
      alignItems: 'center',
      gap: 4,
    },
    label: {
      fontSize: 11,
      fontFamily: FONTS.body,
      fontWeight: '500',
      color: displayState === 'Default' ? '#8a8a9a' : getIconColor(),
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Ionicons name={getCategoryIcon()} size={24} color={getIconColor()} />
        <Text style={styles.label}>{category}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategorySelectButton;