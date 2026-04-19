import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { supabase } from "../../lib/supabase";
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from "../../constants/accessories";

import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

type Props = NativeStackScreenProps<any, "ProfileSetupB">;

const ProfileSetupScreenB: FC<Props> = ({ navigation, route }) => {
  const { displayName, selectedMajor, graduationYear, selectedBodyId, gender } = route.params ?? {};
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Filter items flagged as "setup" and match the selected gender or "Shared"
  const eyesOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Eyes' && i.isSetup), []);
  const mouthOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Mouth' && i.isSetup), []);
  const topOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Top' && i.isSetup && (i.gender === gender || i.gender === 'Shared')), [gender]);
  const bottomOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Bottom' && i.isSetup && (i.gender === gender || i.gender === 'Shared')), [gender]);

  const [selectedEyeId, setSelectedEyeId] = useState<string>(eyesOptions[0]?.id || "");
  const [selectedMouthId, setSelectedMouthId] = useState<string>(mouthOptions[0]?.id || "");
  const [selectedTopId, setSelectedTopId] = useState<string>(topOptions[0]?.id || "");
  const [selectedBottomId, setSelectedBottomId] = useState<string>(bottomOptions[0]?.id || "");

  const categoryGroups = useMemo(() => [
    { label: "EYES", options: eyesOptions, activeId: selectedEyeId, setter: setSelectedEyeId },
    { label: "MOUTH", options: mouthOptions, activeId: selectedMouthId, setter: setSelectedMouthId },
    { label: "TOP", options: topOptions, activeId: selectedTopId, setter: setSelectedTopId },
    { label: "BOTTOM", options: bottomOptions, activeId: selectedBottomId, setter: setSelectedBottomId },
  ], [eyesOptions, mouthOptions, topOptions, bottomOptions, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  // Current applied layers for live preview
  const activeLayers = useMemo(() => {
    const layers: Partial<Record<AvatarSlot, string>> = {
      Body: selectedBodyId,
      Eyes: selectedEyeId,
      Mouth: selectedMouthId,
      Top: selectedTopId,
      Bottom: selectedBottomId,
    };
    return layers;
  }, [selectedBodyId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  useEffect(() => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedBodyId) {
      navigation.goBack();
    }
  }, [displayName, selectedMajor, graduationYear, selectedBodyId, navigation]);

  const handleLogout = useCallback(async () => {
    setErrorMessage("");
    await supabase.auth.signOut();
  }, []);

  const handleContinue = useCallback(async () => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedBodyId) {
      setErrorMessage("Please complete the profile flow.");
      return;
    }

    setErrorMessage("");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setErrorMessage("Could not verify user session.");
        return;
      }

      // Save modular selection into the JSONB column
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          equipped_accessories: activeLayers,
          display_name: displayName.trim(),
          major: selectedMajor,
          graduation_year: graduationYear.trim()
        })
        .eq('id', user.id);

      if (updateError) {
        setErrorMessage("Failed to save profile. Please try again.");
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: "Main" as never }] });
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    }
  }, [displayName, selectedMajor, graduationYear, selectedBodyId, activeLayers, navigation]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox, { flex: 1 }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox]}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, localStyles.progressBarFillLarge]} />
          </View>
          <View style={[styles.headerTextBlock, styles.textCommon]}>
            <Text style={styles.stepLabel}>Step 2 of 2</Text>
            <Text style={[styles.screenTitle, styles.screenTitleTypo]}>Set Up Your Avatar</Text>
            <Text style={[styles.screenSubtitle, styles.hintBodyTypo]}>
              Get yourself dressed.{"\n"}More wearables in the shop.
            </Text>
          </View>
        </View>

        <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
          <View style={[styles.avatarPreviewRow, styles.setupCtaBarFlexBox]}>
            <View style={[styles.selectedAvatarFrameIcon, localStyles.selectedAvatarContainer]}>
              {ALL_SLOTS_Z_ORDER.map((slot) => {
                const accessoryId = activeLayers[slot];
                if (!accessoryId) return null;
                const accessory = ACCESSORY_ITEMS.find((item) => item.id === accessoryId);
                if (!accessory) return null;
                const Sprite = accessory.Sprite;

                return (
                  <View key={slot} style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Sprite width="100%" height="100%" />
                  </View>
                );
              })}
            </View>

            <View style={styles.textCommon}>
              <Text style={[styles.hintTitle, styles.hintTitleTypo]}>Your Avatar</Text>
              <Text style={[styles.hintBody, styles.hintBodyTypo]}>
                Represents you on the quest board.{"\n"}Unlock more in the Shop.
              </Text>
            </View>
          </View>

          {categoryGroups.map((group) => (
            <View key={group.label} style={localStyles.categorySection}>
              <View style={[styles.setupCtaBarFlexBox, localStyles.categoryHeader]}>
                <View style={styles.dividerLineL} />
                <Text style={styles.dividerLabel}>{group.label}</Text>
                <View style={styles.dividerLineL} />
              </View>
              <View style={localStyles.categoryRow}>
                {group.options.map((item) => {
                  const isSelected = item.id === group.activeId;
                  const Option = item.Sprite;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => group.setter(item.id)}
                      style={({ pressed }) => [
                        localStyles.customOption,
                        isSelected && localStyles.customOptionSelected,
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <Option width={56} height={56} />
                      {isSelected && (
                        <View style={localStyles.selectionBadge}>
                          <SelectedCheckIcon width={10} height={10} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {errorMessage ? (
          <View style={localStyles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#FF3B30" />
            <Text style={localStyles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.setupCtaBar, styles.setupCtaBarFlexBox]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.ctaButton, styles.ctaLayout, pressed && styles.ctaPressed]}
        >
          <Text style={[styles.buttonLabel, styles.buttonPosition]}>Log Out</Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.ctaButton2, styles.ctaLayout, localStyles.ctaButtonActive, pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={[styles.buttonLabel2, styles.buttonPosition, localStyles.ctaTextActive]}>
            Continue →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  progressBarFillLarge: { width: 300 },
  selectedAvatarContainer: {
    width: 96, height: 96, borderRadius: 20, backgroundColor: '#1E1E1E',
    borderWidth: 2, borderColor: '#333333', overflow: 'hidden', position: 'relative',
  },
  categorySection: { width: '100%', paddingHorizontal: 24, marginTop: 20 },
  categoryHeader: { justifyContent: 'space-between', alignItems: 'center' },
  categoryRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 16, marginTop: 12, width: '100%' },
  customOption: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: '#26262e',
    borderWidth: 1, borderColor: '#3a3a48', alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  customOptionSelected: { borderColor: '#00F5FF', backgroundColor: 'rgba(0, 245, 255, 0.1)' },
  selectionBadge: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#00F5FF', alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#1E1E1E',
  },
  ctaButtonActive: { backgroundColor: '#00F5FF', borderColor: '#00F5FF', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctaTextActive: { color: '#000000', fontWeight: 'bold' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12, borderRadius: 12, marginHorizontal: 24, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', gap: 6,
  },
  errorText: { color: '#FF3B30', fontSize: 14, fontWeight: '500' },
});

export default ProfileSetupScreenB;