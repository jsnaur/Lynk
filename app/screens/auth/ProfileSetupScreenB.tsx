import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, type DimensionValue } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";
import { supabase } from "../../lib/supabase";
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from "../../constants/accessories";
import Button from "../../components/buttons/Button";

import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

// Inappropriate content filter
const INAPPROPRIATE_WORDS = [
  "damn", "hell", "crap", "piss", "shit", "fuck", "bitch", "ass", "dick", "cock",
  "pussy", "whore", "slut", "nigga", "nigger", "faggot", "retard", "idiot",
];

const containsInappropriateContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return INAPPROPRIATE_WORDS.some((word) => lowerText.includes(word));
};

type Props = NativeStackScreenProps<any, "ProfileSetupB">;

const ProfileSetupScreenB: FC<Props> = ({ navigation, route }) => {
  const { displayName, selectedMajor, graduationYear, selectedBodyId, gender } = route.params ?? {};
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Get selected body for avatar name display
  const BODY_OPTIONS = useMemo(() => ACCESSORY_ITEMS.filter((item) => item.slot === "Body"), []);
  const selectedBody = useMemo(() => {
    return BODY_OPTIONS.find((b) => b.id === selectedBodyId);
  }, [selectedBodyId, BODY_OPTIONS]);

  // Generate avatar title with gender and tone
  const avatarTitle = useMemo(() => {
    if (!selectedBody) return "Your Avatar";
    const genderLabel = selectedBody.gender === "Masc" ? "Masculine" : "Feminine";
    const toneMatch = selectedBody.name.match(/Tone (\w)/);
    const tone = toneMatch ? toneMatch[1] : "A";
    return `${genderLabel} ${tone}`;
  }, [selectedBody]);

  // Get icon color based on body gender
  const genderIconColor = useMemo(() => {
    if (!selectedBody) return COLORS.favor;
    return selectedBody.gender === "Masc" ? COLORS.study : COLORS.item;
  }, [selectedBody]);

  // Filter items flagged as "setup" and match the selected gender or "Shared"
  // Limited to 2 options to enforce simplicity
  const hairBaseOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'HairBase' && i.isSetup && (i.gender === gender || i.gender === 'Shared')).slice(0, 2), [gender]);
  const hairFringeOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'HairFringe' && i.isSetup && (i.gender === gender || i.gender === 'Shared')).slice(0, 2), [gender]);
  const eyesOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Eyes' && i.isSetup).slice(0, 2), []);
  const mouthOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Mouth' && i.isSetup).slice(0, 2), []);
  const topOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Top' && i.isSetup && (i.gender === gender || i.gender === 'Shared')).slice(0, 2), [gender]);
  const bottomOptions = useMemo(() => ACCESSORY_ITEMS.filter(i => i.slot === 'Bottom' && i.isSetup && (i.gender === gender || i.gender === 'Shared')).slice(0, 2), [gender]);

  const [selectedHairBaseId, setSelectedHairBaseId] = useState<string>("");
  const [selectedHairFringeId, setSelectedHairFringeId] = useState<string>("");
  const [selectedEyeId, setSelectedEyeId] = useState<string>("");
  const [selectedMouthId, setSelectedMouthId] = useState<string>("");
  const [selectedTopId, setSelectedTopId] = useState<string>("");
  const [selectedBottomId, setSelectedBottomId] = useState<string>("");

  const categoryGroups = useMemo(() => [
    { label: "HAIR BASE", options: hairBaseOptions, activeId: selectedHairBaseId, setter: setSelectedHairBaseId },
    { label: "HAIR FRINGE", options: hairFringeOptions, activeId: selectedHairFringeId, setter: setSelectedHairFringeId },
    { label: "EYES", options: eyesOptions, activeId: selectedEyeId, setter: setSelectedEyeId },
    { label: "MOUTH", options: mouthOptions, activeId: selectedMouthId, setter: setSelectedMouthId },
    { label: "TOP", options: topOptions, activeId: selectedTopId, setter: setSelectedTopId },
    { label: "BOTTOM", options: bottomOptions, activeId: selectedBottomId, setter: setSelectedBottomId },
  ], [hairBaseOptions, hairFringeOptions, eyesOptions, mouthOptions, topOptions, bottomOptions, selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  const hasSelectedAllOptions = useMemo(() => {
    return [selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId].every(Boolean);
  }, [selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  const selectedCount = useMemo(() => {
    return [selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId].filter(Boolean).length;
  }, [selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  const progressWidth = useMemo<DimensionValue>(() => `${50 + ((selectedCount / 6) * 50)}%`, [selectedCount]);

  // Current applied layers for live preview
  const activeLayers = useMemo(() => {
    const layers: Partial<Record<AvatarSlot, string>> = {};

    if (selectedBodyId) layers.Body = selectedBodyId;
    if (selectedHairBaseId) layers.HairBase = selectedHairBaseId;
    if (selectedHairFringeId) layers.HairFringe = selectedHairFringeId;
    if (selectedEyeId) layers.Eyes = selectedEyeId;
    if (selectedMouthId) layers.Mouth = selectedMouthId;
    if (selectedTopId) layers.Top = selectedTopId;
    if (selectedBottomId) layers.Bottom = selectedBottomId;

    return layers;
  }, [selectedBodyId, selectedHairBaseId, selectedHairFringeId, selectedEyeId, selectedMouthId, selectedTopId, selectedBottomId]);

  useEffect(() => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedBodyId) {
      navigation.goBack();
    }
  }, [displayName, selectedMajor, graduationYear, selectedBodyId, navigation]);

  const handleContinue = useCallback(async () => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedBodyId) {
      setErrorMessage("Please complete the profile flow.");
      return;
    }

    if (containsInappropriateContent(displayName)) {
      setErrorMessage("Display name contains inappropriate text. Please use a different name.");
      return;
    }

    if (!hasSelectedAllOptions) {
      setErrorMessage("Please choose one item in each category.");
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
  }, [displayName, selectedMajor, graduationYear, selectedBodyId, hasSelectedAllOptions, activeLayers, navigation]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: COLORS.bg }}>
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox, { flex: 1 }]}>
      <View style={localStyles.topLockedSection}>
        <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox, localStyles.stickyProgressHeader]}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={[styles.headerTextBlock, styles.textCommon]}>
            <Text style={styles.stepLabel}>Step 2 of 2</Text>
            <Text style={[styles.screenTitle, styles.screenTitleTypo]}>Set Up Your Avatar</Text>
            <Text style={[styles.screenSubtitle, styles.hintBodyTypo]}>
              Get yourself dressed.{"\n"}More wearables in the shop.
            </Text>
          </View>
        </View>

        <View style={localStyles.stickyPreviewBlock}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.hintTitle, styles.hintTitleTypo]}>{avatarTitle}</Text>
                <Ionicons 
                  name={selectedBody?.gender === "Masc" ? "male" : "female"} 
                  size={16} 
                  color={genderIconColor} 
                />
              </View>
              <Text style={[styles.hintBody, styles.hintBodyTypo]}>
                Some clothes and hair are{"\n"}locked to a specific gender.
              </Text>
            </View>
          </View>
        </View>

      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>

        <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
          {categoryGroups.map((group) => (
            <View key={group.label} style={localStyles.categorySection}>
              <View style={[styles.setupCtaBarFlexBox, localStyles.categoryHeader]}>
                <View style={styles.dividerLineL} />
                <Text style={[styles.dividerLabel, { fontFamily: FONTS.display }]}>{group.label}</Text>
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

      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: COLORS.bg, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
        <View style={localStyles.footerButtonRow}>
          <Button
            label="← Back"
            onPress={() => navigation.goBack()}
            variant="Outline"
              style={localStyles.footerButton}
          />
          <Button
            label="Continue →"
            onPress={handleContinue}
            variant="Primary"
            style={localStyles.footerButton}
          />
        </View>
      </SafeAreaView>
    </View>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  topLockedSection: {
    backgroundColor: COLORS.bg,
    width: '100%',
    alignSelf: 'stretch',
  },
  stickyProgressHeader: {
    backgroundColor: COLORS.bg,
    zIndex: 30,
    width: '100%',
    alignSelf: 'stretch',
  },
  stickyPreviewBlock: {
    backgroundColor: COLORS.bg,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 20,
    width: '100%',
    alignSelf: 'stretch',
  },
  selectedAvatarContainer: {
    width: 96, height: 96, borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden', position: 'relative',
  },
  categorySection: { width: '100%', marginTop: 20 },
  categoryHeader: { justifyContent: 'space-between', alignItems: 'center' },
  categoryRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, width: '100%' },
  customOption: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  customOptionSelected: { borderColor: COLORS.favor, backgroundColor: `rgba(0, 245, 255, 0.1)` },
  selectionBadge: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18,
    borderRadius: 9, backgroundColor: COLORS.favor, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface,
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  footerButton: {
    height: 52, 
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12, borderRadius: 12, marginHorizontal: 24, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', gap: 6,
  },
  errorText: { color: COLORS.error, fontSize: 14, fontWeight: '500' },
});

export default ProfileSetupScreenB;