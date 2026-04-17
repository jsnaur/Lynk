import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { supabase } from "../../lib/supabase";
import { FEED_COLORS } from "../../constants/colors";
import { ImageSprite } from "../../components/sprites";
import { ACCESSORY_ITEMS, DEFAULT_OWNED_IDS } from "../../constants/accessories";

import BaseMasc_A from "../../../assets/AvatarAssets/Masculine/BaseMasc_A.png";
import BaseMasc_B from "../../../assets/AvatarAssets/Masculine/BaseMasc_B.png";
import BaseMasc_C from "../../../assets/AvatarAssets/Masculine/BaseMasc_C.png";
import BaseMasc_D from "../../../assets/AvatarAssets/Masculine/BaseMasc_D.png";
import BaseFem_A from "../../../assets/AvatarAssets/Feminine/BaseFem_A.png";
import BaseFem_B from "../../../assets/AvatarAssets/Feminine/BaseFem_B.png";
import BaseFem_C from "../../../assets/AvatarAssets/Feminine/BaseFem_C.png";
import BaseFem_D from "../../../assets/AvatarAssets/Feminine/BaseFem_D.png";

type Props = NativeStackScreenProps<any, "ProfileSetup">;

type BodyType = 'body-m-1' | 'body-m-2' | 'body-m-3' | 'body-m-4' | 'body-f-1' | 'body-f-2' | 'body-f-3' | 'body-f-4';
type Gender = 'male' | 'female';

const BODY_TYPES: { id: BodyType; name: string; gender: Gender; source: any }[] = [
  { id: 'body-f-1', name: 'Light', gender: 'female', source: BaseFem_A },
  { id: 'body-f-2', name: 'Medium Light', gender: 'female', source: BaseFem_B },
  { id: 'body-f-3', name: 'Medium Dark', gender: 'female', source: BaseFem_C },
  { id: 'body-f-4', name: 'Dark', gender: 'female', source: BaseFem_D },
  { id: 'body-m-1', name: 'Light', gender: 'male', source: BaseMasc_A },
  { id: 'body-m-2', name: 'Medium Light', gender: 'male', source: BaseMasc_B },
  { id: 'body-m-3', name: 'Medium Dark', gender: 'male', source: BaseMasc_C },
  { id: 'body-m-4', name: 'Dark', gender: 'male', source: BaseMasc_D },
];

const ACCESSORY_SLOT_NAMES = {
  'HairBase': 'Hair',
  'Eyes': 'Eyes',
  'Mouth': 'Mouth',
};

