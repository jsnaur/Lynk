import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, AccessoryItem, DEFAULT_OWNED_IDS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { COLORS, withOpacity } from '../../constants/colors';
import ItemsDetailsSheet from './Items_detailsSheet';
import { useTokenBalance } from '../../contexts/TokenContext';
import { supabase } from '../../lib/supabase';

type ShopCategory = 'all' | 'clothing' | 'accessories' | 'face' | 'hairstyles' | 'backgrounds';

const FILTERS: { key: ShopCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'face', label: 'Face' },
  { key: 'hairstyles', label: 'Hairstyles' },
  { key: 'backgrounds', label: 'Backgrounds' },
];

const SLOT_TO_CATEGORY: { [key: string]: ShopCategory } = {
  'HairBase': 'hairstyles',
  'HairFringe': 'hairstyles',
  'Top': 'clothing',
  'Bottom': 'clothing',
  'Headgear': 'accessories',
  'Accessory': 'accessories',
  'LeftHand': 'accessories',
  'RightHand': 'accessories',
  'BackAccessory': 'accessories',
  'Background': 'backgrounds',
  'Eyes': 'face',
  'Mouth': 'face',
  // 'Body' intentionally excluded so it's not mapped to a shop category
};

const GRID_GAP = 10;
const H_PADDING = 16;

const DEFAULT_AVATAR_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
  Body: 'body-masc-a',
  HairBase: 'hairb-flat-m',
  HairFringe: 'hairf-chill-m',
  Eyes: 'eyes-default',
  Mouth: 'mouth-neutral',
  Top: 'top-cit-m',
  Bottom: 'bot-cit-m',
};

function getAccessoryById(accessoryId?: string | null) {
  if (!accessoryId) return undefined;
  return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

function normalizeAccessories(value: unknown): Partial<Record<AvatarSlot, string>> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Partial<Record<AvatarSlot, string>>;
  }
  return DEFAULT_AVATAR_ACCESSORIES;
}

type ShopScreenProps = {
  onTabPress?: (tab: MainTab) => void;
};

