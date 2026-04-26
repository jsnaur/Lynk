import React, { type ComponentType, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import { darkColors, withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeColors = Record<keyof typeof darkColors, string>;

export type ShopSheetItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  sprite: 0 | 1 | 2;
};

type ItemsDetailsSheetProps = {
  visible: boolean;
  item: ShopSheetItem | null;
  balance: number;
  owned: boolean;
  equipped: boolean;
  Sprite: ComponentType<{ width?: number; height?: number }>;
  onClose: () => void;
  onPurchase: () => void;
  onEquip: () => void;
};

export default function ItemsDetailsSheet({
  visible,
  item,
  balance,
  owned,
  equipped,
  Sprite,
  onClose,
  onPurchase,
  onEquip,
}: ItemsDetailsSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  if (!item) return null;

  const canAfford = item.price === 0 || balance >= item.price;
  const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdropFill}
          onPress={onClose}
          accessibilityLabel="Dismiss"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetTint} pointerEvents="none" />

          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.spriteRing}>
              <Sprite width={96} height={96} />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{categoryLabel}</Text>
            </View>
          </View>

          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>
            {owned
              ? equipped
                ? 'Currently equipped on your avatar.'
                : 'In your locker — equip anytime.'
              : item.price === 0
                ? 'Free cosmetic for your campus avatar.'
                : 'Unlock this for your avatar.'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Your balance</Text>
              <View style={styles.statValueRow}>
                <TokenPixelIcon width={18} height={18} />
                <Text style={styles.statValue}>{balance}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{owned ? 'Status' : 'Price'}</Text>
              {owned ? (
                <Text style={[styles.statValue, { color: equipped ? colors.favor : colors.item }]}>
                  {equipped ? 'Equipped' : 'Owned'}
                </Text>
              ) : (
                <View style={styles.statValueRow}>
                  <TokenPixelIcon width={18} height={18} />
                  <Text style={styles.statValue}>{item.price === 0 ? 'Free' : item.price}</Text>
                </View>
              )}
            </View>
          </View>

          {!owned && !canAfford && (
            <View style={styles.warnBanner}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={styles.warnText}>Not enough tokens. Complete quests to earn more.</Text>
            </View>
          )}

          <View style={styles.actions}>
            {owned ? (
              <>
                <Pressable
                  onPress={() => {
                    if (!equipped) onEquip();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    equipped && styles.primaryBtnMuted,
                    pressed && styles.pressed,
                  ]}
                  disabled={equipped}
                >
                  <Text style={styles.primaryBtnText}>{equipped ? 'Equipped' : 'Equip now'}</Text>
                </Pressable>
                <Pressable onPress={onClose} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <Text style={styles.secondaryBtnText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    onPurchase();
                    onClose();
                  }}
                  disabled={!canAfford && item.price > 0}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (!canAfford && item.price > 0) && styles.primaryBtnDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {item.price === 0 ? 'Claim free' : `Buy for ${item.price} tokens`}
                  </Text>
                </Pressable>
                <Pressable onPress={onClose} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <Text style={styles.secondaryBtnText}>Not now</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    zIndex: 2,
    elevation: 12,
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withOpacity(COLORS.bg, 0.92),
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 2,
    padding: 4,
  },
  hero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  spriteRing: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 22,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 17,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: COLORS.token,
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: withOpacity(COLORS.warning, 0.12),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.warning, 0.35),
    marginBottom: 16,
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    fontFamily: 'DMSans-Regular',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.favor,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnMuted: {
    opacity: 0.45,
  },
  primaryBtnDisabled: {
    opacity: 0.35,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: COLORS.bg,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.88,
  },
});