import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

interface RarityBadgeProps {
  tier: RarityTier;
}

const RarityBadge: React.FC<RarityBadgeProps> = ({ tier }) => {
  const getBackgroundColor = (): string => {
    switch (tier) {
      case 'Common':
        return 'rgba(138, 138, 154, 0.2)';
      case 'Uncommon':
        return `${FEED_COLORS.item}26`; // lime 15% opacity
      case 'Rare':
        return `${FEED_COLORS.favor}26`; // cyan 15% opacity
      case 'Epic':
        return `${FEED_COLORS.xp}26`; // purple 15% opacity
      case 'Legendary':
        return `${FEED_COLORS.token}26`; // gold 15% opacity
    }
  };

  const getTextColor = (): string => {
    switch (tier) {
      case 'Common':
        return '#8a8a9a';
      case 'Uncommon':
        return FEED_COLORS.item;
      case 'Rare':
        return FEED_COLORS.favor;
      case 'Epic':
        return FEED_COLORS.xp;
      case 'Legendary':
        return FEED_COLORS.token;
    }
  };

  const styles = StyleSheet.create({
    badge: {
      backgroundColor: getBackgroundColor(),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 14,
      minWidth: tier === 'Legendary' ? 70 : 'auto',
    },
    text: {
      fontSize: 6,
      fontFamily: 'Press Start 2P',
      fontWeight: '400',
      color: getTextColor(),
      textAlign: 'center',
      textTransform: 'uppercase',
    },
  });

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{tier}</Text>
    </View>
  );
};

export default RarityBadge;
