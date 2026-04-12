import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { supabase } from "../../lib/supabase";
import { FEED_COLORS } from "../../constants/colors";

import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";
import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

type Props = NativeStackScreenProps<any, "ProfileSetup">;

const majorOptions = [
  "Computer Science",
  "Information Technology",
  "Business",
  "Architecture",
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Industrial Engineering",
  "Mechatronics Engineering",
  "Civil Engineering",
  "Mining Engineering",
  "Electronics Engineering",
  "Psychology",
  "Nursing",
  "Criminology",
  "Accounting",
  "Tourism Management",
  "Hotel Management",
];

const graduationYearOptions = [
  "2026",
  "2027",
  "2028",
  "2029",
  "2030",
  "2031",
  "2032",
];

const avatarAssets = [
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
  Avatar5,
  Avatar6
];

const frameDefs = [
  { id: "1", assetIndex: 0 },
  { id: "2", assetIndex: 1 },
  { id: "3", assetIndex: 2 },
  { id: "4", assetIndex: 3 },
  { id: "5", assetIndex: 4 },
  { id: "6", assetIndex: 5 },
  { id: "7", assetIndex: 0 },
  { id: "8", assetIndex: 1 }
] as const;

const buildFrames = () =>
  frameDefs.map((def) => ({
    ...def,
    Component: avatarAssets[def.assetIndex]
  }));

const FRAMES = buildFrames();

const defaultSelectedId = FRAMES[0].id;

const ProfileSetupScreen: FC<Props> = ({ navigation }) => {
  const [selectedId, setSelectedId] = useState<string>(defaultSelectedId);
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [majorOpen, setMajorOpen] = useState<boolean>(false);
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [yearOpen, setYearOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const SelectedAvatar = useMemo(() => {
    return FRAMES.find((f) => f.id === selectedId)?.Component;
  }, [selectedId]);

  const handleLogout = useCallback(async () => {
    setMajorOpen(false);
    setYearOpen(false);
    setErrorMessage("");
    // Log the user out instead of allowing them to bypass profile setup
    await supabase.auth.signOut();
  }, []);

  const handleContinue = useCallback(async () => {
    // 1. Validation
    if (!displayName.trim() || !selectedMajor || !graduationYear) {
      setErrorMessage("Please complete all fields to continue.");
      return;
    }

    setErrorMessage(""); // clear previous errors

    const selected = FRAMES.find((f) => f.id === selectedId);
    if (selected) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setErrorMessage("Could not verify user session.");
          return;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_index: selected.assetIndex,
            display_name: displayName.trim(),
            major: selectedMajor,
            graduation_year: graduationYear.trim()
          })
          .eq('id', user.id);

        if (updateError) {
          setErrorMessage("Failed to save profile. Please try again.");
          return;
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("An unexpected error occurred.");
        return;
      }
    }

    setMajorOpen(false);
    setYearOpen(false);
    
    // Switch to Main Stack safely
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  }, [navigation, selectedId, displayName, selectedMajor, graduationYear]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox]}>
      
      {/* HEADER */}
      <View style={[styles.setupProgressHeader, styles.setupProgressHeaderFlexBox]}>
        <View style={[styles.headerTextBlock, styles.textCommon]}>
          <Text style={[styles.screenTitle, styles.screenTitleTypo]}>Set Up Your Profile</Text>
          <Text style={[styles.screenSubtitle, styles.hintBodyTypo]}>
            Tell us about yourself.{"\n"}This is public on your campus.
          </Text>
        </View>
      </View>

      {/* FORM */}
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
            <Ionicons
              name={majorOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={FEED_COLORS.textSecondary}
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
                    }}
                    style={({ pressed }) => [
                      styles.majorDropdownOption,
                      pressed && styles.majorDropdownOptionPressed,
                    ]}
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
            <Ionicons
              name={yearOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={FEED_COLORS.textSecondary}
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
                    }}
                    style={({ pressed }) => [
                      styles.yearDropdownOption,
                      pressed && styles.yearDropdownOptionPressed,
                    ]}
                  >
                    <Text style={styles.dropdownOptionText}>{year}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* AVATAR SECTION */}
      <View style={[styles.avatarSelectionBlock, styles.setupProgressHeaderFlexBox]}>
        
        <View style={styles.setupCtaBarFlexBox}>
          <View style={styles.dividerLineL} />
          <Text style={styles.dividerLabel}>CHOOSE YOUR AVATAR</Text>
          <View style={styles.dividerLineL} />
        </View>

        {/* SELECTED AVATAR */}
        <View style={[styles.avatarPreviewRow, styles.setupCtaBarFlexBox]}>
          <View style={[styles.selectedAvatarFrameIcon, localStyles.selectedAvatarContainer]}>
            {SelectedAvatar && <SelectedAvatar width={72} height={72} style={localStyles.selectedAvatarSvg} />}
          </View>

          <View style={styles.textCommon}>
            <Text style={[styles.hintTitle, styles.hintTitleTypo]}>
              Your Avatar
            </Text>
            <Text style={[styles.hintBody, styles.hintBodyTypo]}>
              Represents you on the quest board.{"\n"}Unlock more in the Shop.
            </Text>
          </View>
        </View>

        {/* GRID */}
        <View style={styles.avatarGrid}>
          {FRAMES.map((frame) => {
            const isSelected = selectedId === frame.id;
            const AvatarComponent = frame.Component;

            return (
              <Pressable
                key={frame.id}
                onPress={() => setSelectedId(frame.id)}
                style={({ pressed }) => [
                  styles.avatarGridItem,
                  styles.avatarItemLayout,
                  localStyles.gridAvatarContainer,
                  isSelected && localStyles.gridAvatarSelected,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <AvatarComponent width={48} height={48} style={localStyles.gridAvatarSvg} />

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

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage ? (
        <View style={localStyles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={localStyles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* BUTTONS */}
      <View style={[styles.setupCtaBar, styles.setupCtaBarFlexBox]}>
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
            Continue →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// Local stylesheet overrides for direct UI fixes
const localStyles = StyleSheet.create({
  textInputColorOverride: {
    color: '#FFFFFF',
  },
  dropdownTextActive: {
    color: '#FFFFFF',
  },
  dropdownTextPlaceholder: {
    color: '#8a8a9a',
  },
  selectedAvatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333333',
    overflow: 'hidden',
    position: 'relative',
  },
  selectedAvatarSvg: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  gridAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
    margin: 4,
  },
  gridAvatarSelected: {
    borderColor: '#00F5FF',
  },
  gridAvatarSvg: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E1E1E'
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