const ProfileSetupScreen: FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedBodyId, setSelectedBodyId] = useState<BodyType>('body-f-1');
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(
    new Set(['hair-base-1', 'eyes-normal', 'mouth-smile'])
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedBodyType = BODY_TYPES.find(b => b.id === selectedBodyId)!;
  const bodyGender = selectedBodyType.gender;

  // Get accessories filtered by gender
  const availableAccessories = useMemo(() => {
    const slots = ['HairBase', 'Eyes', 'Mouth'];
    return slots.map(slot => ({
      slot,
      items: ACCESSORY_ITEMS.filter(item => 
        item.slot === slot && 
        DEFAULT_OWNED_IDS.has(item.id)
      )
    })).filter(group => group.items.length > 0);
  }, []);

  const emptySlots = useMemo(() => {
    const slots = ['HairBase', 'Eyes', 'Mouth'];
    return slots.filter(slot => 
      !availableAccessories.some(group => group.slot === slot)
    );
  }, [availableAccessories]);

  const handleLogout = useCallback(async () => {
    setErrorMessage("");
    await supabase.auth.signOut();
  }, []);

  const handleContinue = useCallback(async () => {
    if (step === 1) {
      if (!displayName.trim()) {
        setErrorMessage("Please enter a display name.");
        return;
      }
      setErrorMessage("");
      setStep(2);
      return;
    }

    // Step 2: Complete profile
    setErrorMessage("");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setErrorMessage("Could not verify user session.");
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_body: selectedBodyId,
          avatar_accessories: Array.from(selectedAccessories),
          display_name: displayName.trim(),
        })
        .eq('id', user.id);

      if (updateError) {
        setErrorMessage("Failed to save profile. Please try again.");
        return;
      }

      // Switch to Main Stack safely
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" as never }],
      });
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    }
  }, [step, displayName, selectedBodyId, selectedAccessories, navigation]);

  const handleBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      setErrorMessage("");
    }
  }, [step]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox]}>
      <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox]}>
        <View style={[styles.headerTextBlock, styles.textCommon]}>
          <Text style={[styles.screenTitle, styles.screenTitleTypo]}>
            {step === 1 ? 'Create Your Avatar' : 'Customize Your Look'}
          </Text>
          <Text style={[styles.screenSubtitle, styles.hintBodyTypo]}>
            {step === 1 
              ? `Step 1 of 2: Choose your body type${"\n"}This is public on your campus.`
              : `Step 2 of 2: Choose your features${"\n"}Hair, eyes, and expression.`
            }
          </Text>
        </View>
      </View>

      {step === 1 ? (
        <>
          {/* STEP 1: Display Name & Body Type */}
          <View style={[styles.utilityInfoForm, styles.utilityInfoFormFlexBox]}>
            <Text style={[styles.fieldGroupLabel, styles.hintTitleTypo]}>
              YOUR INFO
            </Text>

            <View style={styles.fieldLayout}>
              <TextInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Display Name (visible to campus)"
                placeholderTextColor={FEED_COLORS.textSecondary}
                style={[styles.textInput, localStyles.textInputColorOverride]}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* BODY TYPE SELECTION */}
          <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
            <View style={styles.setupCtaBarFlexBox}>
              <View style={styles.dividerLineL} />
              <Text style={styles.dividerLabel}>FEMALE BODY TYPES</Text>
              <View style={styles.dividerLineL} />
            </View>

            <ScrollView style={localStyles.bodyTypeGrid} contentContainerStyle={localStyles.bodyTypeGridContent} horizontal showsHorizontalScrollIndicator={false}>
              {BODY_TYPES.filter(b => b.gender === 'female').map((bodyType) => {
                const isSelected = selectedBodyId === bodyType.id;
                return (
                  <Pressable
                    key={bodyType.id}
                    onPress={() => setSelectedBodyId(bodyType.id as BodyType)}
                    style={[
                      localStyles.bodyTypeOption,
                      isSelected && localStyles.bodyTypeOptionSelected,
                    ]}
                  >
                    <View style={localStyles.bodyTypePreview}>
                      <ImageSprite source={bodyType.source} width={64} height={64} />
                    </View>
                    <Text style={localStyles.bodyTypeLabel}>{bodyType.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.setupCtaBarFlexBox}>
              <View style={styles.dividerLineL} />
              <Text style={styles.dividerLabel}>MALE BODY TYPES</Text>
              <View style={styles.dividerLineL} />
            </View>

            <ScrollView style={localStyles.bodyTypeGrid} contentContainerStyle={localStyles.bodyTypeGridContent} horizontal showsHorizontalScrollIndicator={false}>
              {BODY_TYPES.filter(b => b.gender === 'male').map((bodyType) => {
                const isSelected = selectedBodyId === bodyType.id;
                return (
                  <Pressable
                    key={bodyType.id}
                    onPress={() => setSelectedBodyId(bodyType.id as BodyType)}
                    style={[
                      localStyles.bodyTypeOption,
                      isSelected && localStyles.bodyTypeOptionSelected,
                    ]}
                  >
                    <View style={localStyles.bodyTypePreview}>
                      <ImageSprite source={bodyType.source} width={64} height={64} />
                    </View>
                    <Text style={localStyles.bodyTypeLabel}>{bodyType.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      ) : (
        <>
          {/* STEP 2: Accessories */}
          <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
            <View style={styles.setupCtaBarFlexBox}>
              <View style={styles.dividerLineL} />
              <Text style={styles.dividerLabel}>CUSTOMIZE</Text>
              <View style={styles.dividerLineL} />
            </View>

            {/* Available Accessory Groups */}
            {availableAccessories.map((group) => (
              <View key={group.slot} style={localStyles.accessorySection}>
                <Text style={localStyles.accessorySectionTitle}>
                  {ACCESSORY_SLOT_NAMES[group.slot as keyof typeof ACCESSORY_SLOT_NAMES]}
                </Text>
                <ScrollView 
                  style={localStyles.accessoryGrid} 
                  contentContainerStyle={localStyles.accessoryGridContent}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {group.items.map((item) => {
                    const isSelected = selectedAccessories.has(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          const newAccessories = new Set(selectedAccessories);
                          // Replace other items in same slot
                          const sameSlotIds = group.items.map(i => i.id);
                          sameSlotIds.forEach(id => newAccessories.delete(id));
                          newAccessories.add(item.id);
                          setSelectedAccessories(newAccessories);
                        }}
                        style={[
                          localStyles.accessoryOption,
                          isSelected && localStyles.accessoryOptionSelected,
                        ]}
                      >
                        <View style={localStyles.accessoryPreview}>
                          {item.Sprite && React.createElement(item.Sprite, { width: 56, height: 56 })}
                        </View>
                        <Text style={localStyles.accessoryLabel} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}

            {/* Empty States */}
            {emptySlots.length > 0 && (
              <View style={localStyles.emptyStateContainer}>
                <Ionicons name="alert-circle-outline" size={24} color={FEED_COLORS.textSecondary} />
                <Text style={localStyles.emptyStateTitle}>More Coming Soon</Text>
                <Text style={localStyles.emptyStateText}>
                  {emptySlots.map(slot => ACCESSORY_SLOT_NAMES[slot as keyof typeof ACCESSORY_SLOT_NAMES]).join(', ')} options will be available in the Shop soon.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage ? (
        <View style={localStyles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={localStyles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* BUTTONS */}
      <View style={[styles.setupCtaBar, styles.setupCtaBarFlexBox]}>
        {step === 2 && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.ctaButton,
              styles.ctaLayout,
              pressed && styles.ctaPressed
            ]}
          >
            <Text style={[styles.buttonLabel, styles.buttonPosition]}>
              ← Back
            </Text>
          </Pressable>
        )}

        {step === 1 && (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.ctaButton,
              styles.ctaLayout,
              pressed && styles.ctaPressed
            ]}
          >
            <Text style={[styles.buttonLabel, styles.buttonPosition]}>
              Log Out
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.ctaButton2,
            styles.ctaLayout,
            localStyles.ctaButtonActive,
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={[styles.buttonLabel2, styles.buttonPosition, localStyles.ctaTextActive]}>
            {step === 1 ? 'Next →' : 'Create Profile →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  textInputColorOverride: {
    color: '#FFFFFF',
  },
  bodyTypeGrid: {
    marginVertical: 12,
  },
  bodyTypeGridContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 12,
  },
  bodyTypeOption: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1E1E1E',
    minWidth: 90,
  },
  bodyTypeOptionSelected: {
    borderColor: '#00F5FF',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  bodyTypePreview: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bodyTypeLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  accessorySection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  accessorySectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: '#8a8a9a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accessoryGrid: {
    marginBottom: 8,
  },
  accessoryGridContent: {
    paddingHorizontal: 0,
    gap: 12,
    paddingRight: 16,
  },
  accessoryOption: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1E1E1E',
    minWidth: 80,
  },
  accessoryOptionSelected: {
    borderColor: '#00F5FF',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  accessoryPreview: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accessoryLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyStateContainer: {
    marginVertical: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 138, 154, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 138, 154, 0.2)',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: '#8a8a9a',
    textAlign: 'center',
  },
  ctaButtonActive: {
    backgroundColor: '#00F5FF',
    borderColor: '#00F5FF',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    gap: 6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default ProfileSetupScreen;