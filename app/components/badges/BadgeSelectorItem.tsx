import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type ItemState = 'Default' | 'Selected' | 'Disabled';

interface BadgeSelectorItemProps {
  questLabel: string;
  state?: ItemState;
  badgeImageUri?: string;
  onPress?: (isSelected: boolean) => void;
}

const BadgeSelectorItem: React.FC<BadgeSelectorItemProps> = ({
  questLabel,
  state: externalState = 'Default',
  badgeImageUri,
  onPress,
}) => {
  // Manage internal selection state
  const [isInternalSelected, setIsInternalSelected] = useState(false);
  const isSelected = externalState === 'Selected' || isInternalSelected;
  const isDisabled = externalState === 'Disabled';
  const isDefault = externalState === 'Default';

  const handlePress = () => {
    if (isDisabled) return;
    const newSelectedState = !isSelected;
    if (externalState === 'Default') {
      setIsInternalSelected(newSelectedState);
    }
    onPress?.(newSelectedState);
  };

  const styles = StyleSheet.create({
    container: {
      width: 80,
      alignItems: 'center',
      gap: 6,
    },
    badgeFrame: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: isDefault || isDisabled ? COLORS.surface2 : withOpacity(COLORS.favor, 0.1),
      borderWidth: isSelected ? 2 : 1,
      borderColor: isSelected ? COLORS.favor : COLORS.border,
    },
    badgeSprite: {
      width: 44,
      height: 44,
      resizeMode: 'contain',
      opacity: isDisabled ? 0.3 : 1,
    },
    selectedCheckBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 16,
      height: 16,
      backgroundColor: COLORS.favor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 10,
      fontFamily: FONTS.body,
      fontWeight: isSelected ? '500' : '400',
      textAlign: 'center',
      color: isDefault
        ? COLORS.textSecondary
        : isSelected
        ? COLORS.favor
        : COLORS.border,
      width: '100%',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <View style={styles.badgeFrame}>
        {/* Badge Sprite */}
        {badgeImageUri ? (
          <Image source={{ uri: badgeImageUri }} style={styles.badgeSprite} />
        ) : (
          <View
            style={[
              styles.badgeSprite,
              {
                backgroundColor: isDisabled ? COLORS.border : COLORS.surface2,
                borderRadius: 8,
              },
            ]}
          />
        )}

        {/* Selected Check Badge */}
        {isSelected && (
          <View style={styles.selectedCheckBadge}>
            <Ionicons name="checkmark" size={10} color={COLORS.bg} />
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={styles.label} numberOfLines={1}>
        {questLabel}
      </Text>
    </TouchableOpacity>
  );
};

export default BadgeSelectorItem;