import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import BottomNav, { MainTab } from '../../components/BottomNav';
import Button from '../../components/buttons/Button';
import { ACCESSORY_ITEMS, AccessoryItem, DEFAULT_OWNED_IDS, ALL_SLOTS_Z_ORDER, AvatarSlot, getAccessoryPreviewStyle, getAccessoryById, getAvatarGenderFromAccessories, isAccessoryAllowedForGender } from '../../constants/accessories';
import { withOpacity } from '../../constants/colors';
import ItemsDetailsSheet from './Items_detailsSheet';
import { useTokenBalance } from '../../contexts/TokenContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import { supabase } from '../../lib/supabase';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';
import { useTheme, screenHeaderTheme } from '../../contexts/ThemeContext';
import ScreenHeader from '../../components/navigation/ScreenHeader';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { FONTS } from '../../constants/fonts';
import { invalidateProfileCache } from './ProfileDashboardScreen';
import { createFadeSlideStyle, createMotionValues, createStaggeredEntrance } from '../../navigation/navigationMotion';

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
  'HairBase': 'hairstyles', 'HairFringe': 'hairstyles', 'Top': 'clothing', 'Bottom': 'clothing',
  'Headgear': 'accessories', 'Accessory': 'accessories', 'LeftHand': 'accessories', 'RightHand': 'accessories',
  'BackAccessory': 'accessories', 'Background': 'backgrounds', 'Eyes': 'face', 'Mouth': 'face',
};

const GRID_GAP = 10;
const H_PADDING = 16;

const DEFAULT_AVATAR_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
  Body: 'body-masc-a', HairBase: 'hairb-flat-m', HairFringe: 'hairf-chill-m', Eyes: 'eyes-default', Mouth: 'mouth-neutral', Top: 'top-cit-m', Bottom: 'bot-cit-m',
};

function createFilterMotionValues(activeFilter: ShopCategory): Record<ShopCategory, Animated.Value> {
  return {
    all: new Animated.Value(activeFilter === 'all' ? 1 : 0),
    clothing: new Animated.Value(activeFilter === 'clothing' ? 1 : 0),
    accessories: new Animated.Value(activeFilter === 'accessories' ? 1 : 0),
    face: new Animated.Value(activeFilter === 'face' ? 1 : 0),
    hairstyles: new Animated.Value(activeFilter === 'hairstyles' ? 1 : 0),
    backgrounds: new Animated.Value(activeFilter === 'backgrounds' ? 1 : 0),
  };
}

function ensureAnimatedValue(map: Map<string, Animated.Value>, key: string, initialValue = 0) {
  const existing = map.get(key);
  if (existing) return existing;
  const next = new Animated.Value(initialValue);
  map.set(key, next);
  return next;
}

function normalizeAccessories(value: unknown): Partial<Record<AvatarSlot, string>> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Partial<Record<AvatarSlot, string>>;
  return DEFAULT_AVATAR_ACCESSORIES;
}

type ShopScreenProps = { onTabPress?: (tab: MainTab) => void; };

