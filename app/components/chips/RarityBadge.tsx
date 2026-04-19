import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export type RarityLevel = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

interface RarityBadgeProps {
  rarity: RarityLevel;
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
  const getRarityColor = () => {
    switch (rarity) {
      case 'Common': return COLORS.textSecondary;
      case 'Uncommon': return COLORS.item;
      case 'Rare': return COLORS.favor;
      case 'Epic': return COLORS.xp;
      case 'Legendary': return COLORS.token;
      default: return COLORS.textSecondary;
    }
  };

  const color = getRarityColor();

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: withOpacity(color, 0.15), 
          borderColor: color 
        }
      ]}
    >
      <Text style={[styles.text, { color }]}>{rarity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    fontFamily: FONTS.body,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});