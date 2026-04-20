import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';

type AvatarGridItemProps = {
  state?: 'Default' | 'Selected' | 'Locked';
  onPress?: (isSelected: boolean) => void;
};

export default function AvatarGridItem({ state: externalState = 'Default', onPress }: AvatarGridItemProps) {
  // Manage internal selection state
  const [isInternalSelected, setIsInternalSelected] = useState(false);
  const isSelected = externalState === 'Selected' || isInternalSelected;
  const isLocked = externalState === 'Locked';

  const handlePress = () => {
    if (externalState === 'Locked') return; // Can't select locked items
    const newSelected = !isSelected;
    if (externalState === 'Default') {
      setIsInternalSelected(newSelected);
    }
    onPress?.(newSelected);
  };

  let borderColor: string = COLORS.border;
  let backgroundColor: string = COLORS.surface;
  let borderWidth = 1;

  if (isSelected) {
    backgroundColor = withOpacity(COLORS.favor, 0.15);
    borderColor = COLORS.favor;
    borderWidth = 2;
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
      disabled={isLocked}
      activeOpacity={isLocked ? 1 : 0.7}
    >
      {/* Avatar image placeholder */}
      <View style={styles.avatarPlaceholder} />
      
      {isSelected && (
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={12}
            color={COLORS.favor}
          />
        </View>
      )}

      {isLocked && (
        <View style={styles.lockOverlay}>
          <MaterialCommunityIcons
            name="lock"
            size={12}
            color={COLORS.textPrimary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  checkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
});