export default function ShopScreen({ onTabPress }: ShopScreenProps) {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
  const AnimatedPressable = useMemo(() => Animated.createAnimatedComponent(Pressable), []);

  const navigation = useNavigation<any>();
  const { balance, refreshBalance } = useTokenBalance();
  const { alert } = useCustomAlert();
  const [filter, setFilter] = useState<ShopCategory>('all');
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(DEFAULT_OWNED_IDS));
  const [detailItem, setDetailItem] = useState<AccessoryItem | null>(null);
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AvatarSlot, string>>>({});
  const screenMotion = useRef(createMotionValues(4)).current;
  const avatarPulse = useRef(new Animated.Value(0)).current;
  const filterMotion = useRef(createFilterMotionValues('all')).current;
  const cardMotionValues = useRef(new Map<string, Animated.Value>()).current;
  const ownedPulseValues = useRef(new Map<string, Animated.Value>()).current;
  const lastFilterRef = useRef<ShopCategory>('all');
  const lastOwnedIdsRef = useRef<Set<string>>(new Set(DEFAULT_OWNED_IDS));
  const hasInitializedOwnedRef = useRef(false);
  const hasAnimatedAccessoriesRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchProfileAndInventory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const [profileResult, inventoryResult] = await Promise.all([
        supabase.from('profiles').select('equipped_accessories').eq('id', user.id).single(),
        supabase.from('user_inventory').select('item_id').eq('user_id', user.id),
      ]);

      if (!mounted) return;

      if (!profileResult.error && profileResult.data) {
        setAppliedAccessories(normalizeAccessories(profileResult.data.equipped_accessories));
      }
      if (!inventoryResult.error && inventoryResult.data) {
        setOwnedIds(new Set(inventoryResult.data.map((row) => row.item_id)));
      }

      if (!profileChannel) {
        profileChannel = supabase.channel(`profiles:shop:${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, async () => {
              const { data: refreshedData } = await supabase.from('profiles').select('equipped_accessories').eq('id', user.id).single();
              if (mounted) setAppliedAccessories(normalizeAccessories(refreshedData?.equipped_accessories));
          }).subscribe();
      }
    };
    void fetchProfileAndInventory();
    return () => { mounted = false; if (profileChannel) supabase.removeChannel(profileChannel); };
  }, []);

  useEffect(() => {
    createStaggeredEntrance(screenMotion, 360, 75).start();
  }, [screenMotion]);

  const columnWidth = useMemo(() => (Dimensions.get('window').width - H_PADDING * 2 - GRID_GAP * 2) / 3, []);

  const currentGender = useMemo(() => getAvatarGenderFromAccessories(appliedAccessories), [appliedAccessories]);

  const visibleItems = useMemo(() => {
    const sellableItems = ACCESSORY_ITEMS.filter((item) => item.slot !== 'Body' && item.slot in SLOT_TO_CATEGORY);
    const genderFilteredItems = sellableItems.filter((item) => isAccessoryAllowedForGender(item, currentGender));
    const filteredItems = filter === 'all' ? genderFilteredItems : genderFilteredItems.filter((item) => SLOT_TO_CATEGORY[item.slot] === filter);
    return [...filteredItems].sort((left, right) => {
      const leftOwned = ownedIds.has(left.id);
      const rightOwned = ownedIds.has(right.id);
      if (leftOwned === rightOwned) return 0;
      return leftOwned ? 1 : -1;
    });
  }, [filter, ownedIds, currentGender]);

  useEffect(() => {
    const previousFilter = lastFilterRef.current;
    const nextValue = filterMotion[filter];
    const previousValue = filterMotion[previousFilter];

    if (previousFilter === filter) {
      nextValue.setValue(1);
      return;
    }

    previousValue.stopAnimation();
    nextValue.stopAnimation();
    Animated.parallel([
      Animated.timing(previousValue, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nextValue, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    lastFilterRef.current = filter;
  }, [filter, filterMotion]);

  useEffect(() => {
    if (!hasInitializedOwnedRef.current) {
      ownedIds.forEach((id) => {
        ensureAnimatedValue(ownedPulseValues, id, 1).setValue(1);
      });
      lastOwnedIdsRef.current = new Set(ownedIds);
      hasInitializedOwnedRef.current = true;
      return;
    }

    const newlyOwnedIds = [...ownedIds].filter((id) => !lastOwnedIdsRef.current.has(id));
    newlyOwnedIds.forEach((id) => {
      const motion = ensureAnimatedValue(ownedPulseValues, id, 0);
      motion.stopAnimation();
      motion.setValue(0);
      Animated.timing(motion, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    lastOwnedIdsRef.current = new Set(ownedIds);
  }, [ownedIds, ownedPulseValues]);

  useEffect(() => {
    if (!hasAnimatedAccessoriesRef.current) {
      hasAnimatedAccessoriesRef.current = true;
      return;
    }

    avatarPulse.stopAnimation();
    avatarPulse.setValue(0);
    Animated.sequence([
      Animated.timing(avatarPulse, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(avatarPulse, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appliedAccessories, avatarPulse]);

  useEffect(() => {
    const visibleCardAnimations = visibleItems.map((item, index) => {
      const motion = ensureAnimatedValue(cardMotionValues, item.id, 0);
      motion.stopAnimation();
      motion.setValue(0);
      return Animated.timing(motion, {
        toValue: 1,
        duration: 320,
        delay: index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    Animated.parallel(visibleCardAnimations).start();
  }, [visibleItems, cardMotionValues]);

  const completePurchase = useCallback(async (item: AccessoryItem) => {
    if (ownedIds.has(item.id)) return;
    const { error } = await supabase.rpc('purchase_item', { p_item_id: item.id, p_price: item.price });
    if (error) {
      void appSoundManager.play(AppSoundCategory.ModalClose);
      if (error.message.includes('Insufficient')) {
        alert('Not enough tokens', 'Complete quests to earn more tokens.');
      } else {
        alert('Purchase failed', 'Please try again.');
      }
      return;
    }
    setOwnedIds((prev) => new Set(prev).add(item.id));
    await refreshBalance();
    void appSoundManager.play(AppSoundCategory.PurchaseSuccess);
  }, [ownedIds, refreshBalance, alert]);

  const equipItem = useCallback(async (item: AccessoryItem) => {
    if (!ownedIds.has(item.id)) {
      alert('Item locked', 'Purchase this item before equipping it.');
      return;
    }

    if (item.slot !== 'Body' && !isAccessoryAllowedForGender(item, currentGender)) {
      alert('Wrong gender', 'This item can only be equipped with the matching body type.');
      return;
    }

    const previousAccessory = appliedAccessories[item.slot] ?? '';
    const nextAccessories = { ...appliedAccessories, [item.slot]: item.id };

    setAppliedAccessories(nextAccessories);
    void appSoundManager.play(AppSoundCategory.ItemEquip, { debounceMs: 0 });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAppliedAccessories((current) => {
        const next = { ...current };
        if (previousAccessory) {
          next[item.slot] = previousAccessory;
        } else {
          delete next[item.slot];
        }
        return next;
      });
      alert('Error', 'You need to be signed in to equip items.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ equipped_accessories: nextAccessories })
      .eq('id', user.id);

    if (!error) invalidateProfileCache();

    if (error) {
      console.error('Failed to equip item:', error);
      setAppliedAccessories((current) => {
        const next = { ...current };
        if (previousAccessory) {
          next[item.slot] = previousAccessory;
        } else {
          delete next[item.slot];
        }
        return next;
      });
      alert('Equip failed', 'Please try again.');
    }
  }, [alert, appliedAccessories, ownedIds, currentGender]);

  return (
    <View style={styles.root}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={createFadeSlideStyle(screenMotion[0], 10)}>
          <ScreenHeader
            title="Shop"
            right={
              <View style={styles.balanceChip}>
                <TokenPixelIcon width={16} height={16} />
                <Text style={styles.balanceText}>{balance}</Text>
              </View>
            }
          />
        </Animated.View>

        <Animated.View
          style={[
            createFadeSlideStyle(screenMotion[1], 12),
            {
              transform: [
                {
                  scale: avatarPulse.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.015, 1],
                  }),
                },
              ],
            },
          ]}
        >
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
            </View>

            <Button
              label="Customize"
              size="sm"
              variant="Outline"
              color={colors.border}
              leftIcon={<Ionicons name="sparkles" size={18} color={colors.favor} />}
              onPress={() => {
                void appSoundManager.play(AppSoundCategory.SetupProgress, { debounceMs: 0 });
                navigation.navigate('Customize');
              }}
              style={{ backgroundColor: colors.surface2 }}
            />
          </View>
        </Animated.View>

        <Animated.View style={createFadeSlideStyle(screenMotion[2], 10)}>
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
              {FILTERS.map(({ key, label }, index) => {
                const active = filter === key;
                const isLast = index === FILTERS.length - 1;
                const motion = filterMotion[key];
                const animatedFilterStyle = {
                  opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                  transform: [
                    {
                      scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
                    },
                    {
                      translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }),
                    },
                  ],
                };

                return (
                  <AnimatedPressable
                    key={key}
                    onPress={() => {
                      void appSoundManager.play(AppSoundCategory.TabSwitch, { debounceMs: 0 });
                      setFilter(key);
                    }}
                    style={[styles.filterPill, active && styles.filterPillActive, animatedFilterStyle, !isLast && styles.filterPillGap]}
                  >
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>

        <Animated.View style={createFadeSlideStyle(screenMotion[3], 12)}>
          <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={createFadeSlideStyle(screenMotion[3], 8)}>
              <Text style={styles.sectionLabel}>{FILTERS.find((f) => f.key === filter)?.label.toUpperCase() ?? 'ALL'}</Text>
            </Animated.View>
            <View style={styles.grid}>
              {visibleItems.map((item) => {
                const owned = ownedIds.has(item.id);
                const cardMotion = ensureAnimatedValue(cardMotionValues, item.id, 0);
                const ownedMotion = ensureAnimatedValue(ownedPulseValues, item.id, owned ? 1 : 0);

                const animatedCardStyle = createFadeSlideStyle(cardMotion, 12);
                const ownedCheckStyle = {
                  opacity: ownedMotion.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
                  transform: [
                    {
                      scale: ownedMotion.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
                    },
                  ],
                };

                return (
                  <Animated.View key={item.id} style={[animatedCardStyle, { width: columnWidth }]}>
                    <Pressable onPress={() => setDetailItem(item)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                      <View style={styles.cardPreview}>
                        {item.Sprite && React.createElement(item.Sprite, { width: 64, height: 64, style: getAccessoryPreviewStyle(item, 64) })}
                        {owned && (
                          <Animated.View style={[styles.ownedCorner, ownedCheckStyle]}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.item} />
                          </Animated.View>
                        )}
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.costRow}>
                          {owned ? (
                            <Text style={styles.ownedLabel}>Owned</Text>
                          ) : (
                            <><TokenPixelIcon width={12} height={12} /><Text style={styles.priceText}>{item.price === 0 ? 'Free' : item.price}</Text></>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
      <BottomNav activeTab="Shop" onTabPress={onTabPress} />
      {detailItem && (
        <ItemsDetailsSheet visible={!!detailItem} item={{ id: detailItem.id, name: detailItem.name, price: detailItem.price, category: SLOT_TO_CATEGORY[detailItem.slot] as Exclude<ShopCategory, 'all'>, sprite: 0, slot: detailItem.slot }} balance={balance} owned={ownedIds.has(detailItem.id)} equipped={appliedAccessories[detailItem.slot] === detailItem.id} Sprite={detailItem.Sprite as any} onClose={() => setDetailItem(null)} onPurchase={() => { if (detailItem) void completePurchase(detailItem); }} onEquip={() => { if (detailItem) void equipItem(detailItem); }} />
      )}
    </View>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: screenHeaderTheme.layout.height, paddingHorizontal: screenHeaderTheme.layout.horizontalPadding, paddingTop: screenHeaderTheme.layout.topPadding, paddingBottom: screenHeaderTheme.layout.bottomPadding, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...screenHeaderTheme.text.title, color: colors.textPrimary },
  balanceChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.45)', backgroundColor: withOpacity(colors.token, 0.18) },
  balanceText: { fontSize: 15, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: colors.token },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  avatarContainer: { width: 64, height: 64, backgroundColor: colors.surface2, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1.5, borderColor: colors.border },
  layerAbsolute: { position: 'absolute', width: '100%', height: '100%' },
  previewTextBlock: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2 },
  previewTitle: { ...TYPOGRAPHY.pixelLabel, color: colors.textPrimary },
  previewEquipped: { fontSize: 12, fontFamily: 'DMSans-Regular', fontWeight: '400', color: colors.textSecondary },
  filterRow: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg },
  filterScroll: { flexGrow: 0 },
  filterScrollContent: { paddingLeft: H_PADDING, paddingRight: H_PADDING + 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexShrink: 0 },
  filterPillGap: { marginRight: 8 },
  filterPillActive: { borderColor: colors.favor, backgroundColor: 'rgba(0, 245, 255, 0.12)' },
  filterLabel: { fontSize: 13, fontFamily: 'DMSans-Medium', fontWeight: '500', color: colors.textSecondary },
  filterLabelActive: { color: colors.favor, fontWeight: '600' },
  gridScroll: { flex: 1 },
  gridContent: { paddingHorizontal: H_PADDING, paddingTop: 16, paddingBottom: 112 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, fontFamily: 'DMSans-Bold', fontWeight: '600', color: colors.textSecondary, marginBottom: 12, alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cardPreview: { height: 96, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ownedCorner: { position: 'absolute', top: 6, right: 6 },
  cardInfo: { padding: 10, gap: 6, alignItems: 'center' },
  itemName: { fontSize: 11, fontFamily: 'DMSans-Bold', fontWeight: '600', color: colors.textPrimary, textAlign: 'center', minHeight: 28 },
  costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  priceText: { fontSize: 12, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: colors.token },
  ownedLabel: { fontSize: 11, fontFamily: 'SpaceMono-Bold', fontWeight: '700', color: colors.item, textAlign: 'center' },
});