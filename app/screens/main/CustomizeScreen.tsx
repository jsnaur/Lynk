import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase'; 
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';
import { getProfileCacheSnapshot, getShopCacheSnapshot, setProfileCacheSnapshot, setShopCacheSnapshot } from './screenCacheRegistry';

import {
  ACCESSORY_ITEMS,
  AvatarSlot,
  ALL_SLOTS_Z_ORDER,
  BASE_TRAIT_SLOTS,
  getAccessoryPreviewStyle,
  WEARABLE_SLOTS,
  DEFAULT_OWNED_IDS,
  DEFAULT_BODY_BY_GENDER,
  getAvatarGenderFromAccessories,
  isAccessoryAllowedForGender,
  type AvatarBodyGender,
} from '../../constants/accessories';
import { withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import { createFadeSlideStyle, createMotionValues, createStaggeredEntrance } from '../../navigation/navigationMotion';

type UI_CATEGORY = 'Base' | 'Wearables';

const CATEGORY_VALUES: UI_CATEGORY[] = ['Base', 'Wearables'];

function buildCategoryMotion(activeCategory: UI_CATEGORY): Record<UI_CATEGORY, Animated.Value> {
  return {
    Base: new Animated.Value(activeCategory === 'Base' ? 1 : 0),
    Wearables: new Animated.Value(activeCategory === 'Wearables' ? 1 : 0),
  };
}

function ensureAnimatedValue(map: Map<string, Animated.Value>, key: string, initialValue = 0) {
  const existing = map.get(key);
  if (existing) return existing;
  const next = new Animated.Value(initialValue);
  map.set(key, next);
  return next;
}

const DEFAULT_CUSTOMIZE_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
  Body: DEFAULT_BODY_BY_GENDER.Masc,
  HairBase: 'hairb-flat-m',
  HairFringe: 'hairf-chill-m',
  Eyes: 'eyes-default',
  Mouth: 'mouth-neutral',
  Top: 'top-cit-m',
  Bottom: 'bot-cit-m',
};

type CustomizeScreenProps = {
  initialOwnedAccessoryIds?: string[];
  initialAppliedAccessories?: Partial<Record<AvatarSlot, string>>;
  onApplyAccessory?: (slot: AvatarSlot, accessoryId: string) => void;
};

