import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
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
import { useTokenBalance } from '../../contexts/TokenContext';
import { COLORS, withOpacity } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { appraiseQuest, DEFAULT_APPRAISAL, APPRAISER_CONSTANTS } from '../../services/AppraiserService';

const TITLE_MAX = 60;
const DESC_MAX = 280;
const DISMISS_PULL_THRESHOLD = 70;
const DISMISS_ANIMATION_MS = 240;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const { GUILD_BASE_XP, TOKEN_MIN, TOKEN_MAX } = APPRAISER_CONSTANTS;

const MAX_PARTICIPANTS_MIN = 2;
const MAX_PARTICIPANTS_MAX = 20;

const CATEGORY_BG = {
  favor: withOpacity(COLORS.favor, 0.15),
  study: withOpacity(COLORS.study, 0.15),
  item: withOpacity(COLORS.item, 0.15),
} as const;

type QuestCategory = 'Favor' | 'Study' | 'Item';
type QuestMode = 'solo' | 'group';

const CATEGORIES: { key: QuestCategory; color: string; bg: string }[] = [
  { key: 'Favor', color: COLORS.favor, bg: CATEGORY_BG.favor },
  { key: 'Study', color: COLORS.study, bg: CATEGORY_BG.study },
  { key: 'Item', color: COLORS.item, bg: CATEGORY_BG.item },
];

function FieldError({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle" size={14} color={COLORS.error} />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

// ─── Quest Mode Pill Toggle ───────────────────────────────────────────────────
function QuestModePill({
  mode,
  onChangeMode,
}: {
  mode: QuestMode;
  onChangeMode: (m: QuestMode) => void;
}) {
  const slideAnim = useRef(new Animated.Value(mode === 'solo' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: mode === 'solo' ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const indicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '51%'],
  });

  return (
    <View style={styles.modePillTrack}>
      <Animated.View style={[styles.modePillIndicator, { left: indicatorLeft }]} />
      <Pressable
        style={styles.modePillOption}
        onPress={() => onChangeMode('solo')}
      >
        <Ionicons
          name="person-outline"
          size={13}
          color={mode === 'solo' ? COLORS.textPrimary : COLORS.textSecondary}
        />
        <Text style={[styles.modePillLabel, mode === 'solo' && styles.modePillLabelActive]}>
          Solo
        </Text>
      </Pressable>
      <Pressable
        style={styles.modePillOption}
        onPress={() => onChangeMode('group')}
      >
        <Ionicons
          name="people-outline"
          size={13}
          color={mode === 'group' ? COLORS.textPrimary : COLORS.textSecondary}
        />
        <Text style={[styles.modePillLabel, mode === 'group' && styles.modePillLabelActive]}>
          Group
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Auto-Accept Toggle ───────────────────────────────────────────────────────
function AutoAcceptToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.surface2, withOpacity(COLORS.xp, 0.55)],
  });

  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleHit}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Participant Stepper ──────────────────────────────────────────────────────
function ParticipantStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const canDecrement = value > MAX_PARTICIPANTS_MIN;
  const canIncrement = value < MAX_PARTICIPANTS_MAX;

  return (
    <View style={styles.participantStepper}>
      <Pressable
        hitSlop={10}
        onPress={() => canDecrement && onChange(value - 1)}
        style={({ pressed }) => [
          styles.participantStepBtn,
          (!canDecrement || pressed) && styles.stepperDim,
        ]}
      >
        <DecrementBtn width={32} height={32} />
      </Pressable>

      <View style={styles.participantValueWrap}>
        <Text style={styles.participantValue}>{value}</Text>
        <Text style={styles.participantValueLabel}>helpers</Text>
      </View>

      <Pressable
        hitSlop={10}
        onPress={() => canIncrement && onChange(value + 1)}
        style={({ pressed }) => [
          styles.participantStepBtn,
          (!canIncrement || pressed) && styles.stepperDim,
        ]}
      >
        <IncrementBtn width={32} height={32} />
      </Pressable>
    </View>
  );
}