export default function ShopScreen({ onTabPress }: ShopScreenProps) {
  const navigation = useNavigation<any>();
  const { balance, spendTokens } = useTokenBalance();
  const [filter, setFilter] = useState<ShopCategory>('all');
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(DEFAULT_OWNED_IDS));
  const [detailItem, setDetailItem] = useState<AccessoryItem | null>(null);
  
  // Later you will sync this state from the profile's `equipped_accessories` JSONB column
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AvatarSlot, string>>>({});

  useEffect(() => {
    let mounted = true;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchProfileAccessories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) {
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('equipped_accessories')
        .eq('id', user.id)
        .single();

      if (!mounted || error) {
        return;
      }

      setAppliedAccessories(normalizeAccessories(data?.equipped_accessories));

      if (!profileChannel) {
        profileChannel = supabase
          .channel(`profiles:equipped_accessories=eq.${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            async () => {
              const { data: refreshedData } = await supabase
                .from('profiles')
                .select('equipped_accessories')
                .eq('id', user.id)
                .single();

              if (!mounted) {
                return;
              }

              setAppliedAccessories(normalizeAccessories(refreshedData?.equipped_accessories));
            },
          )
          .subscribe();
      }
    };

    void fetchProfileAccessories();

    return () => {
      mounted = false;
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  const columnWidth = useMemo(() => {
    const w = Dimensions.get('window').width;
    return (w - H_PADDING * 2 - GRID_GAP * 2) / 3;
  }, []);

  const visibleItems = useMemo(
    () => {
      // Specifically filter out Body items explicitly, and anything not mapped in SLOT_TO_CATEGORY
      const sellableItems = ACCESSORY_ITEMS.filter((item) => item.slot !== 'Body' && item.slot in SLOT_TO_CATEGORY);
      
      const filteredItems = filter === 'all'
        ? sellableItems
        : sellableItems.filter((item) => SLOT_TO_CATEGORY[item.slot] === filter);

      return [...filteredItems].sort((left, right) => {
        const leftOwned = ownedIds.has(left.id);
        const rightOwned = ownedIds.has(right.id);

        if (leftOwned === rightOwned) return 0;
        return leftOwned ? 1 : -1;
      });
    },
    [filter, ownedIds],
  );

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
  }, [ownedIds, spendTokens]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="storefront" size={20} color={COLORS.textPrimary} />
            <Text style={styles.title}>Shop</Text>
          </View>
          <View style={styles.balanceChip}>
            <TokenPixelIcon width={16} height={16} />
            <Text style={styles.balanceText}>{balance}</Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.avatarContainer}>
            {ALL_SLOTS_Z_ORDER.map((slot) => {
              const accessoryId = appliedAccessories[slot];
              if (!accessoryId) return null;

              const accessory = getAccessoryById(accessoryId);
              if (!accessory) return null;

              const Sprite = accessory.Sprite;

              return (
                <View key={slot} style={styles.layerAbsolute} pointerEvents="none">
                  <Sprite width="100%" height="100%" />
                </View>
              );
            })}
          </View>

          <View style={styles.previewTextBlock}>
            <Text style={styles.previewTitle}>Your Avatar</Text>
            <Text style={styles.previewEquipped}>
              Manage inventory via Customize
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Customize')}
            style={styles.customizeButton}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.favor} />
            <Text style={styles.customizeButtonText}>Customize</Text>
          </Pressable>
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
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDetailItem(item)}
                  style={({ pressed }) => [
                    styles.card,
                    { width: columnWidth },
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardPreview}>
                    {item.Sprite && React.createElement(item.Sprite, { width: 64, height: 64 })}
                    {owned && (
                      <View style={styles.ownedCorner}>
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.item} />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.costRow}>
                      {owned ? (
                        <Text style={styles.ownedLabel}>Owned</Text>
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
            category: SLOT_TO_CATEGORY[detailItem.slot] as Exclude<ShopCategory, 'all'>,
            sprite: 0,
          }}
          balance={balance}
          owned={ownedIds.has(detailItem.id)}
          equipped={false}
          Sprite={detailItem.Sprite as any}
          onClose={() => setDetailItem(null)}
          onPurchase={() => {
            if (!detailItem) return;
            void completePurchase(detailItem);
          }}
          onEquip={() => {
            // Equipment handling managed elsewhere
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontFamily: 'DMSans-Bold', fontWeight: '700', color: COLORS.textPrimary },
  balanceChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.45)', backgroundColor: withOpacity(COLORS.token, 0.18) },
  balanceText: { fontSize: 15, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: COLORS.token },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  avatarContainer: { width: 64, height: 64, backgroundColor: COLORS.surface2, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1.5, borderColor: COLORS.border },
  layerAbsolute: { position: 'absolute', width: '100%', height: '100%' },
  customizeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface2 },
  customizeButtonText: { fontSize: 13, fontFamily: 'DMSans-Medium', fontWeight: '500', color: COLORS.textPrimary },
  previewTextBlock: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2 },
  previewTitle: { fontSize: 14, fontFamily: 'DMSans-Bold', fontWeight: '600', color: COLORS.textPrimary },
  previewEquipped: { fontSize: 12, fontFamily: 'DMSans-Regular', fontWeight: '400', color: COLORS.textSecondary },
  filterRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg },
  filterScroll: { flexGrow: 0 },
  filterScrollContent: { paddingLeft: H_PADDING, paddingRight: H_PADDING + 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, flexShrink: 0 },
  filterPillGap: { marginRight: 8 },
  filterPillActive: { borderColor: COLORS.favor, backgroundColor: 'rgba(0, 245, 255, 0.12)' },
  filterLabel: { fontSize: 13, fontFamily: 'DMSans-Medium', fontWeight: '500', color: COLORS.textSecondary },
  filterLabelActive: { color: COLORS.favor, fontWeight: '600' },
  gridScroll: { flex: 1 },
  gridContent: { paddingHorizontal: H_PADDING, paddingTop: 16, paddingBottom: 112 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, fontFamily: 'DMSans-Bold', fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  card: { borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, overflow: 'hidden' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cardPreview: { height: 96, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ownedCorner: { position: 'absolute', top: 6, right: 6 },
  cardInfo: { padding: 10, gap: 6, alignItems: 'center' },
  itemName: { fontSize: 11, fontFamily: 'DMSans-Bold', fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', minHeight: 28 },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  priceText: { fontSize: 12, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: COLORS.token },
  ownedLabel: { fontSize: 11, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: COLORS.item, textAlign: 'center' },
});