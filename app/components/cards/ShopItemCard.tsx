import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export interface ShopItemProps {
  id: string;
  name: string;
  price: number;
  isOwned?: boolean;
  onPress?: () => void;
}

export default function ShopItemCard({ name, price, isOwned = false, onPress }: ShopItemProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imagePlaceholder}>
        <MaterialCommunityIcons name="cube-outline" size={40} color={COLORS.textSecondary} />
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        
        {isOwned ? (
          <View style={[styles.ownedPill, { backgroundColor: withOpacity(COLORS.item, 0.15) }]}>
            <Text style={styles.ownedText}>Owned</Text>
          </View>
        ) : (
          <View style={styles.priceRow}>
            <MaterialCommunityIcons name="lightning-bolt-circle" size={16} color={COLORS.token} />
            <Text style={styles.price}>{price}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.token,
    fontFamily: FONTS.body,
  },
  ownedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ownedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.item,
    fontFamily: FONTS.body,
    textTransform: 'uppercase',
  },
});