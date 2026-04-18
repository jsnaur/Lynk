import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { styles } from "./ProfileSetupScreen.styles";
import { supabase } from "../../lib/supabase";

import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";
import SelectedCheckIcon from "../../../assets/ProfileSetupPic/Vector.svg";

const avatarAssets = [Avatar1, Avatar2, Avatar3, Avatar4, Avatar5, Avatar6];

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

const faceOptions = [Avatar1, Avatar2, Avatar3, Avatar4];
const hairOptions = [Avatar2, Avatar3, Avatar4, Avatar5];
const topOptions = [Avatar3, Avatar4, Avatar5, Avatar6];
const bottomOptions = [Avatar4, Avatar5, Avatar6, Avatar1];

const categoryGroups = [
  { label: "FACE", options: faceOptions },
  { label: "HAIR", options: hairOptions },
  { label: "TOP", options: topOptions },
  { label: "BOTTOM", options: bottomOptions },
];

type Props = NativeStackScreenProps<any, "ProfileSetupB">;

const ProfileSetupScreenB: FC<Props> = ({ navigation, route }) => {
  const { displayName, selectedMajor, graduationYear, selectedId } = route.params ?? {};
  const [selectedFace, setSelectedFace] = useState<number>(0);
  const [selectedHair, setSelectedHair] = useState<number>(0);
  const [selectedTop, setSelectedTop] = useState<number>(0);
  const [selectedBottom, setSelectedBottom] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedId) {
      navigation.goBack();
    }
  }, [displayName, selectedMajor, graduationYear, selectedId, navigation]);

  const SelectedAvatar = useMemo(() => {
    return FRAMES.find((f) => f.id === selectedId)?.Component;
  }, [selectedId]);

  const handleLogout = useCallback(async () => {
    setErrorMessage("");
    await supabase.auth.signOut();
  }, []);

  const handleContinue = useCallback(async () => {
    if (!displayName || !selectedMajor || !graduationYear || !selectedId) {
      setErrorMessage("Please complete the profile flow.");
      return;
    }

    const selected = FRAMES.find((f) => f.id === selectedId);
    if (!selected) {
      setErrorMessage("Unable to save your avatar selection.");
      return;
    }

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

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" as never }],
      });
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    }
  }, [displayName, selectedMajor, graduationYear, selectedId, navigation]);

  return (
    <View style={[styles.profileSetupScreen, styles.utilityInfoFormFlexBox]}>
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
            {SelectedAvatar && <SelectedAvatar width={72} height={72} style={localStyles.selectedAvatarSvg} />}
          </View>

          <View style={styles.textCommon}>
            <Text style={[styles.hintTitle, styles.hintTitleTypo]}>Your Avatar</Text>
            <Text style={[styles.hintBody, styles.hintBodyTypo]}>
              Represents you on the quest board.{"\n"}Unlock more in the Shop.
            </Text>
          </View>
        </View>

        {categoryGroups.map((group) => {
          const activeIndex =
            group.label === "FACE"
              ? selectedFace
              : group.label === "HAIR"
              ? selectedHair
              : group.label === "TOP"
              ? selectedTop
              : selectedBottom;

          const setActive =
            group.label === "FACE"
              ? setSelectedFace
              : group.label === "HAIR"
              ? setSelectedHair
              : group.label === "TOP"
              ? setSelectedTop
              : setSelectedBottom;

          return (
            <View key={group.label} style={localStyles.categorySection}>
              <View style={[styles.setupCtaBarFlexBox, localStyles.categoryHeader]}>
                <View style={styles.dividerLineL} />
                <Text style={styles.dividerLabel}>{group.label}</Text>
                <View style={styles.dividerLineL} />
              </View>
              <View style={localStyles.categoryRow}>
                {group.options.map((Option, index) => {
                  const isSelected = index === activeIndex;
                  return (
                    <Pressable
                      key={`${group.label}-${index}`}
                      onPress={() => setActive(index)}
                      style={({ pressed }) => [
                        localStyles.customOption,
                        isSelected && localStyles.customOptionSelected,
                        pressed && { opacity: 0.8 }
                      ]}
                    >
                      <Option width={44} height={44} style={localStyles.customSprite} />
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
          );
        })}
      </View>

      {errorMessage ? (
        <View style={localStyles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" />
          <Text style={localStyles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={[styles.setupCtaBar, styles.setupCtaBarFlexBox]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.ctaButton,
            styles.ctaLayout,
            pressed && styles.ctaPressed
          ]}
        >
          <Text style={[styles.buttonLabel, styles.buttonPosition]}>Log Out</Text>
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

const localStyles = StyleSheet.create({
  progressBarFillLarge: {
    width: 300,
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
  categorySection: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  categoryHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    width: '100%',
  },
  customOption: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#26262e',
    borderWidth: 1,
    borderColor: '#3a3a48',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  customOptionSelected: {
    borderColor: '#00F5FF',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  customSprite: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  selectionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E1E1E',
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
  },
});

export default ProfileSetupScreenB;
