import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type ItemVariant = 'Locked' | 'Owned' | 'Affordable' | 'NotAffordable' | 'Equipped';

interface ShopItemCardProps {
  itemName: string;
  itemPrice: number;
  variant: ItemVariant;
  itemImageUri?: string;
  onPress?: () => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({
  itemName,
  itemPrice,
  variant,
  itemImageUri,
  onPress,
}) => {
  const isLocked = variant === 'Locked';
  const isOwned = variant === 'Owned';
  const isAffordable = variant === 'Affordable';
  const isNotAffordable = variant === 'NotAffordable';
  const isEquipped = variant === 'Equipped';
  const isOwnedOrEquipped = isOwned || isEquipped;
  const isOwnedOrEquippedOrAffordableOrNotAffordable =
    isOwned || isEquipped || isAffordable || isNotAffordable;

  const styles = StyleSheet.create({
    container: {
      width: 108,
      backgroundColor: '#26262e',
      borderRadius: 16,
      overflow: 'hidden',
    },
    previewArea: {
      height: 96,
      width: '100%',
      backgroundColor: isOwnedOrEquippedOrAffordableOrNotAffordable
        ? '#31313c'
        : '#26262e',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    previewAreaLocked: {
      backgroundColor: 'rgba(26, 26, 31, 0.7)',
    },
    itemSprite: {
      width: 64,
      height: 64,
      opacity: isOwnedOrEquippedOrAffordableOrNotAffordable ? 1 : 0.3,
      resizeMode: 'contain',
    },
    badgeTopRight: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
    },
    lockIcon: {
      position: 'absolute',
      width: 24,
      height: 24,
    },
    equippedBadge: {
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: FEED_COLORS.favor,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomRightRadius: 8,
    },
    equippedText: {
      fontSize: 6,
      fontFamily: 'Press Start 2P',
      fontWeight: '400',
      color: '#1a1a1f',
    },
    infoArea: {
      backgroundColor: '#26262e',
      borderTopWidth: 1,
      borderTopColor: '#3a3a48',
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 4,
    },
    itemName: {
      fontSize: 6,
      fontFamily: 'Press Start 2P',
      fontWeight: '400',
      color: isLocked ? '#8a8a9a' : '#f0f0f5',
      textAlign: 'center',
      marginBottom: 4,
    },
    costRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    costIcon: {
      width: 10,
      height: 10,
      resizeMode: 'contain',
    },
    costText: {
      fontSize: 10,
      fontFamily: 'Space Mono',
      fontWeight: '700',
      textAlign: 'center',
    },
    costTextOwned: {
      color: FEED_COLORS.item,
    },
    costTextAffordable: {
      color: FEED_COLORS.token,
    },
    costTextNotAffordable: {
      color: '#8a8a9a',
    },
    costTextLocked: {
      color: '#8a8a9a',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Preview Area */}
      <View
        style={[
          styles.previewArea,
          isLocked && styles.previewAreaLocked,
        ]}
      >
        {/* Item Sprite/Image */}
        {itemImageUri ? (
          <Image source={{ uri: itemImageUri }} style={styles.itemSprite} />
        ) : (
          <View style={[styles.itemSprite, { backgroundColor: '#31313c', borderRadius: 8 }]} />
        )}

        {/* Owned Check Badge */}
        {isOwnedOrEquipped && (
          <View style={styles.badgeTopRight}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={FEED_COLORS.favor}
            />
          </View>
        )}

        {/* Lock Icon */}
        {isLocked && (
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={24} color="#8a8a9a" />
          </View>
        )}

        {/* Equipped Badge */}
        {isEquipped && (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedText}>ON</Text>
          </View>
        )}
      </View>

      {/* Info Area */}
      <View style={styles.infoArea}>
        {/* Item Name and Cost (visible when not locked) */}
        {isOwnedOrEquippedOrAffordableOrNotAffordable && (
          <>
            <Text style={styles.itemName} numberOfLines={1}>
              {itemName}
            </Text>

            <View style={styles.costRow}>
              <Ionicons name="pricetag" size={10} color="#8a8a9a" />
              {isOwnedOrEquipped && (
                <Text style={[styles.costText, styles.costTextOwned]}>OWNED</Text>
              )}
              {isAffordable && (
                <Text style={[styles.costText, styles.costTextAffordable]}>
                  {itemPrice}
                </Text>
              )}
              {isNotAffordable && (
                <Text style={[styles.costText, styles.costTextNotAffordable]}>
                  {itemPrice}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Locked State */}
        {isLocked && (
          <>
            <Text style={styles.itemName} numberOfLines={1}>
              {itemName}
            </Text>
            <View style={styles.costRow}>
              <Ionicons name="pricetag" size={10} color="#8a8a9a" />
              <Text style={[styles.costText, styles.costTextLocked]}>
                {itemPrice}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ShopItemCard;
