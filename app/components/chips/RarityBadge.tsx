import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

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
        return withOpacity(COLORS.item, 0.15); 
      case 'Rare':
        return withOpacity(COLORS.favor, 0.15); 
      case 'Epic':
        return withOpacity(COLORS.xp, 0.15); 
      case 'Legendary':
        return withOpacity(COLORS.token, 0.15); 
    }
  };

  const getTextColor = (): string => {
    switch (tier) {
      case 'Common':
        return '#8a8a9a';
      case 'Uncommon':
        return COLORS.item;
      case 'Rare':
        return COLORS.favor;
      case 'Epic':
        return COLORS.xp;
      case 'Legendary':
        return COLORS.token;
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
      fontFamily: FONTS.display, // Game layer: Press Start 2P
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