// ─── Group Quest Config Panel ─────────────────────────────────────────────────
function GroupQuestPanel({
  maxParticipants,
  isAutoAccept,
  onChangeMax,
  onChangeAutoAccept,
}: {
  maxParticipants: number;
  isAutoAccept: boolean;
  onChangeMax: (v: number) => void;
  onChangeAutoAccept: (v: boolean) => void;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        delay: 60,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Dots to visualise slots
  const dots = Array.from({ length: Math.min(maxParticipants, 10) });
  const overflow = maxParticipants > 10 ? maxParticipants - 10 : 0;

  return (
    <Animated.View
      style={[
        styles.groupPanel,
        {
          opacity: opacityAnim,
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 320],
          }),
          overflow: 'hidden',
        },
      ]}
    >
      {/* Participant count row */}
      <View style={styles.groupPanelRow}>
        <View style={styles.groupPanelLeft}>
          <Text style={styles.groupPanelTitle}>Max helpers</Text>
          <Text style={styles.groupPanelSub}>Anyone can join up to this limit</Text>
          {/* Slot visualiser */}
          <View style={styles.slotDotsRow}>
            {dots.map((_, i) => (
              <View
                key={i}
                style={[styles.slotDot, { backgroundColor: withOpacity(COLORS.xp, 0.7) }]}
              />
            ))}
            {overflow > 0 && (
              <Text style={styles.slotOverflow}>+{overflow}</Text>
            )}
          </View>
        </View>
        <ParticipantStepper value={maxParticipants} onChange={onChangeMax} />
      </View>

      <View style={styles.groupDivider} />

      {/* Auto-accept row */}
      <View style={styles.groupPanelRow}>
        <View style={styles.groupPanelLeft}>
          <View style={styles.autoAcceptLabelRow}>
            <Text style={styles.groupPanelTitle}>Auto-accept</Text>
            {isAutoAccept && (
              <View style={styles.autoAcceptBadge}>
                <Text style={styles.autoAcceptBadgeText}>ON</Text>
              </View>
            )}
          </View>
          <Text style={styles.groupPanelSub}>
            {isAutoAccept
              ? 'Helpers join instantly — no approval needed'
              : 'You manually approve each applicant'}
          </Text>
        </View>
        <AutoAcceptToggle value={isAutoAccept} onChange={onChangeAutoAccept} />
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostScreen({ navigation }: { navigation: any }) {
  const { refreshBalance } = useTokenBalance();
  const [category, setCategory] = useState<QuestCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tokenBounty, setTokenBounty] = useState(DEFAULT_APPRAISAL.tokenBounty);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Group quest state
  const [questMode, setQuestMode] = useState<QuestMode>('solo');
  const [maxParticipants, setMaxParticipants] = useState(MAX_PARTICIPANTS_MIN);
  const [isAutoAccept, setIsAutoAccept] = useState(true);

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

  const handleModeChange = useCallback((m: QuestMode) => {
    setQuestMode(m);
    // Reset to sensible defaults when switching back to solo
    if (m === 'solo') {
      setMaxParticipants(MAX_PARTICIPANTS_MIN);
      setIsAutoAccept(true);
    }
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('You must be logged in to post.');

      // Derive final backend values
      const finalMaxParticipants = questMode === 'solo' ? 1 : maxParticipants;
      // is_auto_accept is only meaningful for group quests; solo always true
      const finalIsAutoAccept = questMode === 'solo' ? true : isAutoAccept;

      let lat = 10.2975;
      let lon = 123.8803;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (servicesEnabled) {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
          } else {
            console.log('GPS turned off. Using default location.');
          }
        }
      } catch (locErr: any) {
        console.log('Location fetch caught, using default fallback.', locErr.message);
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
        p_max_participants: finalMaxParticipants,
        p_is_auto_accept: finalIsAutoAccept,
      });

      if (error) {
        const insufficientBalance =
          error.code === 'P0001' &&
          typeof error.message === 'string' &&
          error.message.toLowerCase().includes('insufficient token balance');

        if (insufficientBalance) {
          throw new Error(
            'Not enough tokens for this bounty. Lower the token reward or earn more tokens.',
          );
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
          'Quest posting now requires the create_quest_with_bounty RPC. Please run the latest SQL migration in Supabase, then try again.',
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

    const participantsLine =
      questMode === 'group'
        ? `\nHelpers: up to ${maxParticipants} · ${isAutoAccept ? 'Auto-accept' : 'Manual approve'}`
        : '';

    Alert.alert(
      'Publish quest?',
      `Guild Appraiser: ${appraisal.tier} tier (${appraisal.confidence} confidence)\nCategory: ${category}\nTotal XP: ${GUILD_BASE_XP + appraisal.bonusXp}${
        tokenBounty > 0 ? `\nTokens: ${tokenBounty}` : ''
      }${participantsLine}`,
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Publish',
          onPress: publishToSupabase,
        },
      ],
    );
  }, [isValid, category, appraisal, tokenBounty, questMode, maxParticipants, isAutoAccept, publishToSupabase]);

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
            {/* CATEGORY */}
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
                        { backgroundColor: COLORS.surface },
                        selected && { borderColor: color, backgroundColor: bg, borderWidth: 2 },
                        !selected && styles.categoryChipIdle,
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text
                        style={[
                          styles.categoryLabel,
                          selected && { color: COLORS.textPrimary },
                        ]}
                      >
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <FieldError
                message="Please select a category"
                visible={submitAttempted && !category}
              />
            </View>

            {/* TITLE */}
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
                placeholderTextColor={COLORS.textSecondary}
                value={title}
                onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                autoCorrect
              />
              <FieldError
                message="Title is required"
                visible={submitAttempted && !titleTrim}
              />
            </View>

            {/* DESCRIPTION */}
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
                placeholderTextColor={COLORS.textSecondary}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
                maxLength={DESC_MAX}
                multiline
                textAlignVertical="top"
              />
              <FieldError
                message="Description is required"
                visible={submitAttempted && !descTrim}
              />
            </View>

            {/* LOCATION */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>LOCATION ON CAMPUS</Text>
                <View style={styles.requiredDot} />
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Building, room, or landmark"
                  placeholderTextColor={COLORS.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                  autoCorrect
                />
              </View>
              <FieldError
                message="Campus location is required"
                visible={submitAttempted && !locTrim}
              />
            </View>

            {/* ─── QUEST MODE ─────────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>QUEST MODE</Text>
              </View>

              {/* Mode pill switcher */}
              <View style={styles.modeCard}>
                <View style={styles.modeCardTop}>
                  <View style={styles.modeCardTitleBlock}>
                    <Ionicons
                      name={questMode === 'solo' ? 'person-outline' : 'people-outline'}
                      size={16}
                      color={questMode === 'group' ? COLORS.xp : COLORS.textSecondary}
                    />
                    <Text style={styles.modeCardTitle}>
                      {questMode === 'solo' ? 'Solo Quest' : 'Group Quest'}
                    </Text>
                    {questMode === 'group' && (
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <QuestModePill mode={questMode} onChangeMode={handleModeChange} />
                </View>

                <Text style={styles.modeCardDesc}>
                  {questMode === 'solo'
                    ? 'One hero answers the call. Best for quick personal tasks.'
                    : 'Rally a party of helpers. Great for larger tasks or study groups.'}
                </Text>

                {/* Expandable group config */}
                {questMode === 'group' && (
                  <GroupQuestPanel
                    maxParticipants={maxParticipants}
                    isAutoAccept={isAutoAccept}
                    onChangeMax={setMaxParticipants}
                    onChangeAutoAccept={setIsAutoAccept}
                  />
                )}
              </View>
            </View>
            {/* ──────────────────────────────────────────────────────────────── */}

            {/* GUILD APPRAISER + REWARD */}
            <View style={styles.section}>
              <View style={styles.appraiserCard}>
                <View style={styles.appraiserHeader}>
                  <View style={styles.appraiserTitleRow}>
                    <Ionicons name="sparkles-outline" size={18} color={COLORS.xp} />
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
                    <Text style={[styles.appraiserStatValue, { color: COLORS.token }]}>
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
              <Text style={styles.hint}>Higher bounties get picked up faster.</Text>

              <View style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <View style={styles.rewardLabels}>
                    <Text style={styles.rewardTitle}>XP reward</Text>
                    <Text style={styles.rewardSub}>
                      Auto-set by Guild Appraiser: +{appraisal.bonusXp} XP
                    </Text>
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
                  <Ionicons name="warning" size={18} color={COLORS.error} />
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  publishBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    minWidth: 72,
    alignItems: 'center',
  },
  publishText: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.xp,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  counter: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,
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
    color: COLORS.textSecondary,
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
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
    color: COLORS.error,
    fontFamily: 'DMSans-Regular',
    flex: 1,
  },

  // ── Quest Mode Card ─────────────────────────────────────────────────────────
  modeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  modeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modeCardTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  modeCardTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modeCardDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
  },
  groupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: withOpacity(COLORS.xp, 0.18),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.xp, 0.35),
  },
  groupBadgeText: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: COLORS.xp,
    letterSpacing: 0.5,
  },

  // ── Mode Pill Switcher ──────────────────────────────────────────────────────
  modePillTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: 999,
    padding: 2,
    width: 134,
    height: 34,
    position: 'relative',
    alignItems: 'center',
  },
  modePillIndicator: {
    position: 'absolute',
    top: 2,
    width: '48%',
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.border,
  },
  modePillOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  modePillLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modePillLabelActive: {
    color: COLORS.textPrimary,
  },

  // ── Group Panel ─────────────────────────────────────────────────────────────
  groupPanel: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withOpacity(COLORS.xp, 0.22),
    backgroundColor: withOpacity(COLORS.xp, 0.05),
    overflow: 'hidden',
  },
  groupPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  groupPanelLeft: {
    flex: 1,
    gap: 3,
  },
  groupPanelTitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  groupPanelSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
    lineHeight: 15,
  },
  groupDivider: {
    height: 1,
    backgroundColor: withOpacity(COLORS.xp, 0.15),
    marginHorizontal: 14,
  },

  // Slot dots
  slotDotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  slotDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  slotOverflow: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'DMSans-Regular',
    alignSelf: 'center',
  },

  // Participant stepper
  participantStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantStepBtn: {
    opacity: 1,
  },
  participantValueWrap: {
    alignItems: 'center',
    minWidth: 44,
  },
  participantValue: {
    fontSize: 20,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
    color: COLORS.xp,
    textAlign: 'center',
  },
  participantValueLabel: {
    fontSize: 8,
    fontFamily: 'DMSans-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Auto-accept toggle
  autoAcceptLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  autoAcceptBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: withOpacity(COLORS.xp, 0.18),
  },
  autoAcceptBadgeText: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: COLORS.xp,
  },
  toggleHit: {
    padding: 4,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── Appraiser + Reward ──────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: COLORS.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
  },
  rewardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
    color: COLORS.token,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.error,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
  },
  appraiserBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appraiserBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appraiserHeadline: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appraiserCopy: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 2,
  },
  appraiserStatValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
    color: COLORS.xp,
    textAlign: 'center',
  },
  appraiserStatLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});