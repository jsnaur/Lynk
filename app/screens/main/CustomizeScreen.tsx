import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase'; 

import { 
  ACCESSORY_ITEMS, 
  AvatarSlot, 
  ALL_SLOTS_Z_ORDER, 
  BASE_TRAIT_SLOTS, 
  WEARABLE_SLOTS 
} from '../../constants/accessories';
import { withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';

type UI_CATEGORY = 'Base' | 'Wearables';

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
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const navigation = useNavigation<any>();
  
  // TESTING OVERRIDE: Automatically set all items as "Owned"
  const ownedIds = useMemo(
    () => new Set(ACCESSORY_ITEMS.map(item => item.id)),
    []
  );

  const [activeCategory, setActiveCategory] = useState<UI_CATEGORY>('Base');
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>('Body');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AvatarSlot, string>>>(
    initialAppliedAccessories ?? {}
  );
  const [savedAccessories, setSavedAccessories] = useState<Partial<Record<AvatarSlot, string>>>(
    initialAppliedAccessories ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(savedAccessories) !== JSON.stringify(appliedAccessories),
    [appliedAccessories, savedAccessories],
  );

  const saveChanges = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You need to be signed in to save changes.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ equipped_accessories: appliedAccessories })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save avatar:', error);
        Alert.alert('Error', 'Failed to save your avatar. Please try again.');
        return;
      }

      setSavedAccessories(appliedAccessories);
      navigation.goBack();
    } catch (err) {
      console.error('Error saving avatar:', err);
      Alert.alert('Error', 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSavedAccessories = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('equipped_accessories')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data || !isMounted) return;

      if (data.equipped_accessories) {
        const nextAccessories = data.equipped_accessories as Partial<Record<AvatarSlot, string>>;
        setAppliedAccessories(nextAccessories);
        setSavedAccessories(nextAccessories);
      }
    };

    loadSavedAccessories();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentSlots = activeCategory === 'Base' ? BASE_TRAIT_SLOTS : WEARABLE_SLOTS;

  // Auto-switch to the first slot of the category when changing categories
  useEffect(() => {
    setActiveSlot(currentSlots[0]);
    setSelectedAccessoryId(null);
  }, [activeCategory]);

  const slotItems = useMemo(
    () => ACCESSORY_ITEMS.filter((item) => item.slot === activeSlot),
    [activeSlot],
  );

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

  const toggleSelectedAccessory = () => {
    if (!selectedAccessory) return;

    if (!ownedIds.has(selectedAccessory.id)) {
      Alert.alert('Item locked', 'Purchase this accessory in Shop before applying it.');
      return;
    }

    const slotToUpdate = selectedAccessory.slot;
    const wasApplied = appliedAccessories[slotToUpdate] === selectedAccessory.id;

    // Instant local state update
    const newAppliedState = { ...appliedAccessories };
    if (wasApplied) {
      delete newAppliedState[slotToUpdate];
    } else {
      newAppliedState[slotToUpdate] = selectedAccessory.id;
    }
    
    setAppliedAccessories(newAppliedState);
    onApplyAccessory?.(slotToUpdate, wasApplied ? '' : selectedAccessory.id);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Customize</Text>
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
              <Pressable
                style={[styles.catBtn, activeCategory === 'Base' && styles.catBtnActive]}
                onPress={() => setActiveCategory('Base')}
              >
                <Text style={[styles.catBtnText, activeCategory === 'Base' && styles.catBtnTextActive]}>
                  Base Traits
                </Text>
              </Pressable>
              <Pressable
                style={[styles.catBtn, activeCategory === 'Wearables' && styles.catBtnActive]}
                onPress={() => setActiveCategory('Wearables')}
              >
                <Text style={[styles.catBtnText, activeCategory === 'Wearables' && styles.catBtnTextActive]}>
                  Wearables
                </Text>
              </Pressable>
            </View>

            <View style={styles.previewTextWrap}>
              <Text style={styles.previewLabel}>Active {activeSlot}</Text>
              <Text style={styles.previewName}>{activeAccessoryForSlot?.name ?? 'None'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {currentSlots.map((slot) => {
              const isActiveTab = activeSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => {
                    setActiveSlot(slot);
                    setSelectedAccessoryId(null);
                  }}
                  style={[styles.tab, isActiveTab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActiveTab && styles.tabTextActive]}>{slot}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {slotItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items available for this slot yet.</Text>
            </View>
          ) : (
            slotItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const selected = selectedAccessoryId === item.id;
              const applied = appliedAccessories[item.slot] === item.id;
              const Sprite = item.Sprite;

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
                        <Text style={styles.statePillText}>Equipped</Text>
                      </View>
                    ) : selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.item} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={toggleSelectedAccessory}
            disabled={!canInteract}
            style={({ pressed }) => [
              styles.applyBtn,
              isSelectedApplied && styles.unequipBtn, 
              !canInteract && styles.applyBtnDisabled,
              pressed && canInteract && { opacity: 0.9 },
            ]}
          >
            <Text style={[styles.applyBtnText, isSelectedApplied && styles.unequipBtnText]}>
              {!selectedAccessory 
                ? 'Select an Item' 
                : isSelectedApplied 
                  ? `Unequip ${selectedAccessory.slot}` 
                  : `Equip to ${selectedAccessory.slot}`
              }
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  backButton: { padding: 8, marginLeft: -8 },
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
  },
  saveButtonDisabled: { borderColor: colors.border, backgroundColor: colors.surface2, opacity: 0.65 },
  saveButtonText: { fontSize: 13, fontFamily: 'DMSans-Bold', fontWeight: '700', color: colors.favor },
  title: { flex: 1, fontSize: 18, fontFamily: 'DMSans-Bold', fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  previewCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: { width: 140, height: 140, backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, position: 'relative', overflow: 'hidden' },
  layerAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  previewContent: { flex: 1, justifyContent: 'space-between', height: 140, paddingVertical: 4 },
  categoryToggleContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  catBtnActive: { backgroundColor: withOpacity(colors.favor, 0.15), borderColor: colors.favor },
  catBtnText: { fontSize: 12, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  catBtnTextActive: { color: colors.favor, fontFamily: 'DMSans-Bold', fontWeight: '700' },
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