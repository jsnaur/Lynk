import React, { FC, useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { styles } from "./ProfileSetupScreen.styles";


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

type Props = NativeStackScreenProps<AuthStackParamList, "ProfileSetup">;

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
  const [selectedMajor, setSelectedMajor] = useState<string>(majorOptions[0]);
  const [majorOpen, setMajorOpen] = useState<boolean>(false);
  const [graduationYear, setGraduationYear] = useState<string>("");

  const SelectedAvatar = useMemo(() => {
    return FRAMES.find((f) => f.id === selectedId)?.Component;
  }, [selectedId]);

  const handleSkip = useCallback(() => {
    setMajorOpen(false);
    navigation.goBack();
  }, [navigation]);

  const handleContinue = useCallback(async () => {
    const selected = FRAMES.find((f) => f.id === selectedId);
    if (selected) {
      try {
        await AsyncStorage.setItem(
          PROFILE_AVATAR_ASSET_INDEX_KEY,
          String(selected.assetIndex)
        );

        await AsyncStorage.setItem(
          PROFILE_DISPLAY_NAME_KEY,
          displayName.trim()
        );

        await AsyncStorage.setItem(PROFILE_MAJOR_KEY, selectedMajor);
        await AsyncStorage.setItem(PROFILE_GRAD_YEAR_KEY, graduationYear.trim());
      } catch {
        // Handle error if needed
      }
    }
    setMajorOpen(false);
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate("Main" as never);
      return;
    }
    navigation.goBack();
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

        <View style={styles.dropdownWrapper}>
          <Pressable
            onPress={() => setMajorOpen((v) => !v)}
            style={({ pressed }) => [
              styles.dropdownSelectField,
              styles.fieldLayout,
              pressed && styles.dropdownPressed,
            ]}
          >
            <Text style={styles.dropdownValue}>{selectedMajor}</Text>
            <Ionicons
              name={majorOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#8a8a9a"
            />
          </Pressable>

          {majorOpen && (
            <View style={styles.dropdownList}>
              <ScrollView
                style={styles.dropdownScroll}
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
                      styles.dropdownOption,
                      pressed && styles.dropdownOptionPressed,
                    ]}
                  >
                    <Text style={styles.dropdownOptionText}>{major}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.fieldLayout}>
          <TextInput
            value={graduationYear}
            onChangeText={setGraduationYear}
            placeholder="Graduation Year"
            placeholderTextColor="#8a8a9a"
            style={styles.textInput}
            keyboardType="number-pad"
            maxLength={4}
          />
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