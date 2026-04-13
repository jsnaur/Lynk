import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type AvatarGridItemProps = {
  state?: 'Default' | 'Selected' | 'Locked';
  onPress?: () => void;
};

export default function AvatarGridItem({ state = 'Default' }: AvatarGridItemProps) {
  const isSelected = state === 'Selected';
  const isLocked = state === 'Locked';

  let borderColor = '#3a3a48';
  let backgroundColor = '#26262e';
  let borderWidth = 1;

  if (isSelected) {
    backgroundColor = `${FEED_COLORS.favor}15`;
    borderColor = FEED_COLORS.favor;
    borderWidth = 2;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
      ]}
    >
      {/* Avatar image placeholder */}
      <View style={styles.avatarPlaceholder} />
      
      {isSelected && (
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color={FEED_COLORS.favor}
          />
        </View>
      )}

      {isLocked && (
        <View style={styles.lockOverlay}>
          <MaterialCommunityIcons
            name="lock"
            size={16}
            color="#f0f0f5"
          />
        </View>
      )}
    </View>
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
    backgroundColor: '#3a3a48',
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
