// app/screens/auth/ProfileSetupScreenA.tsx

import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { COLORS } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";
import { supabase } from "../../lib/supabase";
import { ACCESSORY_ITEMS } from "../../constants/accessories";
import Button from "../../components/buttons/Button";

import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

const majorOptions = [
  "Computer Science", "Information Technology", "Business", "Architecture",
  "Computer Engineering", "Electrical Engineering", "Mechanical Engineering",
  "Chemical Engineering", "Industrial Engineering", "Mechatronics Engineering",
  "Civil Engineering", "Mining Engineering", "Electronics Engineering",
  "Psychology", "Nursing", "Criminology", "Accounting",
  "Tourism Management", "Hotel Management",
];

const graduationYearOptions = ["2026", "2027", "2028", "2029", "2030", "2031", "2032"];

// Inappropriate content filter
const INAPPROPRIATE_WORDS = [
  "damn", "hell", "crap", "piss", "shit", "fuck", "bitch", "ass", "dick", "cock",
  "pussy", "whore", "slut", "nigga", "nigger", "faggot", "retard", "idiot",
];

const containsInappropriateContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return INAPPROPRIATE_WORDS.some((word) => lowerText.includes(word));
};

// Fetch exactly the 8 body base types
const BODY_OPTIONS = ACCESSORY_ITEMS.filter((item) => item.slot === "Body");
const defaultSelectedId = BODY_OPTIONS[0]?.id || "";

type Props = NativeStackScreenProps<any, "ProfileSetup">;

