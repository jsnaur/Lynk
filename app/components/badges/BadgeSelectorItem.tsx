import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type ItemState = 'Default' | 'Selected' | 'Disabled';

interface BadgeSelectorItemProps {
  questLabel: string;
  state: ItemState;
  badgeImageUri?: string;
  onPress?: () => void;
}

const BadgeSelectorItem: React.FC<BadgeSelectorItemProps> = ({
  questLabel,
  state,
  badgeImageUri,
  onPress,
}) => {
  const isDefault = state === 'Default';
  const isSelected = state === 'Selected';
  const isDisabled = state === 'Disabled';

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
      backgroundColor: isDefault || isDisabled ? '#31313c' : `${FEED_COLORS.favor}1a`, // 10% opacity for selected
      borderWidth: isSelected ? 2 : 1,
      borderColor: isSelected ? FEED_COLORS.favor : '#3a3a48',
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
      backgroundColor: FEED_COLORS.favor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#26262e',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      width: 12,
      height: 12,
      resizeMode: 'contain',
    },
    label: {
      fontSize: 10,
      fontFamily: 'DM Sans',
      fontWeight: isSelected ? '500' : '400',
      textAlign: 'center',
      color: isDefault
        ? '#8a8a9a'
        : isSelected
        ? FEED_COLORS.favor
        : '#3a3a48',
      width: '100%',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
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
                backgroundColor: isDisabled ? '#3a3a48' : '#2a2a35',
                borderRadius: 8,
              },
            ]}
          />
        )}

        {/* Selected Check Badge */}
        {isSelected && (
          <View style={styles.selectedCheckBadge}>
            <Ionicons name="checkmark" size={10} color="#1a1a1f" />
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
