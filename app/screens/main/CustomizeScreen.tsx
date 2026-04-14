import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ItemSprite0 from '../../../assets/ShopAssets/Item_Sprite.svg';
import ItemSprite1 from '../../../assets/ShopAssets/Item_Sprite (1).svg';
import ItemSprite2 from '../../../assets/ShopAssets/Item_Sprite (2).svg';
import { FEED_COLORS, FEED_PILL_BG } from '../../constants/colors';

const SPRITES = [ItemSprite0, ItemSprite1, ItemSprite2] as const;

type AccessoryItem = {
  id: string;
  name: string;
  price: number;
  sprite: 0 | 1 | 2;
};

type CustomizeScreenProps = {
  initialOwnedAccessoryIds?: string[];
  initialAppliedAccessoryId?: string;
  onApplyAccessory?: (accessoryId: string) => void;
};

const ACCESSORY_ITEMS: AccessoryItem[] = [
  { id: 'board-free', name: 'Starter Board', price: 0, sprite: 2 },
  { id: 'car-mini', name: 'Mini Cruiser', price: 1, sprite: 1 },
  { id: 'car-lux', name: 'Campus Limo', price: 153, sprite: 0 },
];

const DEFAULT_OWNED_IDS = new Set(['board-free', 'car-mini']);

export default function CustomizeScreen({
  initialOwnedAccessoryIds,
  initialAppliedAccessoryId,
  onApplyAccessory,
}: CustomizeScreenProps) {
  const ownedIds = useMemo(
    () => new Set(initialOwnedAccessoryIds ?? Array.from(DEFAULT_OWNED_IDS)),
    [initialOwnedAccessoryIds],
  );

  const ownedAccessoryItems = useMemo(
    () => ACCESSORY_ITEMS.filter((item) => ownedIds.has(item.id)),
    [ownedIds],
  );

  const fallbackOwnedId = ownedAccessoryItems[0]?.id ?? '';

  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string>(
    initialAppliedAccessoryId ?? fallbackOwnedId,
  );
  const [appliedAccessoryId, setAppliedAccessoryId] = useState<string>(
    initialAppliedAccessoryId ?? fallbackOwnedId,
  );

  const selectedAccessory = useMemo(
    () => ACCESSORY_ITEMS.find((item) => item.id === selectedAccessoryId),
    [selectedAccessoryId],
  );

  const appliedAccessory = useMemo(
    () => ACCESSORY_ITEMS.find((item) => item.id === appliedAccessoryId),
    [appliedAccessoryId],
  );

  const canApply =
    !!selectedAccessory &&
    ownedIds.has(selectedAccessory.id) &&
    selectedAccessory.id !== appliedAccessoryId;

  const applySelectedAccessory = () => {
    if (!selectedAccessory) return;

    if (!ownedIds.has(selectedAccessory.id)) {
      Alert.alert('Item locked', 'Purchase this accessory in Shop before applying it.');
      return;
    }

    setAppliedAccessoryId(selectedAccessory.id);
    onApplyAccessory?.(selectedAccessory.id);
    Alert.alert('Accessory Applied', `${selectedAccessory.name} is now active.`);
  };

  const AppliedSprite = appliedAccessory ? SPRITES[appliedAccessory.sprite] : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Customize your Avatar</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={48} color={FEED_COLORS.textPrimary} />
            {AppliedSprite && (
              <View style={styles.appliedOverlay}>
                <AppliedSprite width={44} height={44} />
              </View>
            )}
          </View>

          <View style={styles.previewTextWrap}>
            <Text style={styles.previewLabel}>Active Accessory</Text>
            <Text style={styles.previewName}>{appliedAccessory?.name ?? 'None'}</Text>
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {ownedAccessoryItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No owned accessories yet. Buy one in Shop to customize.</Text>
            </View>
          ) : ownedAccessoryItems.map((item) => {
            const owned = ownedIds.has(item.id);
            const selected = selectedAccessoryId === item.id;
            const applied = appliedAccessoryId === item.id;
            const Sprite = SPRITES[item.sprite];

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedAccessoryId(item.id)}
                style={({ pressed }) => [
                  styles.itemCard,
                  selected && styles.itemCardSelected,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.itemSpriteWrap}>
                    <Sprite width={40} height={40} />
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>{owned ? 'Owned' : `Locked • ${item.price} tokens`}</Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  {applied ? (
                    <View style={styles.statePill}>
                      <Text style={styles.statePillText}>Applied</Text>
                    </View>
                  ) : selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={FEED_COLORS.item} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={applySelectedAccessory}
            disabled={!canApply}
            style={({ pressed }) => [
              styles.applyBtn,
              !canApply && styles.applyBtnDisabled,
              pressed && canApply && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.applyBtnText}>{canApply ? 'Apply Accessory' : 'Accessory Applied'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FEED_COLORS.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: FEED_COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  previewCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FEED_COLORS.surface2,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
  },
  appliedOverlay: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: FEED_PILL_BG.token,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTextWrap: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Medium',
  },
  previewName: {
    marginTop: 2,
    fontSize: 16,
    color: FEED_COLORS.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
  list: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyStateText: {
    fontSize: 13,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCardSelected: {
    borderColor: FEED_COLORS.favor,
    backgroundColor: 'rgba(0, 245, 255, 0.09)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemSpriteWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    color: FEED_COLORS.textPrimary,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  itemRight: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(57, 255, 20, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  statePillText: {
    fontSize: 11,
    color: FEED_COLORS.item,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.bg,
  },
  applyBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FEED_COLORS.item,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 15,
    color: '#102010',
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
});