const ProfileSetupScreenA: FC<Props> = ({ navigation }) => {
  const [selectedBodyId, setSelectedBodyId] = useState<string>(defaultSelectedId);
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [majorOpen, setMajorOpen] = useState<boolean>(false);
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [yearOpen, setYearOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [displayNameError, setDisplayNameError] = useState<string>("");

  // Check if display name is valid
  const isDisplayNameValid = useMemo(() => {
    return displayName.trim() !== "" && !containsInappropriateContent(displayName);
  }, [displayName]);

  const SelectedAvatarBody = useMemo(() => {
    return BODY_OPTIONS.find((f) => f.id === selectedBodyId)?.Sprite;
  }, [selectedBodyId]);

  // Calculate progress: 4 fields = 50% when all filled
  const progressPercentage = useMemo(() => {
    const filledFields = [
      displayName.trim() !== "",
      selectedMajor !== "",
      graduationYear !== "",
      selectedBodyId !== "",
    ].filter(Boolean).length;
    return (filledFields / 4) * 50; // 0-50% for Step 1
  }, [displayName, selectedMajor, graduationYear, selectedBodyId]);

  // Get selected body for avatar name
  const selectedBody = useMemo(() => {
    return BODY_OPTIONS.find((b) => b.id === selectedBodyId);
  }, [selectedBodyId]);

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

  const handleContinue = useCallback(() => {
    if (!displayName.trim() || !selectedMajor || !graduationYear || !selectedBodyId) {
      setErrorMessage("Please complete all fields to continue.");
      return;
    }

    if (containsInappropriateContent(displayName)) {
      setDisplayNameError("Display name contains inappropriate text. Please choose a different name.");
      setErrorMessage("");
      return;
    }

    setErrorMessage("");
    setDisplayNameError("");
    setMajorOpen(false);
    setYearOpen(false);

    navigation.navigate("ProfileSetupB", {
      displayName: displayName.trim(),
      selectedMajor,
      graduationYear,
      selectedBodyId,
      gender: selectedBody?.gender || "Shared", // Pass the chosen gender forward
    });
  }, [navigation, selectedBodyId, displayName, selectedMajor, graduationYear, selectedBody]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox, { flex: 1 }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox]}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
        <View style={[styles.headerTextBlock, styles.textCommon]}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
          <Text style={[styles.screenTitle, styles.screenTitleTypo]}>Set Up Your Profile</Text>
          <Text style={[styles.screenSubtitle, styles.hintBodyTypo]}>
            Tell us about yourself.{"\n"}This is public on your campus.
          </Text>
        </View>
      </View>

      <View style={[styles.utilityInfoForm, styles.utilityInfoFormFlexBox]}>
        <Text style={[styles.fieldGroupLabel, styles.hintTitleTypo]}>YOUR INFO</Text>

        <View style={[styles.fieldLayout, 
          displayNameError ? localStyles.fieldLayoutError : 
          isDisplayNameValid ? localStyles.fieldLayoutSuccess : {}
        ]}>
          <TextInput
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (text.trim() && containsInappropriateContent(text)) {
                setDisplayNameError("This contains sensitive text. Invalid display name.");
              } else {
                setDisplayNameError("");
              }
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="Display Name (visible to campus)"
            placeholderTextColor={COLORS.textSecondary}
            style={[styles.textInput, localStyles.textInputColorOverride]}
            autoCapitalize="words"
          />
        </View>
        {displayNameError ? (
          <View style={localStyles.errorMessageContainer}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={localStyles.errorMessageText}>{displayNameError}</Text>
          </View>
        ) : null}

        <View style={[styles.dropdownWrapper, majorOpen && styles.dropdownWrapperOnTop]}>
          <Pressable
            onPress={() => {
              setMajorOpen((v) => !v);
              setYearOpen(false);
              if (errorMessage) setErrorMessage("");
            }}
            style={({ pressed }) => [
              localStyles.dropdownTrigger,
              selectedMajor && !majorOpen && localStyles.dropdownTriggerSuccess,
              majorOpen && localStyles.dropdownTriggerOpen,
              pressed && localStyles.dropdownTriggerPressed,
            ]}
          >
            <View style={localStyles.dropdownTextContainer}>
              <Text
                style={[
                  localStyles.dropdownTriggerText,
                  selectedMajor ? localStyles.dropdownTextSelected : localStyles.dropdownTextPlaceholder,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedMajor || "Select your major..."}
              </Text>
            </View>
            <Ionicons
              name={majorOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={selectedMajor ? COLORS.textPrimary : COLORS.textSecondary}
            />
          </Pressable>

          {majorOpen && (
            <View style={styles.majorDropdownList}>
              <ScrollView
                style={styles.majorDropdownScroll}
                contentContainerStyle={styles.majorDropdownContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {majorOptions.map((major) => (
                  <Pressable
                    key={major}
                    onPress={() => {
                      setSelectedMajor(major);
                      setMajorOpen(false);
                      if (errorMessage) setErrorMessage("");
                    }}
                    style={({ pressed }) => [styles.majorDropdownOption, pressed && styles.majorDropdownOptionPressed]}
                  >
                    <Text style={styles.dropdownOptionText}>{major}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.dropdownWrapper, yearOpen && styles.dropdownWrapperOnTop]}>
          <Pressable
            onPress={() => {
              setYearOpen((v) => !v);
              setMajorOpen(false);
              if (errorMessage) setErrorMessage("");
            }}
            style={({ pressed }) => [
              localStyles.dropdownTrigger,
              graduationYear && !yearOpen && localStyles.dropdownTriggerSuccess,
              yearOpen && localStyles.dropdownTriggerOpen,
              pressed && localStyles.dropdownTriggerPressed,
            ]}
          >
            <View style={localStyles.dropdownTextContainer}>
              <Text
                style={[
                  localStyles.dropdownTriggerText,
                  graduationYear ? localStyles.dropdownTextSelected : localStyles.dropdownTextPlaceholder,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {graduationYear || "Select graduation year..."}
              </Text>
            </View>
            <Ionicons
              name={yearOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={graduationYear ? COLORS.textPrimary : COLORS.textSecondary}
            />
          </Pressable>

          {yearOpen && (
            <View style={styles.yearDropdownList}>
              <ScrollView
                style={styles.yearDropdownScroll}
                contentContainerStyle={styles.yearDropdownContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {graduationYearOptions.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setGraduationYear(year);
                      setYearOpen(false);
                      if (errorMessage) setErrorMessage("");
                    }}
                    style={({ pressed }) => [styles.yearDropdownOption, pressed && styles.yearDropdownOptionPressed]}
                  >
                    <Text style={styles.dropdownOptionText}>{year}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
        <View style={styles.setupCtaBarFlexBox}>
          <View style={styles.dividerLineL} />
          <Text style={[styles.dividerLabel, { fontFamily: FONTS.display }]}>CHOOSE YOUR BASE</Text>
          <View style={styles.dividerLineL} />
        </View>

        <View style={[styles.avatarPreviewRow, styles.setupCtaBarFlexBox]}>
          <View style={[styles.selectedAvatarFrameIcon, localStyles.selectedAvatarContainer]}>
            {SelectedAvatarBody && <SelectedAvatarBody width={80} height={80} />}
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
              Represents you on the quest board.{"\n"}Unlock more in the Shop.
            </Text>
          </View>
        </View>

        <View style={styles.avatarGrid}>
          {BODY_OPTIONS.map((item) => {
            const isSelected = selectedBodyId === item.id;
            const AvatarComponent = item.Sprite;

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedBodyId(item.id)}
                style={({ pressed }) => [
                  styles.avatarGridItem,
                  styles.avatarItemLayout,
                  localStyles.gridAvatarContainer,
                  isSelected && localStyles.gridAvatarSelected,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <AvatarComponent width={56} height={56} />

                {isSelected && (
                  <View style={localStyles.checkBadge}>
                    <SelectedCheckIcon width={10} height={10} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

        {errorMessage ? (
          <View style={localStyles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#FF3B30" />
            <Text style={localStyles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Ensured the SafeAreaView natively stretches content and wraps the button perfectly */}
      <SafeAreaView style={{ backgroundColor: COLORS.bg, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, alignSelf: 'stretch' }}>
        <Button
          label="Continue →"
          onPress={handleContinue}
          variant="Primary"
          disabled={!displayName.trim() || !selectedMajor || !graduationYear || !selectedBodyId}
          style={localStyles.continueButton}
        />
      </SafeAreaView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  textInputColorOverride: { color: COLORS.textPrimary },
  dropdownTrigger: {
    minHeight: 52,
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerSuccess: {
    borderColor: COLORS.item,
    borderWidth: 2,
  },
  dropdownTriggerPressed: {
    opacity: 0.85,
  },
  dropdownTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  dropdownTriggerText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'left',
    fontFamily: FONTS.body,
    includeFontPadding: false,
  },
  dropdownTextSelected: { color: COLORS.textPrimary },
  dropdownTextPlaceholder: { color: COLORS.textSecondary },
  selectedAvatarContainer: {
    width: 96, height: 96, borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border, overflow: 'hidden',
    position: 'relative', alignItems: 'center', justifyContent: 'center'
  },
  gridAvatarContainer: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: 'transparent', overflow: 'hidden',
    position: 'relative', margin: 4, alignItems: 'center', justifyContent: 'center'
  },
  gridAvatarSelected: { borderColor: COLORS.favor },
  checkBadge: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: COLORS.favor, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface
  },
  // Removed `width: '100%'` and `paddingHorizontal: 0` to prevent layout clipping and padding overlap
  continueButton: { 
    height: 52, 
    alignSelf: 'stretch' 
  },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 12, borderRadius: 12,
    marginHorizontal: 24, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', gap: 6,
  },
  errorText: { color: COLORS.error, fontSize: 14, fontWeight: '500' },
  fieldLayoutError: { borderColor: COLORS.error, borderWidth: 2 },
  fieldLayoutSuccess: { borderColor: COLORS.item, borderWidth: 2 },
  errorMessageContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 24, marginTop: 4, marginBottom: 14,
    height: 20
  },
  errorMessageText: { color: COLORS.error, fontSize: 12, fontWeight: '500' }
});

export default ProfileSetupScreenA;