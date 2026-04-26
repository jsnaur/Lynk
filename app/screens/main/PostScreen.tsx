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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import XpSpriteToken from '../../../assets/PostAssets/XP_Sprite (1).svg';
import DecrementBtn from '../../../assets/PostAssets/Decrement_Btn.svg';
import IncrementBtn from '../../../assets/PostAssets/Increment_Btn.svg';
import { useTokenBalance } from '../../contexts/TokenContext';
import { withOpacity } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { appraiseQuest, DEFAULT_APPRAISAL, APPRAISER_CONSTANTS } from '../../services/AppraiserService';
import { useTheme } from '../../contexts/ThemeContext';

const TITLE_MAX = 60;
const DESC_MAX = 280;
const DISMISS_PULL_THRESHOLD = 70;
const DISMISS_ANIMATION_MS = 240;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const { GUILD_BASE_XP, TOKEN_MIN, TOKEN_MAX } = APPRAISER_CONSTANTS;
const MAX_PARTICIPANTS_LIMIT = 50;

type QuestCategory = 'Favor' | 'Study' | 'Item';

function FieldError({ message, visible, colors, styles }: { message: string; visible: boolean; colors: any; styles: any }) {
  if (!visible) return null;
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle" size={14} color={colors.error} />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

export default function PostScreen({ navigation }: { navigation: any }) {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const CATEGORIES: { key: QuestCategory; color: string; bg: string }[] = useMemo(() => [
    { key: 'Favor', color: colors.favor, bg: withOpacity(colors.favor, 0.15) },
    { key: 'Study', color: colors.study, bg: withOpacity(colors.study, 0.15) },
    { key: 'Item', color: colors.item, bg: withOpacity(colors.item, 0.15) },
  ], [colors]);

  const { refreshBalance } = useTokenBalance();
  const [category, setCategory] = useState<QuestCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(1);
  const [isAutoAccept, setIsAutoAccept] = useState(true);
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
    if (maxParticipants < 1) list.push('Group size must be at least 1');

    return list;
  }, [category, titleTrim, descTrim, locTrim, maxParticipants]);

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

  const changeMaxParticipants = useCallback((delta: number) => {
    setMaxParticipants((v) => {
      const next = v + delta;
      if (next < 1) return 1;
      if (next > MAX_PARTICIPANTS_LIMIT) return MAX_PARTICIPANTS_LIMIT;
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

      const { error } = await supabase.rpc('create_quest_with_bounty', {
        p_category: category?.toLowerCase(),
        p_title: titleTrim,
        p_description: descTrim,
        p_location: locTrim,
        p_bonus_xp: appraisal.bonusXp,
        p_token_bounty: tokenBounty,
        p_latitude: lat,
        p_longitude: lon,
        p_max_participants: maxParticipants,
        p_is_auto_accept: isAutoAccept,
      });

      if (error) {
        const insufficientBalance =
          error.code === 'P0001' &&
          typeof error.message === 'string' &&
          error.message.toLowerCase().includes('insufficient token balance');

        if (insufficientBalance) {
          throw new Error('Not enough tokens for this bounty. Lower the token reward or earn more tokens.');
        }

        throw error;
      }

      await refreshBalance();
      navigation.goBack();
    } catch (error: any) {
      const isMissingRpc =
        error?.code === '42883' ||
        (typeof error?.message === 'string' &&
          error.message.toLowerCase().includes('create_quest_with_bounty'));

      if (isMissingRpc) {
        Alert.alert(
          'Database Update Required',
          'Quest posting now requires the latest RPC definitions. Please run the migration in Supabase, then try again.',
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to publish quest.');
      }
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
                        { backgroundColor: colors.surface },
                        selected && { borderColor: color, backgroundColor: bg, borderWidth: 2 },
                        !selected && styles.categoryChipIdle,
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={[styles.categoryLabel, selected && { color: colors.textPrimary }]}>
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <FieldError message="Please select a category" visible={submitAttempted && !category} colors={colors} styles={styles} />
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
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                autoCorrect
              />
              <FieldError message="Title is required" visible={submitAttempted && !titleTrim} colors={colors} styles={styles} />
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
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
                maxLength={DESC_MAX}
                multiline
                textAlignVertical="top"
              />
              <FieldError message="Description is required" visible={submitAttempted && !descTrim} colors={colors} styles={styles} />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>LOCATION ON CAMPUS</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Building, room, or landmark"
                  placeholderTextColor={colors.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                  autoCorrect
                />
              </View>
              <FieldError message="Campus location is required" visible={submitAttempted && !locTrim} colors={colors} styles={styles} />
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>MAX PARTICIPANTS (HELPERS NEEDED)</Text>
                <View style={styles.requiredDot} />
              </View>
              
              <View style={styles.stepperContainer}>
                <Pressable
                  hitSlop={8}
                  onPress={() => changeMaxParticipants(-1)}
                  disabled={maxParticipants <= 1}
                  style={({ pressed }) => [
                    styles.stepperHit,
                    (pressed || maxParticipants <= 1) && styles.stepperDim,
                  ]}
                >
                  <DecrementBtn width={32} height={32} />
                </Pressable>
                
                <View style={styles.stepperValueContainer}>
                  <Text style={styles.stepperValue}>{maxParticipants}</Text>
                </View>

                <Pressable
                  hitSlop={8}
                  onPress={() => changeMaxParticipants(1)}
                  disabled={maxParticipants >= MAX_PARTICIPANTS_LIMIT}
                  style={({ pressed }) => [
                    styles.stepperHit,
                    (pressed || maxParticipants >= MAX_PARTICIPANTS_LIMIT) && styles.stepperDim,
                  ]}
                >
                  <IncrementBtn width={32} height={32} />
                </Pressable>
              </View>
              
              <Text style={styles.stepperHelper}>
                {maxParticipants === 1
                  ? "Requires 1 helper"
                  : `Requires ${maxParticipants} helpers`}
              </Text>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleTitle}>Auto-Accept Applicants</Text>
                  <Text style={styles.toggleSub}>
                    {maxParticipants > 3 
                      ? `Warning: Auto-accepting ${maxParticipants} helpers might fill your quest instantly. Are you sure?`
                      : "If off, you will manually review and approve applicants before the quest starts."}
                  </Text>
                </View>
                <Switch
                  value={isAutoAccept}
                  onValueChange={setIsAutoAccept}
                  trackColor={{ false: colors.border, true: colors.xp }}
                />
              </View>
              <FieldError message="Group size must be at least 1" visible={submitAttempted && maxParticipants < 1} colors={colors} styles={styles} />
            </View>

            <View style={styles.section}>
              <View style={styles.appraiserCard}>
                <View style={styles.appraiserHeader}>
                  <View style={styles.appraiserTitleRow}>
                    <Ionicons name="sparkles-outline" size={18} color={colors.xp} />
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
                    <Text style={[styles.appraiserStatValue, { color: colors.token }]}>
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
                  <Ionicons name="warning" size={18} color={colors.error} />
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

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)', // Overlay backdrop
  },
  flex: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
  },
  publishBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    minWidth: 72,
    alignItems: 'center',
  },
  publishText: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: colors.xp,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  counter: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderColor: colors.border,
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
    color: colors.textSecondary,
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: 'DMSans-Regular',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stepperValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepperHelper: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
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
    color: colors.error,
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
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  rewardSub: {
    fontSize: 11,
    color: colors.textSecondary,
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
    color: colors.token,
  },
  summaryCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withOpacity(colors.warning, 0.5),
    backgroundColor: withOpacity(colors.warning, 0.08),
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
    color: colors.textPrimary,
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
    backgroundColor: colors.error,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  appraiserCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: withOpacity(colors.xp, 0.28),
    backgroundColor: withOpacity(colors.xp, 0.08),
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
    color: colors.textPrimary,
  },
  appraiserBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appraiserBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appraiserHeadline: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  appraiserCopy: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  appraiserStatValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: colors.xp,
    textAlign: 'center',
  },
  appraiserStatLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});