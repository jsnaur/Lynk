import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type Category = 'Favor' | 'Study' | 'Item';
type ButtonState = 'Default' | 'Selected' | 'Error';

interface CategorySelectButtonProps {
  category: Category;
  state: ButtonState;
  onPress?: () => void;
}

const CategorySelectButton: React.FC<CategorySelectButtonProps> = ({
  category,
  state,
  onPress,
}) => {
  const getCategoryColor = (): string => {
    switch (category) {
      case 'Favor':
        return FEED_COLORS.favor;
      case 'Study':
        return FEED_COLORS.study;
      case 'Item':
        return FEED_COLORS.item;
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
    if (state === 'Default') return '#8a8a9a';
    if (state === 'Selected') return getCategoryColor();
    if (state === 'Error') return '#ff4d4d';
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
        state === 'Default'
          ? '#26262e'
          : state === 'Selected'
          ? `${getCategoryColor()}26` // 15% opacity
          : '#ff4d4d26', // error 15% opacity
      borderWidth: state === 'Default' ? 0 : 2,
      borderColor:
        state === 'Selected' ? getCategoryColor() : state === 'Error' ? '#ff4d4d' : 'transparent',
    },
    content: {
      alignItems: 'center',
      gap: 4,
    },
    icon: {
      width: 24,
      height: 24,
    },
    label: {
      fontSize: 11,
      fontFamily: 'DM Sans',
      fontWeight: '500',
      color: state === 'Default' ? '#8a8a9a' : getIconColor(),
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Ionicons name={getCategoryIcon()} size={24} color={getIconColor()} />
        <Text style={styles.label}>{category}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategorySelectButton;
