import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, AccessoryItem, AccessorySlot, DEFAULT_OWNED_IDS } from '../../constants/accessories';
import { FEED_COLORS, FEED_PILL_BG } from '../../constants/colors';
import ItemsDetailsSheet from './Items_detailsSheet';
import { useTokenBalance } from '../../contexts/TokenContext';
type ShopCategory = 'all' | 'hat' | 'head' | 'pet' | 'effects' | 'frame';

const FILTERS: { key: ShopCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hat', label: 'Hats' },
  { key: 'head', label: 'Head' },
  { key: 'pet', label: 'Pets' },
  { key: 'effects', label: 'Effects' },
  { key: 'frame', label: 'Frames' },
];
const GRID_GAP = 10;
const H_PADDING = 16;

type ShopScreenProps = {
  onTabPress?: (tab: MainTab) => void;
};

export default function ShopScreen({ onTabPress }: ShopScreenProps) {
  const navigation = useNavigation<any>();
  const { balance, spendTokens } = useTokenBalance();
  const [filter, setFilter] = useState<ShopCategory>('all');
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(DEFAULT_OWNED_IDS));
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AccessorySlot, string>>>({});
  const [detailItem, setDetailItem] = useState<AccessoryItem | null>(null);

  const columnWidth = useMemo(() => {
    const w = Dimensions.get('window').width;
    return (w - H_PADDING * 2 - GRID_GAP) / 2;
  }, []);

  const visibleItems = useMemo(
    () => (
      filter === 'all'
        ? ACCESSORY_ITEMS
        : ACCESSORY_ITEMS.filter((item) => item.slot.toLowerCase() === filter)
    ),
    [filter],
  );

  const equippedItem = useMemo(() => {
    const appliedId = appliedAccessories.Hat ?? appliedAccessories.Head ?? appliedAccessories.Pet;
    return ACCESSORY_ITEMS.find((item) => item.id === appliedId);
  }, [appliedAccessories]);

  const EquippedSprite = equippedItem?.Sprite ?? null;

  const completePurchase = useCallback(async (item: AccessoryItem) => {
    if (ownedIds.has(item.id)) return;
    if (item.price > 0) {
      const didSpend = await spendTokens(item.price);
      if (!didSpend) {
        Alert.alert('Not enough tokens', 'Complete quests to earn more tokens.');
        return;
      }
    }
    setOwnedIds((prev) => new Set(prev).add(item.id));
    setAppliedAccessories((prev) => ({ ...prev, [item.slot]: item.id }));
  }, [ownedIds, spendTokens]);

  const equip = useCallback((item: AccessoryItem) => {
    setAppliedAccessories((prev) => ({ ...prev, [item.slot]: item.id }));
  }, []);

  const onCustomize = useCallback(() => {
    navigation.navigate('Customize', {
      initialOwnedAccessoryIds: Array.from(ownedIds),
      initialAppliedAccessories: appliedAccessories,
    });
  }, [appliedAccessories, navigation, ownedIds]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Shop</Text>
          </View>
          <View style={styles.balanceChip}>
            <TokenPixelIcon width={18} height={18} />
            <Text style={styles.balanceText}>{balance}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTERS.map(({ key, label }, index) => {
              const active = filter === key;
              const isLast = index === FILTERS.length - 1;
              return (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[styles.filterPill, active && styles.filterPillActive, !isLast && styles.filterPillGap]}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.previewBar}>
          <View style={styles.previewIconWrap}>
            {EquippedSprite ? (
              <EquippedSprite width={56} height={56} />
            ) : (
              <Ionicons name="person" size={32} color={FEED_COLORS.textSecondary} />
            )}
          </View>
          <View style={styles.previewText}>
            <Text style={styles.previewLabel}>Your avatar</Text>
            <Text style={styles.previewEquipped} numberOfLines={1}>
              Equipped: {equippedItem?.name ?? 'Nothing yet'}
            </Text>
          </View>
          <Pressable onPress={onCustomize} style={({ pressed }) => [styles.customizeBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.customizeBtnText}>Customize</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.gridScroll}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>
            {FILTERS.find((f) => f.key === filter)?.label.toUpperCase() ?? 'ALL'}
          </Text>
          <View style={styles.grid}>
            {visibleItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const equipped = appliedAccessories[item.slot] === item.id;
              const Sprite = item.Sprite;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDetailItem(item)}
                  style={({ pressed }) => [
                    styles.card,
                    { width: columnWidth },
                    pressed && styles.cardPressed,
                    equipped && styles.cardEquipped,
                  ]}
                >
                  <View style={styles.cardPreview}>
                    <Sprite width={52} height={52} />
                    {equipped && (
                      <View style={styles.onBadge}>
                        <Text style={styles.onBadgeText}>ON</Text>
                      </View>
                    )}
                    {owned && !equipped && (
                      <View style={styles.ownedCorner}>
                        <Ionicons name="checkmark-circle" size={18} color={FEED_COLORS.item} />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.costRow}>
                      {owned ? (
                        <Text style={styles.ownedLabel}>{equipped ? 'Equipped' : 'Tap to equip'}</Text>
                      ) : (
                        <>
                          <TokenPixelIcon width={12} height={12} />
                          <Text style={styles.priceText}>{item.price === 0 ? 'Free' : item.price}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeTab="Shop" onTabPress={onTabPress} />

      {detailItem && (
        <ItemsDetailsSheet
          visible={!!detailItem}
          item={{
            id: detailItem.id,
            name: detailItem.name,
            price: detailItem.price,
            category: detailItem.slot.toLowerCase(),
            sprite: 0,
          }}
          balance={balance}
          owned={ownedIds.has(detailItem.id)}
          equipped={appliedAccessories[detailItem.slot] === detailItem.id}
          Sprite={detailItem.Sprite}
          onClose={() => setDetailItem(null)}
          onPurchase={() => {
            if (!detailItem) return;
            void completePurchase(detailItem);
          }}
          onEquip={() => {
            if (!detailItem) return;
            equip(detailItem);
          }}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: FEED_COLORS.textPrimary,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    backgroundColor: FEED_PILL_BG.token,
  },
  balanceText: {
    fontSize: 15,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: FEED_COLORS.token,
  },
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.bg,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingLeft: H_PADDING,
    paddingRight: H_PADDING + 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    flexShrink: 0,
  },
  filterPillGap: {
    marginRight: 8,
  },
  filterPillActive: {
    borderColor: FEED_COLORS.favor,
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
    color: FEED_COLORS.textSecondary,
  },
  filterLabelActive: {
    color: FEED_COLORS.favor,
    fontWeight: '600',
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: H_PADDING,
    backgroundColor: FEED_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
  },
  previewIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: FEED_COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewText: {
    flex: 1,
    gap: 4,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  previewEquipped: {
    fontSize: 12,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  customizeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: FEED_COLORS.surface2,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
  },
  customizeBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
    color: FEED_COLORS.textPrimary,
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 16,
    paddingBottom: 112,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textSecondary,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cardEquipped: {
    borderColor: FEED_COLORS.favor,
    borderWidth: 1.5,
  },
  cardPreview: {
    height: 96,
    backgroundColor: FEED_COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: FEED_COLORS.favor,
    borderBottomRightRadius: 8,
  },
  onBadgeText: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: FEED_COLORS.bg,
  },
  ownedCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  cardInfo: {
    padding: 10,
    gap: 6,
    alignItems: 'center',
  },
  itemName: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 28,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 12,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: FEED_COLORS.token,
  },
  ownedLabel: {
    fontSize: 11,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: FEED_COLORS.item,
    textAlign: 'center',
  },
});
