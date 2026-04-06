import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./ProfileSetupScreen.styles";
import { supabase } from '../../lib/supabase';

import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";
import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

const PROFILE_AVATAR_ASSET_INDEX_KEY = "@lynk/profileAvatarAssetIndex";
const PROFILE_DISPLAY_NAME_KEY = "@lynk/profileDisplayName";
const PROFILE_MAJOR_KEY = "@lynk/profileMajor";
const PROFILE_GRAD_YEAR_KEY = "@lynk/profileGradYear";

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

  const SelectedAvatar = useMemo(() => {
    return FRAMES.find((f) => f.id === selectedId)?.Component;
  }, [selectedId]);

  const handleSkip = useCallback(async () => {
    setMajorOpen(false);
    setYearOpen(false);

    try {
      // Mark as complete in Supabase so it doesn't prompt on next login
      await supabase.auth.updateUser({
        data: { profile_setup_complete: true }
      });
      // Fallback filler for local storage checks
      await AsyncStorage.setItem(PROFILE_DISPLAY_NAME_KEY, "Anonymous");
    } catch (error) {
      console.error('Error skipping profile setup:', error);
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Main" as never }],
    });
  }, [navigation]);

  const handleContinue = useCallback(async () => {
    const selected = FRAMES.find((f) => f.id === selectedId);
    if (selected) {
      try {
        const finalDisplayName = displayName.trim() || "Anonymous";

        await AsyncStorage.setItem(
          PROFILE_AVATAR_ASSET_INDEX_KEY,
          String(selected.assetIndex)
        );

        await AsyncStorage.setItem(
          PROFILE_DISPLAY_NAME_KEY,
          finalDisplayName
        );

        await AsyncStorage.setItem(PROFILE_MAJOR_KEY, selectedMajor);
        await AsyncStorage.setItem(PROFILE_GRAD_YEAR_KEY, graduationYear.trim());

        // Save persistently to Supabase metadata to span across devices
        await supabase.auth.updateUser({
          data: {
            profile_setup_complete: true,
            display_name: finalDisplayName,
            major: selectedMajor,
            graduation_year: graduationYear.trim(),
            avatar_asset_index: selected.assetIndex,
          }
        });
      } catch (error) {
        console.error('Error continuing profile setup:', error);
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
            onChangeText={setDisplayName}
            placeholder="Display Name (visible to campus)"
            placeholderTextColor="#8a8a9a"
            style={styles.textInput}
            autoCapitalize="words"
          />
        </View>

        <View style={[styles.dropdownWrapper, majorOpen && styles.dropdownWrapperOnTop]}>
          <Pressable
            onPress={() => {
              setMajorOpen((v) => !v);
              setYearOpen(false);
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
                !selectedMajor && styles.placeholderText,
              ]}
            >
              {selectedMajor || "Select your major..."}
            </Text>
            <Ionicons
              name={majorOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#8a8a9a"
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
                !graduationYear && styles.placeholderText,
              ]}
            >
              {graduationYear || "Graduation Year"}
            </Text>
            <Ionicons
              name={yearOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#8a8a9a"
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
          <View style={styles.selectedAvatarFrameIcon}>
            {SelectedAvatar && <SelectedAvatar width={64} height={64} />}
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
                  isSelected && styles.avatarGridItem8,
                  pressed && styles.avatarPressed
                ]}
              >
                <AvatarComponent width={48} height={48} />

                {isSelected && (
                  <View style={styles.selectionCheckBadgeIcon}>
                    <SelectedCheckIcon width={12} height={12} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* BUTTONS */}
      <View style={[styles.setupCtaBar, styles.setupCtaBarFlexBox]}>
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.ctaButton,
            styles.ctaLayout,
            pressed && styles.ctaPressed
          ]}
        >
          <Text style={[styles.buttonLabel, styles.buttonPosition]}>
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.ctaButton2,
            styles.ctaLayout,
            pressed && styles.ctaPressedPrimary
          ]}
        >
          <Text style={[styles.buttonLabel2, styles.buttonPosition]}>
            Continue →
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ProfileSetupScreen;