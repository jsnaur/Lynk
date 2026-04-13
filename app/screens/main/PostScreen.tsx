import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import XpSpriteToken from '../../../assets/PostAssets/XP_Sprite (1).svg';
import DecrementBtn from '../../../assets/PostAssets/Decrement_Btn.svg';
import IncrementBtn from '../../../assets/PostAssets/Increment_Btn.svg';
import { FEED_CATEGORY_BG, FEED_COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { appraiseQuest, DEFAULT_APPRAISAL, APPRAISER_CONSTANTS } from '../../services/AppraiserService';

const TITLE_MAX = 60;
const DESC_MAX = 280;
const DISMISS_PULL_THRESHOLD = 70;
const DISMISS_ANIMATION_MS = 240;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const { GUILD_BASE_XP, TOKEN_MIN, TOKEN_MAX } = APPRAISER_CONSTANTS;

type QuestCategory = 'Favor' | 'Study' | 'Item';

const CATEGORIES: { key: QuestCategory; color: string; bg: string }[] = [
  { key: 'Favor', color: FEED_COLORS.favor, bg: FEED_CATEGORY_BG.favor },
  { key: 'Study', color: FEED_COLORS.study, bg: FEED_CATEGORY_BG.study },
  { key: 'Item', color: FEED_COLORS.item, bg: FEED_CATEGORY_BG.item },
];

function FieldError({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle" size={14} color={FEED_COLORS.error} />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

export default function PostScreen({ navigation }: { navigation: any }) {
  const [category, setCategory] = useState<QuestCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tokenBounty, setTokenBounty] = useState(DEFAULT_APPRAISAL.tokenBounty);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const isDismissingRef = useRef(false);

  const titleTrim = title.trim();
  const descTrim = description.trim();
  const locTrim = location.trim();

  const validationIssues = useMemo(() => {
    const list: string[] = [];
    if (!category) list.push('Choose a category');
    if (!titleTrim) list.push('Add a quest title');
    if (!descTrim) list.push('Add a description');
    if (!locTrim) list.push('Add a campus location');
    return list;
  }, [category, titleTrim, descTrim, locTrim]);

  const isValid = validationIssues.length === 0;

  const appraisal = useMemo(() => {
    const categoryLower = category?.toLowerCase() as any;
    return appraiseQuest({
      category: categoryLower,
      title: titleTrim,
      description: descTrim,
      location: locTrim,
    });
  }, [category, titleTrim, descTrim, locTrim]);

  useEffect(() => {
    setTokenBounty(appraisal.tokenBounty);
  }, [appraisal.tokenBounty]);

  const changeTokens = useCallback((delta: number) => {
    setTokenBounty((v) => {
      const next = v + delta;
      if (next < TOKEN_MIN) return TOKEN_MIN;
      if (next > TOKEN_MAX) return TOKEN_MAX;
      return next;
    });
  }, []);

  const animateDismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: DISMISS_ANIMATION_MS,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  }, [navigation, sheetTranslateY]);

  const headerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (isDismissingRef.current) return;
          if (gestureState.dy > 0) {
            sheetTranslateY.setValue(gestureState.dy * 0.9);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (isDismissingRef.current) return;
          if (gestureState.dy >= DISMISS_PULL_THRESHOLD) {
            animateDismiss();
            return;
          }

          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          if (isDismissingRef.current) return;
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 22,
            bounciness: 0,
          }).start();
        },
      }),
    [animateDismiss, sheetTranslateY],
  );

  const publishToSupabase = async () => {
    setIsPublishing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('You must be logged in to post.');

      // Default CIT University fallback
      let lat = 10.2975; 
      let lon = 123.8803;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
           // Prevent unsatisfied settings exception
           const servicesEnabled = await Location.hasServicesEnabledAsync();
           if (servicesEnabled) {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              lat = loc.coords.latitude;
              lon = loc.coords.longitude;
           } else {
             console.log("GPS turned off. Using default location.");
           }
        }
      } catch (locErr: any) {
        console.log("Location fetch caught, using default fallback.", locErr.message);
      }

      const { error } = await supabase.from('quests').insert({
        user_id: user.id,
        category: category?.toLowerCase(), 
        title: titleTrim,
        description: descTrim,
        location: locTrim,
        bonus_xp: appraisal.bonusXp,
        token_bounty: tokenBounty,
        latitude: lat,
        longitude: lon,
      });

      if (error) throw error;
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to publish quest.');
    } finally {
      setIsPublishing(false);
    }
  };

  const onPublish = useCallback(() => {
    setSubmitAttempted(true);
    if (!isValid) return;

    Alert.alert(
      'Publish quest?',
      `Guild Appraiser: ${appraisal.tier} tier (${appraisal.confidence} confidence)\nCategory: ${category}\nTotal XP: ${GUILD_BASE_XP + appraisal.bonusXp}${
        tokenBounty > 0 ? `\nTokens: ${tokenBounty}` : ''
      }`,
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Publish',
          onPress: publishToSupabase,
        },
      ],
    );
  }, [isValid, category, appraisal, tokenBounty, publishToSupabase]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View {...headerPanResponder.panHandlers}>
            <View style={styles.handleBarWrap}>
              <View style={styles.handleBar} />
            </View>

            <View style={styles.navRow}>
            <Pressable
              onPress={animateDismiss}
              style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
              disabled={isPublishing}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.navTitle}>New Quest</Text>
            <Pressable
              onPress={onPublish}
              style={({ pressed }) => [styles.publishBtn, pressed && styles.pressed]}
              disabled={isPublishing}
            >
              <Text style={styles.publishText}>{isPublishing ? '...' : 'Publish'}</Text>
            </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
            overScrollMode="always"
            scrollEventThrottle={16}
            onScroll={(event) => {
              const y = event.nativeEvent.contentOffset.y;
              if (y <= -DISMISS_PULL_THRESHOLD) {
                animateDismiss();
              }
            }}
          >
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>CATEGORY</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(({ key, color, bg }) => {
                  const selected = category === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setCategory(key)}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: FEED_COLORS.surface },
                        selected && { borderColor: color, backgroundColor: bg, borderWidth: 2 },
                        !selected && styles.categoryChipIdle,
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={[styles.categoryLabel, selected && { color: FEED_COLORS.textPrimary }]}>
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <FieldError message="Please select a category" visible={submitAttempted && !category} />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRowBetween}>
                <View style={styles.labelCluster}>
                  <Text style={styles.label}>QUEST TITLE</Text>
                  <View style={styles.requiredDot} />
                </View>
                <Text style={styles.counter}>
                  {title.length} / {TITLE_MAX}
                </Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="What do you need help with?"
                placeholderTextColor={FEED_COLORS.textSecondary}
                value={title}
                onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                autoCorrect
              />
              <FieldError message="Title is required" visible={submitAttempted && !titleTrim} />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRowBetween}>
                <View style={styles.labelCluster}>
                  <Text style={styles.label}>DESCRIPTION</Text>
                  <View style={styles.requiredDot} />
                </View>
                <Text style={styles.counter}>
                  {description.length} / {DESC_MAX}
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Details, timing, what to bring…"
                placeholderTextColor={FEED_COLORS.textSecondary}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
                maxLength={DESC_MAX}
                multiline
                textAlignVertical="top"
              />
              <FieldError message="Description is required" visible={submitAttempted && !descTrim} />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>LOCATION ON CAMPUS</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={20} color={FEED_COLORS.textSecondary} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Building, room, or landmark"
                  placeholderTextColor={FEED_COLORS.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                  autoCorrect
                />
              </View>
              <FieldError message="Campus location is required" visible={submitAttempted && !locTrim} />
            </View>

            <View style={styles.section}>
              <View style={styles.appraiserCard}>
                <View style={styles.appraiserHeader}>
                  <View style={styles.appraiserTitleRow}>
                    <Ionicons name="sparkles-outline" size={18} color={FEED_COLORS.xp} />
                    <Text style={styles.appraiserLabel}>GUILD APPRAISER</Text>
                  </View>
                  <View style={styles.appraiserBadge}>
                    <Text style={styles.appraiserBadgeText}>{appraisal.tier}</Text>
                  </View>
                </View>
                <Text style={styles.appraiserHeadline}>
                  Recommended reward: +{appraisal.bonusXp} XP and {appraisal.tokenBounty} TK
                </Text>
                <Text style={styles.appraiserCopy}>{appraisal.rationale}</Text>
                <View style={styles.appraiserStatsRow}>
                  <View style={styles.appraiserStat}>
                    <Text style={styles.appraiserStatValue}>+{appraisal.bonusXp}</Text>
                    <Text style={styles.appraiserStatLabel}>XP boost</Text>
                  </View>
                  <View style={styles.appraiserStat}>
                    <Text style={[styles.appraiserStatValue, { color: FEED_COLORS.token }]}>
                      {appraisal.tokenBounty}
                    </Text>
                    <Text style={styles.appraiserStatLabel}>Token bounty</Text>
                  </View>
                  <View style={styles.appraiserStat}>
                    <Text style={styles.appraiserStatValue}>{appraisal.confidence}</Text>
                    <Text style={styles.appraiserStatLabel}>Confidence</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>SET REWARD</Text>
                <View style={styles.dividerLine} />
              </View>
              <Text style={styles.hint}>
                Higher bounties get picked up faster.
              </Text>

              <View style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <View style={styles.rewardLabels}>
                    <Text style={styles.rewardTitle}>XP reward</Text>
                    <Text style={styles.rewardSub}>Auto-set by Guild Appraiser: +{appraisal.bonusXp} XP</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <XpSpriteToken width={24} height={24} />
                  <View style={styles.rewardLabels}>
                    <Text style={styles.rewardTitle}>Token bounty</Text>
                    <Text style={styles.rewardSub}>Optional — uses your balance</Text>
                  </View>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => changeTokens(-1)}
                    disabled={tokenBounty <= TOKEN_MIN}
                    style={({ pressed }) => [
                      styles.stepperHit,
                      (pressed || tokenBounty <= TOKEN_MIN) && styles.stepperDim,
                    ]}
                  >
                    <DecrementBtn width={32} height={32} />
                  </Pressable>
                  <Text style={styles.tokenValue}>{tokenBounty}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => changeTokens(1)}
                    disabled={tokenBounty >= TOKEN_MAX}
                    style={({ pressed }) => [
                      styles.stepperHit,
                      (pressed || tokenBounty >= TOKEN_MAX) && styles.stepperDim,
                    ]}
                  >
                    <IncrementBtn width={32} height={32} />
                  </Pressable>
                </View>
              </View>
            </View>

            {submitAttempted && !isValid && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="warning" size={18} color={FEED_COLORS.error} />
                  <Text style={styles.summaryTitle}>Complete required fields</Text>
                </View>
                {validationIssues.map((msg) => (
                  <View key={msg} style={styles.summaryLine}>
                    <View style={styles.summaryBullet} />
                    <Text style={styles.summaryText}>{msg}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: FEED_COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: FEED_COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBarWrap: {
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'center',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: FEED_COLORS.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 72,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  publishBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: FEED_COLORS.surface2,
    minWidth: 72,
    alignItems: 'center',
  },
  publishText: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.xp,
  },
  cancelText: {
    fontSize: 16,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 22,
  },
  section: {
    gap: 8,
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    letterSpacing: 1.2,
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textSecondary,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FEED_COLORS.error,
  },
  counter: {
    fontSize: 12,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  categoryChipIdle: {
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textSecondary,
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: FEED_COLORS.textPrimary,
    fontFamily: 'DMSans-Regular',
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: FEED_COLORS.textPrimary,
    fontFamily: 'DMSans-Regular',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  fieldErrorText: {
    fontSize: 12,
    color: FEED_COLORS.error,
    fontFamily: 'DMSans-Regular',
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FEED_COLORS.border,
  },
  dividerLabel: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: FEED_COLORS.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    marginTop: 8,
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  rewardLabels: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  rewardSub: {
    fontSize: 11,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperHit: {
    opacity: 1,
  },
  stepperDim: {
    opacity: 0.35,
  },
  tokenValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: FEED_COLORS.token,
  },
  summaryCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.5)',
    backgroundColor: 'rgba(255,176,32,0.08)',
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  summaryBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: FEED_COLORS.error,
  },
  summaryText: {
    fontSize: 13,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  appraiserCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.28)',
    backgroundColor: 'rgba(192,132,252,0.08)',
    padding: 14,
    gap: 10,
  },
  appraiserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appraiserTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appraiserLabel: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: FEED_COLORS.textPrimary,
  },
  appraiserBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: FEED_COLORS.surface,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
  },
  appraiserBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  appraiserHeadline: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.textPrimary,
  },
  appraiserCopy: {
    fontSize: 12,
    lineHeight: 17,
    color: FEED_COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  appraiserStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appraiserStat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: FEED_COLORS.surface,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    alignItems: 'center',
    gap: 2,
  },
  appraiserStatValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: FEED_COLORS.xp,
    textAlign: 'center',
  },
  appraiserStatLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: FEED_COLORS.textSecondary,
    textAlign: 'center',
  },
});