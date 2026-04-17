import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase'; 

import { ACCESSORY_ITEMS, AccessorySlot, DEFAULT_OWNED_IDS, SLOTS } from '../../constants/accessories';
import { FEED_COLORS, FEED_PILL_BG } from '../../constants/colors';

type CustomizeScreenProps = {
  initialOwnedAccessoryIds?: string[];
  initialAppliedAccessories?: Partial<Record<AccessorySlot, string>>;
  onApplyAccessory?: (slot: AccessorySlot, accessoryId: string) => void;
};

export default function CustomizeScreen({
  initialOwnedAccessoryIds,
  initialAppliedAccessories,
  onApplyAccessory,
}: CustomizeScreenProps) {
  
  // TESTING OVERRIDE: Automatically set all items as "Owned"
  const ownedIds = useMemo(
    () => new Set(ACCESSORY_ITEMS.map(item => item.id)),
    []
  );

  const [activeSlot, setActiveSlot] = useState<AccessorySlot>('Hat');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [appliedAccessories, setAppliedAccessories] = useState<Partial<Record<AccessorySlot, string>>>(
    initialAppliedAccessories ?? {}
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSavedAccessories = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('user_avatars')
        .select('hat, head, pet, effects, frame')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data || !isMounted) return;

      setAppliedAccessories({
        Hat: data.hat ?? undefined,
        Head: data.head ?? undefined,
        Pet: data.pet ?? undefined,
        Effects: data.effects ?? undefined,
        Frame: data.frame ?? undefined,
      });
    };

    loadSavedAccessories();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // You can interact if an item is selected, you own it, and it's not currently saving.
  const canInteract = 
    !!selectedAccessory && 
    ownedIds.has(selectedAccessory.id) && 
    !isSaving;

  const toggleSelectedAccessory = async () => {
    if (!selectedAccessory) return;

    if (!ownedIds.has(selectedAccessory.id)) {
      Alert.alert('Item locked', 'Purchase this accessory in Shop before applying it.');
      return;
    }

    const previousAppliedState = appliedAccessories;
    const slotToUpdate = selectedAccessory.slot;

    // 1. Optimistic UI Update (Equip OR Unequip)
    const newAppliedState = { ...appliedAccessories };
    
    if (isSelectedApplied) {
      // If it's already applied, we unequip it
      delete newAppliedState[slotToUpdate];
    } else {
      // Otherwise, we equip it
      newAppliedState[slotToUpdate] = selectedAccessory.id;
    }
    
    setAppliedAccessories(newAppliedState);
    setIsSaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setAppliedAccessories(previousAppliedState);
      setIsSaving(false);
      Alert.alert('Authentication required', 'Please log in again to save your accessory.');
      return;
    }

    // 2. Save to Supabase user_avatars table
    const { error } = await supabase
      .from('user_avatars')
      .upsert({
        user_id: user.id,
        hat: newAppliedState.Hat || null,
        head: newAppliedState.Head || null,
        pet: newAppliedState.Pet || null,
        effects: newAppliedState.Effects || null,
        frame: newAppliedState.Frame || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(error);
      setAppliedAccessories(previousAppliedState);
      Alert.alert('Error', 'Failed to save accessory. Please try again.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onApplyAccessory?.(slotToUpdate, isSelectedApplied ? '' : selectedAccessory.id);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Customize your Avatar</Text>
        </View>

        <View style={styles.previewCard}>
          {/* Wrapped in a relative container so the Pet frame can hang outside */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {/* Base Avatar */}
              <Ionicons name="person" size={48} color={FEED_COLORS.textPrimary} style={styles.baseAvatar} />

              {/* Render all applied accessories on the avatar EXCEPT the Pet */}
              {SLOTS.filter(slot => slot !== 'Pet').map((slot) => {
                const accessoryId = appliedAccessories[slot];
                if (!accessoryId) return null;

                const accessory = ACCESSORY_ITEMS.find((item) => item.id === accessoryId);
                if (!accessory) return null;

                const Sprite = accessory.Sprite; // FIX 1: Use .Sprite
                
                const overlayStyle = 
                  slot === 'Hat' ? styles.overlayHat :
                  slot === 'Head' ? styles.overlayHead :
                  slot === 'Effects' ? styles.overlayFilter :
                  slot === 'Frame' ? styles.overlayFrame : {};

                const iconSize = (slot === 'Frame' || slot === 'Effects') ? 84 : 40;

                return (
                  <View key={slot} style={[styles.overlayBase, overlayStyle]} pointerEvents="none">
                    <Sprite width={iconSize} height={iconSize} />
                  </View>
                );
              })}
            </View>

            {/* Separate Pet Frame */}
            <View style={styles.petFrame}>
              {(() => {
                const petId = appliedAccessories['Pet'];
                if (!petId) return (
                  <Ionicons name="paw" size={16} color={FEED_COLORS.textSecondary} style={{ opacity: 0.3 }} />
                );
                
                const petItem = ACCESSORY_ITEMS.find(item => item.id === petId);
                if (!petItem) return null;

                const PetSprite = petItem.Sprite; // FIX 2: Use .Sprite
                return <PetSprite width={24} height={24} />;
              })()}
            </View>
          </View>

          <View style={styles.previewTextWrap}>
            <Text style={styles.previewLabel}>Active {activeSlot}</Text>
            <Text style={styles.previewName}>{activeAccessoryForSlot?.name ?? 'None'}</Text>
          </View>
        </View>

        {/* Slot Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {SLOTS.map((slot) => {
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
              <Text style={styles.emptyStateText}>No accessories available for this slot yet.</Text>
            </View>
          ) : (
            slotItems.map((item) => {
              const owned = ownedIds.has(item.id);
              const selected = selectedAccessoryId === item.id;
              const applied = appliedAccessories[item.slot] === item.id;
              const Sprite = item.Sprite; // FIX 3: Use .Sprite

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
              {isSaving 
                ? 'Saving...' 
                : !selectedAccessory 
                  ? 'Select an Item' 
                  : isSelectedApplied 
                    ? `Unequip ${selectedAccessory.slot}` 
                    : `Apply to ${selectedAccessory.slot}`
              }
            </Text>
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
  avatarContainer: {
    position: 'relative',
    width: 84,
    height: 84,
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
    position: 'relative', 
    overflow: 'hidden', 
  },
  petFrame: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FEED_COLORS.surface,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  baseAvatar: {
    zIndex: 2, 
  },
  overlayBase: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayHat: {
    top: -12,
    zIndex: 4, 
  },
  overlayHead: {
    top: 20,
    zIndex: 3, 
  },
  overlayFilter: {
    width: 84,
    height: 84,
    zIndex: 8,
    opacity: 0.4,
  },
  overlayFrame: {
    width: 84,
    height: 84,
    borderRadius: 42,
    zIndex: 10,
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
  tabsContainer: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: FEED_COLORS.surface,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
  },
  tabActive: {
    backgroundColor: FEED_COLORS.item,
    borderColor: FEED_COLORS.item,
  },
  tabText: {
    fontSize: 14,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Medium',
  },
  tabTextActive: {
    color: '#102010',
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
    borderWidth: 1,
    borderColor: FEED_COLORS.item,
  },
  unequipBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: 'rgba(255, 68, 68, 0.4)',
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
  unequipBtnText: {
    color: '#ff4444',
  },
});