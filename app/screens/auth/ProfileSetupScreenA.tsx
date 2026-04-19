import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { COLORS } from "../../constants/colors";
import { supabase } from "../../lib/supabase";
import { ACCESSORY_ITEMS } from "../../constants/accessories";

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

  const SelectedAvatarBody = useMemo(() => {
    return BODY_OPTIONS.find((f) => f.id === selectedBodyId)?.Sprite;
  }, [selectedBodyId]);

  const handleLogout = useCallback(async () => {
    setMajorOpen(false);
    setYearOpen(false);
    setErrorMessage("");
    await supabase.auth.signOut();
  }, []);

  const handleContinue = useCallback(() => {
    if (!displayName.trim() || !selectedMajor || !graduationYear || !selectedBodyId) {
      setErrorMessage("Please complete all fields to continue.");
      return;
    }

    const selectedBody = BODY_OPTIONS.find((b) => b.id === selectedBodyId);

    setErrorMessage("");
    setMajorOpen(false);
    setYearOpen(false);

    navigation.navigate("ProfileSetupB", {
      displayName: displayName.trim(),
      selectedMajor,
      graduationYear,
      selectedBodyId,
      gender: selectedBody?.gender || "Shared", // Pass the chosen gender forward
    });
  }, [navigation, selectedBodyId, displayName, selectedMajor, graduationYear]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox, { flex: 1 }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox]}>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
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

        <View style={styles.fieldLayout}>
          <TextInput
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (errorMessage) setErrorMessage("");
            }}
            placeholder="Display Name (visible to campus)"
            placeholderTextColor={COLORS.textSecondary}
            style={[styles.textInput, localStyles.textInputColorOverride]}
            autoCapitalize="words"
          />
        </View>

        <View style={[styles.dropdownWrapper, majorOpen && styles.dropdownWrapperOnTop]}>
          <Pressable
            onPress={() => {
              setMajorOpen((v) => !v);
              setYearOpen(false);
              if (errorMessage) setErrorMessage("");
            }}
            style={({ pressed }) => [
              styles.dropdownSelectField,
              styles.fieldLayout,
              majorOpen && styles.majorSelectFieldOpen,
              pressed && styles.dropdownPressed,
            ]}
          >
            <Text
              style={[
                styles.dropdownValue,
                selectedMajor ? localStyles.dropdownTextActive : localStyles.dropdownTextPlaceholder,
              ]}
            >
              {selectedMajor || "Select your major..."}
            </Text>
            <Ionicons name={majorOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textSecondary} />
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
              styles.dropdownSelectField,
              styles.fieldLayout,
              yearOpen && styles.yearSelectFieldOpen,
              pressed && styles.dropdownPressed,
            ]}
          >
            <Text
              style={[
                styles.dropdownValue,
                graduationYear ? localStyles.dropdownTextActive : localStyles.dropdownTextPlaceholder,
              ]}
            >
              {graduationYear || "Graduation Year"}
            </Text>
            <Ionicons name={yearOpen ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textSecondary} />
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
          <Text style={styles.dividerLabel}>CHOOSE YOUR BASE</Text>
          <View style={styles.dividerLineL} />
        </View>

        <View style={[styles.avatarPreviewRow, styles.setupCtaBarFlexBox]}>
          <View style={[styles.selectedAvatarFrameIcon, localStyles.selectedAvatarContainer]}>
            {SelectedAvatarBody && <SelectedAvatarBody width={80} height={80} />}
          </View>

          <View style={styles.textCommon}>
            <Text style={[styles.hintTitle, styles.hintTitleTypo]}>Your Avatar</Text>
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
  textInputColorOverride: { color: '#FFFFFF' },
  dropdownTextActive: { color: '#FFFFFF' },
  dropdownTextPlaceholder: { color: '#8a8a9a' },
  selectedAvatarContainer: {
    width: 96, height: 96, borderRadius: 20, backgroundColor: '#1E1E1E',
    borderWidth: 2, borderColor: '#333333', overflow: 'hidden',
    position: 'relative', alignItems: 'center', justifyContent: 'center'
  },
  gridAvatarContainer: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#1E1E1E',
    borderWidth: 2, borderColor: 'transparent', overflow: 'hidden',
    position: 'relative', margin: 4, alignItems: 'center', justifyContent: 'center'
  },
  gridAvatarSelected: { borderColor: '#00F5FF' },
  checkBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#00F5FF', alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#1E1E1E'
  },
  ctaButtonActive: { backgroundColor: '#00F5FF', borderColor: '#00F5FF', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ctaTextActive: { color: '#000000', fontWeight: 'bold' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 12, borderRadius: 12,
    marginHorizontal: 24, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', gap: 6,
  },
  errorText: { color: '#FF3B30', fontSize: 14, fontWeight: '500' }
});

export default ProfileSetupScreenA;