export default function CustomizeScreen({
  initialOwnedAccessoryIds,
  initialAppliedAccessories,
  onApplyAccessory,
}: CustomizeScreenProps) {
  const { colors, theme } = useTheme();
  const { alert } = useCustomAlert();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
  const AnimatedPressable = useMemo(() => Animated.createAnimatedComponent(Pressable), []);
  const initialShopCache = useMemo(() => getShopCacheSnapshot(), []);

  const navigation = useNavigation<any>();
  
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set(DEFAULT_OWNED_IDS));

  const [activeCategory, setActiveCategory] = useState<UI_CATEGORY>('Base');
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>('Body');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AvatarSlot, string>>>(
    { ...DEFAULT_CUSTOMIZE_ACCESSORIES, ...(initialAppliedAccessories ?? initialShopCache.appliedAccessories ?? {}) }
  );
  const [savedAccessories, setSavedAccessories] = useState<Partial<Record<AvatarSlot, string>>>(
    { ...DEFAULT_CUSTOMIZE_ACCESSORIES, ...(initialAppliedAccessories ?? initialShopCache.appliedAccessories ?? {}) }
  );
  const [isSaving, setIsSaving] = useState(false);
  const avatarMemoryRef = useRef<Record<AvatarBodyGender, Partial<Record<AvatarSlot, string>>>>({ Masc: {}, Fem: {} });
  const screenMotion = useRef(createMotionValues(5)).current;
  const avatarPulse = useRef(new Animated.Value(0)).current;
  const categoryMotion = useRef(buildCategoryMotion('Base')).current;
  const slotMotionValues = useRef(new Map<string, Animated.Value>()).current;
  const itemMotionValues = useRef(new Map<string, Animated.Value>()).current;
  const selectedMotionValues = useRef(new Map<string, Animated.Value>()).current;
  const lastCategoryRef = useRef<UI_CATEGORY>('Base');
  const lastSlotRef = useRef<AvatarSlot>('Body');
  const lastSelectedRef = useRef<string | null>(null);
  const hasAnimatedInitialAvatarRef = useRef(false);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(savedAccessories) !== JSON.stringify(appliedAccessories),
    [appliedAccessories, savedAccessories],
  );

  const currentGender = useMemo(() => getAvatarGenderFromAccessories(appliedAccessories), [appliedAccessories]);

  const handleGoBack = () => {
    void appSoundManager.play(AppSoundCategory.ModalClose, { debounceMs: 0 });
    navigation.goBack();
  };

  const handleCategoryChange = (category: UI_CATEGORY) => {
    if (category === activeCategory) return;

    void appSoundManager.play(AppSoundCategory.NavSwitch, { debounceMs: 0 });
    setActiveCategory(category);
  };

  const handleSlotChange = (slot: AvatarSlot) => {
    if (slot === activeSlot) return;

    void appSoundManager.play(AppSoundCategory.TabSwitch, { debounceMs: 0 });
    setActiveSlot(slot);
    setSelectedAccessoryId(null);
  };

  const handleSelectItem = (itemId: string) => {
    void appSoundManager.play(AppSoundCategory.ButtonPress);
    setSelectedAccessoryId(itemId);
  };

  const saveChanges = async () => {
    if (isSaving) return;

    void appSoundManager.play(AppSoundCategory.LikePost, { debounceMs: 0 });
    void appSoundManager.play(AppSoundCategory.XpGain, { debounceMs: 0 });

    try {
      setIsSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Error', 'You need to be signed in to save changes.');
        return;
      }

      avatarMemoryRef.current[currentGender] = { ...appliedAccessories };

      const { error } = await supabase
        .from('profiles')
        .update({ equipped_accessories: appliedAccessories })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save avatar:', error);
        alert('Error', 'Failed to save your avatar. Please try again.');
        return;
      }

      setSavedAccessories(appliedAccessories);
      setShopCacheSnapshot({ appliedAccessories });
      const existingProfile = getProfileCacheSnapshot()?.profile ?? null;
      setProfileCacheSnapshot({ profile: existingProfile ? { ...existingProfile, equipped_accessories: appliedAccessories } : { equipped_accessories: appliedAccessories } });
      navigation.goBack();
    } catch (err) {
      console.error('Error saving avatar:', err);
      alert('Error', 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfileAndInventory = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const [profileResult, inventoryResult] = await Promise.all([
        supabase.from('profiles').select('equipped_accessories').eq('id', user.id).maybeSingle(),
        supabase.from('user_inventory').select('item_id').eq('user_id', user.id),
      ]);

      if (!isMounted) return;

      if (!profileResult.error && profileResult.data?.equipped_accessories) {
        const nextAccessories = profileResult.data.equipped_accessories as Partial<Record<AvatarSlot, string>>;
        const normalizedAccessories = nextAccessories.Body ? nextAccessories : { ...nextAccessories, Body: DEFAULT_BODY_BY_GENDER.Masc };
        const profileGender = getAvatarGenderFromAccessories(normalizedAccessories);
        avatarMemoryRef.current[profileGender] = { ...normalizedAccessories };
        setAppliedAccessories(normalizedAccessories);
        setSavedAccessories(normalizedAccessories);
        setShopCacheSnapshot({ appliedAccessories: normalizedAccessories });
      }

      if (!inventoryResult.error && inventoryResult.data) {
        setOwnedIds(new Set(inventoryResult.data.map((row) => row.item_id)));
      }
    };

    loadProfileAndInventory();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    createStaggeredEntrance(screenMotion, 360, 75).start();
  }, [screenMotion]);

  const currentSlots = activeCategory === 'Base' ? BASE_TRAIT_SLOTS : WEARABLE_SLOTS;

  // Auto-switch to the first slot of the category when changing categories
  useEffect(() => {
    setActiveSlot(currentSlots[0]);
    setSelectedAccessoryId(null);
  }, [activeCategory]);

  useEffect(() => {
    const previousCategory = lastCategoryRef.current;
    const nextValue = categoryMotion[activeCategory];
    const previousValue = categoryMotion[previousCategory];

    if (previousCategory === activeCategory) {
      nextValue.setValue(1);
      return;
    }

    previousValue.stopAnimation();
    nextValue.stopAnimation();
    Animated.parallel([
      Animated.timing(previousValue, {
        toValue: 0,
        duration: 150,
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

    lastCategoryRef.current = activeCategory;
  }, [activeCategory, categoryMotion]);

  useEffect(() => {
    const previousSlot = lastSlotRef.current;
    const previousMotion = ensureAnimatedValue(slotMotionValues, previousSlot, 1);
    const nextMotion = ensureAnimatedValue(slotMotionValues, activeSlot, 0);

    if (previousSlot === activeSlot) {
      nextMotion.setValue(1);
      return;
    }

    previousMotion.stopAnimation();
    nextMotion.stopAnimation();
    Animated.parallel([
      Animated.timing(previousMotion, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nextMotion, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    lastSlotRef.current = activeSlot;
  }, [activeSlot, slotMotionValues]);

  useEffect(() => {
    if (!hasAnimatedInitialAvatarRef.current) {
      hasAnimatedInitialAvatarRef.current = true;
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

  const slotItems = useMemo(
    () => ACCESSORY_ITEMS.filter((item) => item.slot === activeSlot && isAccessoryAllowedForGender(item, currentGender)),
    [activeSlot, currentGender],
  );

  useEffect(() => {
    const visibleItemAnimations = slotItems.map((item, index) => {
      const motion = ensureAnimatedValue(itemMotionValues, item.id, 0);
      motion.stopAnimation();
      motion.setValue(0);
      return Animated.timing(motion, {
        toValue: 1,
        duration: 300,
        delay: index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    Animated.parallel(visibleItemAnimations).start();
  }, [slotItems, itemMotionValues]);

  useEffect(() => {
    const newlySelectedId = selectedAccessoryId;
    const previousSelectedId = lastSelectedRef.current;

    if (previousSelectedId && previousSelectedId !== newlySelectedId) {
      const previousMotion = ensureAnimatedValue(selectedMotionValues, previousSelectedId, 0);
      previousMotion.stopAnimation();
      Animated.timing(previousMotion, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    if (newlySelectedId) {
      const nextMotion = ensureAnimatedValue(selectedMotionValues, newlySelectedId, 0);
      nextMotion.stopAnimation();
      nextMotion.setValue(0);
      Animated.timing(nextMotion, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    lastSelectedRef.current = newlySelectedId;
  }, [selectedAccessoryId, selectedMotionValues]);

  const selectedAccessory = useMemo(
    () => ACCESSORY_ITEMS.find((item) => item.id === selectedAccessoryId),
    [selectedAccessoryId],
  );

  const activeAccessoryForSlot = useMemo(
    () => ACCESSORY_ITEMS.find((item) => item.id === appliedAccessories[activeSlot]),
    [appliedAccessories, activeSlot],
  );

  const isSelectedApplied = 
    !!selectedAccessory && appliedAccessories[selectedAccessory.slot] === selectedAccessory.id;

  const canInteract = 
    !!selectedAccessory && 
    ownedIds.has(selectedAccessory.id);

  /** Body must always stay equipped — only switch between body options. */
  const bodyUnequipBlocked =
    !!selectedAccessory && isSelectedApplied && selectedAccessory.slot === 'Body';

  const handleGenderToggle = () => {
    const nextGender: AvatarBodyGender = currentGender === 'Masc' ? 'Fem' : 'Masc';
    avatarMemoryRef.current[currentGender] = { ...appliedAccessories };

    const rememberedAccessories = avatarMemoryRef.current[nextGender];
    const nextAccessories = rememberedAccessories && rememberedAccessories.Body
      ? { ...rememberedAccessories }
      : { Body: DEFAULT_BODY_BY_GENDER[nextGender] };

    setAppliedAccessories(nextAccessories);
    setSelectedAccessoryId(null);
  };

  const toggleSelectedAccessory = () => {
    if (!selectedAccessory) return;

    if (!ownedIds.has(selectedAccessory.id)) {
      alert('Item locked', 'Purchase this accessory in Shop before applying it.');
      return;
    }

    const slotToUpdate = selectedAccessory.slot;
    const wasApplied = appliedAccessories[slotToUpdate] === selectedAccessory.id;

    if (wasApplied && slotToUpdate === 'Body') {
      alert('Body required', 'You always need a body equipped. Choose another body tone to change your look.');
      return;
    }

    void appSoundManager.play(AppSoundCategory.ItemEquip, { debounceMs: 0 });

    // Instant local state update
    const newAppliedState = { ...appliedAccessories };
    if (wasApplied) {
      delete newAppliedState[slotToUpdate];
    } else {
      newAppliedState[slotToUpdate] = selectedAccessory.id;
      void appSoundManager.play(AppSoundCategory.LikePost);
    }

    setAppliedAccessories(newAppliedState);
    avatarMemoryRef.current[currentGender] = { ...newAppliedState };
    onApplyAccessory?.(slotToUpdate, wasApplied ? '' : selectedAccessory.id);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={createFadeSlideStyle(screenMotion[0], 10)}>
          <View style={styles.header}>
            <Pressable
              onPress={handleGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <View pointerEvents="none" style={styles.titleWrap}>
              <Text style={styles.title}>Customize</Text>
            </View>
            <Pressable
              onPress={saveChanges}
              disabled={!hasUnsavedChanges || isSaving}
              style={({ pressed }) => [
                styles.saveButton,
                (!hasUnsavedChanges || isSaving) && styles.saveButtonDisabled,
                pressed && hasUnsavedChanges && !isSaving && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          </View>
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
              {ALL_SLOTS_Z_ORDER.map((slot: AvatarSlot) => {
                const accessoryId = appliedAccessories[slot];
                if (!accessoryId) return null;

                const accessory = ACCESSORY_ITEMS.find((item) => item.id === accessoryId);
                if (!accessory) return null;

                const Sprite = accessory.Sprite;

                return (
                  <View key={slot} style={styles.layerAbsolute} pointerEvents="none">
                    <Sprite width={140} height={140} />
                  </View>
                );
              })}
            </View>

            <View style={styles.previewContent}>
              <View style={styles.categoryToggleContainer}>
                {CATEGORY_VALUES.map((category, index) => {
                  const motion = categoryMotion[category];
                  const isActive = activeCategory === category;
                  const isLast = index === CATEGORY_VALUES.length - 1;
                  return (
                    <AnimatedPressable
                      key={category}
                      style={[
                        styles.catBtn,
                        !isLast && styles.catBtn,
                        isLast && styles.catBtn_last,
                        isActive && styles.catBtnActive,
                        {
                          opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                          transform: [
                            {
                              scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }),
                            },
                          ],
                        },
                      ]}
                      onPress={() => handleCategoryChange(category)}
                    >
                      <Text style={[styles.catBtnText, isActive && styles.catBtnTextActive]}>
                        {category === 'Base' ? 'Base Traits' : 'Wearables'}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <View style={styles.genderToggleContainer}>
                <Pressable
                  style={[styles.genderToggleBtn, currentGender === 'Masc' && styles.genderToggleBtnActive]}
                  onPress={currentGender === 'Masc' ? undefined : handleGenderToggle}
                  disabled={currentGender === 'Masc'}
                >
                  <Ionicons name="male" size={14} color={currentGender === 'Masc' ? colors.favor : colors.textSecondary} />
                  <Text style={[styles.genderToggleText, currentGender === 'Masc' && styles.genderToggleTextActive]}>Masc</Text>
                </Pressable>
                <Pressable
                  style={[styles.genderToggleBtn, styles.genderToggleBtn_last, currentGender === 'Fem' && styles.genderToggleBtnActive]}
                  onPress={currentGender === 'Fem' ? undefined : handleGenderToggle}
                  disabled={currentGender === 'Fem'}
                >
                  <Ionicons name="female" size={14} color={currentGender === 'Fem' ? colors.favor : colors.textSecondary} />
                  <Text style={[styles.genderToggleText, currentGender === 'Fem' && styles.genderToggleTextActive]}>Fem</Text>
                </Pressable>
              </View>

              <View style={styles.previewTextWrap}>
                <Text style={styles.previewLabel}>{currentGender === 'Masc' ? 'Masculine' : 'Feminine'} Avatar</Text>
                <Text style={styles.previewName}>{activeAccessoryForSlot?.name ?? 'None'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={createFadeSlideStyle(screenMotion[2], 10)}>
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
              {currentSlots.map((slot) => {
                const isActiveTab = activeSlot === slot;
                const motion = ensureAnimatedValue(slotMotionValues, slot, isActiveTab ? 1 : 0);
                return (
                  <AnimatedPressable
                    key={slot}
                    onPress={() => handleSlotChange(slot)}
                    style={[
                      styles.tab,
                      isActiveTab && styles.tabActive,
                      {
                        opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
                        transform: [
                          {
                            scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }),
                          },
                          {
                            translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={[styles.tabText, isActiveTab && styles.tabTextActive]}>{slot}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>

        <Animated.View style={[styles.listSection, createFadeSlideStyle(screenMotion[3], 12)]}>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {slotItems.length === 0 ? (
              <Animated.View style={createFadeSlideStyle(screenMotion[3], 6)}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No items available for this slot yet.</Text>
                </View>
              </Animated.View>
            ) : (
              slotItems.map((item) => {
                const owned = ownedIds.has(item.id);
                const selected = selectedAccessoryId === item.id;
                const applied = appliedAccessories[item.slot] === item.id;
                const Sprite = item.Sprite;
                const itemMotion = ensureAnimatedValue(itemMotionValues, item.id, 0);
                const selectedMotion = ensureAnimatedValue(selectedMotionValues, item.id, selected ? 1 : 0);

                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      createFadeSlideStyle(itemMotion, 10),
                      {
                        transform: [
                          {
                            scale: selectedMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleSelectItem(item.id)}
                      style={({ pressed }) => [
                        styles.itemCard,
                        selected && styles.itemCardSelected,
                        pressed && { opacity: 0.92 },
                      ]}
                    >
                      <View style={styles.itemLeft}>
                        <View style={styles.itemSpriteWrap}>
                          <Sprite width={40} height={40} style={getAccessoryPreviewStyle(item, 40)} />
                        </View>
                        <View>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>{owned ? 'Owned' : `Locked • ${item.price} tokens`}</Text>
                        </View>
                      </View>

                      <View style={styles.itemRight}>
                        {applied ? (
                          <View style={styles.statePill}>
                            <Text style={styles.statePillText}>Equipped</Text>
                          </View>
                        ) : selected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.item} />
                        ) : null}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>

        <Animated.View style={createFadeSlideStyle(screenMotion[4], 10)}>
          <View style={styles.footer}>
            <Pressable
              onPress={toggleSelectedAccessory}
              disabled={!canInteract || bodyUnequipBlocked}
              style={({ pressed }) => [
                styles.applyBtn,
                isSelectedApplied && !bodyUnequipBlocked && styles.unequipBtn,
                (!canInteract || bodyUnequipBlocked) && styles.applyBtnDisabled,
                pressed && canInteract && !bodyUnequipBlocked && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.applyBtnText, isSelectedApplied && !bodyUnequipBlocked && styles.unequipBtnText]}>
                {!selectedAccessory 
                  ? 'Select an Item' 
                  : bodyUnequipBlocked
                    ? 'Body is always equipped'
                    : isSelectedApplied 
                    ? `Unequip ${selectedAccessory.slot}` 
                    : `Equip to ${selectedAccessory.slot}`
                }
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  backButton: { padding: 8, marginLeft: -8, zIndex: 2 },
  saveButton: {
    minWidth: 92,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.favor,
    backgroundColor: withOpacity(colors.favor, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  saveButtonDisabled: { borderColor: colors.border, backgroundColor: colors.surface2, opacity: 0.65 },
  saveButtonText: { fontSize: 13, fontFamily: 'DMSans-Bold', fontWeight: '700', color: colors.favor },
  titleWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontFamily: 'DMSans-Bold', fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  previewCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'visible' },
  avatarContainer: { width: 140, height: 140, backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, position: 'relative', overflow: 'hidden' },
  layerAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  previewContent: { flex: 1, justifyContent: 'space-between', height: 140, paddingVertical: 4, overflow: 'visible' },
  categoryToggleContainer: { flexDirection: 'row', gap: 0, marginBottom: 12, marginTop: 2, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, overflow: 'visible' },
  catBtn: { flex: 1, paddingVertical: 8, borderRadius: 0, backgroundColor: colors.surface2, alignItems: 'center', borderWidth: 0, borderRightWidth: 1, borderRightColor: colors.border },
  catBtn_last: { borderRightWidth: 0 },
  catBtnActive: { backgroundColor: withOpacity(colors.favor, 0.14) },
  catBtnText: { fontSize: 12, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  catBtnTextActive: { color: colors.favor, fontFamily: 'DMSans-Bold', fontWeight: '700' },
  genderToggleContainer: { flexDirection: 'row', gap: 0, marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, overflow: 'visible' },
  genderToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 0, backgroundColor: colors.surface2, borderWidth: 0, borderRightWidth: 1, borderRightColor: colors.border },
  genderToggleBtn_last: { borderRightWidth: 0 },
  genderToggleBtnActive: { backgroundColor: withOpacity(colors.favor, 0.14) },
  genderToggleText: { fontSize: 12, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  genderToggleTextActive: { color: colors.favor, fontFamily: 'DMSans-Bold', fontWeight: '700' },
  previewTextWrap: { justifyContent: 'flex-end' },
  previewLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  previewName: { marginTop: 4, fontSize: 18, color: colors.textPrimary, fontFamily: 'DMSans-Bold', fontWeight: '700' },
  tabsContainer: { marginTop: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.item, borderColor: colors.item },
  tabText: { fontSize: 14, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  tabTextActive: { color: '#102010', fontFamily: 'DMSans-Bold', fontWeight: '700' },
  list: { flex: 1, marginTop: 12 },
  listSection: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  emptyState: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 16 },
  emptyStateText: { fontSize: 13, color: colors.textSecondary, fontFamily: 'DMSans-Regular' },
  itemCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCardSelected: { borderColor: colors.favor, backgroundColor: withOpacity(colors.favor, 0.15) },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemSpriteWrap: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, color: colors.textPrimary, fontFamily: 'DMSans-Bold', fontWeight: '700' },
  itemMeta: { marginTop: 2, fontSize: 12, color: colors.textSecondary, fontFamily: 'DMSans-Regular' },
  itemRight: { minWidth: 72, alignItems: 'flex-end' },
  statePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: withOpacity(colors.item, 0.14), borderWidth: 1, borderColor: withOpacity(colors.item, 0.4) },
  statePillText: { fontSize: 11, color: colors.item, fontFamily: 'DMSans-Bold', fontWeight: '700' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  applyBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.item, borderWidth: 1, borderColor: colors.item },
  unequipBtn: { backgroundColor: withOpacity(colors.error, 0.1), borderColor: withOpacity(colors.error, 0.4) },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { fontSize: 15, color: '#102010', fontFamily: 'DMSans-Bold', fontWeight: '700' },
  unequipBtnText: { color: colors.error },
});