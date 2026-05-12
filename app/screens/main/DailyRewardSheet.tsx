import React, { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS } from '../../constants/fonts';
import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayReward = {
  day: number;
  tokens: number;
  xp: number;
  icon: ComponentProps<typeof Ionicons>['name'];
};

type DayState = 'past' | 'current' | 'future';

type DailyRewardSheetProps = {
  visible: boolean;
  currentDay: number;
  alreadyClaimed: boolean;
  rewards?: DayReward[];
  onClose: () => void;
  onClaim: () => Promise<any>;
};

// Mirrors RPC: tokens = 5 + (day-1)*2, xp = day*10
const DEFAULT_REWARDS: DayReward[] = [
  { day: 1, tokens: 5,  xp: 10, icon: 'leaf' },
  { day: 2, tokens: 7,  xp: 20, icon: 'flash' },
  { day: 3, tokens: 9,  xp: 30, icon: 'flame' },
  { day: 4, tokens: 11, xp: 40, icon: 'shield-checkmark' },
  { day: 5, tokens: 13, xp: 50, icon: 'diamond' },
  { day: 6, tokens: 15, xp: 60, icon: 'rocket' },
  { day: 7, tokens: 17, xp: 70, icon: 'trophy' },
];

// ─── Animation Hooks ──────────────────────────────────────────────────────────

function usePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function useGlow() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

function useEnter(active: boolean) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    }
  }, [active, anim]);
  return anim;
}

// ─── Reward Card ──────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  state,
  isFeatured,
  colors,
  pulseScale,
}: {
  reward: DayReward;
  state: DayState;
  isFeatured: boolean;
  colors: any;
  pulseScale: Animated.Value;
}) {
  const styles = createCardStyles(colors);
  const accent = isFeatured ? colors.token : colors.favor;

  const dayLabelStyle = [
    styles.dayLabel,
    state === 'past' && { color: colors.item },
    state === 'current' && { color: accent },
    isFeatured && state !== 'past' && { color: colors.token },
  ];

  const cardStyle = [
    styles.card,
    isFeatured && styles.cardFeatured,
    state === 'past' && styles.cardPast,
    state === 'current' && (isFeatured ? styles.cardCurrentFeatured : styles.cardCurrent),
    state === 'future' && styles.cardFuture,
  ];

  const Icon = () => {
    if (state === 'past') return <Ionicons name="checkmark" size={isFeatured ? 26 : 20} color={colors.item} />;
    if (state === 'future') return <Ionicons name="lock-closed" size={isFeatured ? 22 : 16} color={colors.textSecondary} />;
    return <Ionicons name={reward.icon} size={isFeatured ? 28 : 22} color={accent} />;
  };

  const content = (
    <View style={cardStyle}>
      {isFeatured && state !== 'past' && (
        <View style={styles.featuredRibbon}>
          <Text style={styles.featuredRibbonText}>BONUS</Text>
        </View>
      )}

      <Text style={dayLabelStyle}>DAY {reward.day}</Text>

      <View
        style={[
          styles.iconWrap,
          isFeatured && styles.iconWrapFeatured,
          state === 'past' && styles.iconWrapPast,
          state === 'current' && { borderColor: accent, backgroundColor: withOpacity(accent, 0.12) },
        ]}
      >
        <Icon />
      </View>

      <View style={styles.rewardRow}>
        <View style={state === 'future' && { opacity: 0.5 }}>
          <TokenPixelIcon width={isFeatured ? 14 : 12} height={isFeatured ? 14 : 12} />
        </View>
        <Text style={[styles.rewardValue, state === 'future' && styles.rewardValueMuted]}>{reward.tokens}</Text>
      </View>
      <View style={styles.rewardRow}>
        <Ionicons name="sparkles" size={11} color={state === 'future' ? colors.textSecondary : colors.xp} />
        <Text style={[styles.rewardValue, { color: colors.xp }, state === 'future' && styles.rewardValueMuted]}>
          {reward.xp}
        </Text>
      </View>
    </View>
  );

  return state === 'current' ? (
    <Animated.View style={{ transform: [{ scale: pulseScale }], flex: 1 }}>{content}</Animated.View>
  ) : (
    <View style={{ flex: 1 }}>{content}</View>
  );
}

// ─── Progress Track ───────────────────────────────────────────────────────────

function ProgressTrack({ currentDay, alreadyClaimed, colors }: { currentDay: number; alreadyClaimed: boolean; colors: any }) {
  const styles = createTrackStyles(colors);
  const completed = alreadyClaimed ? currentDay : currentDay - 1;
  const pct = Math.max(0, Math.min(7, completed)) / 7;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.nodes}>
        {Array.from({ length: 7 }).map((_, i) => {
          const day = i + 1;
          const isDone = day <= completed;
          const isToday = day === currentDay && !alreadyClaimed;
          return (
            <View
              key={day}
              style={[
                styles.node,
                isDone && styles.nodeDone,
                isToday && styles.nodeToday,
                day === 7 && styles.nodeFinal,
                day === 7 && isDone && styles.nodeFinalDone,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

export default function DailyRewardSheet({
  visible,
  currentDay,
  alreadyClaimed,
  rewards = DEFAULT_REWARDS,
  onClose,
  onClaim,
}: DailyRewardSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const pulseScale = usePulse();
  const glow = useGlow();
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useEnter(showSuccess);
  const lastSparkleAt = useRef<number | null>(null);

  const triggerSparkles = (count: number) => {
    const now = Date.now();
    if (lastSparkleAt.current && now - lastSparkleAt.current < 400) return;
    lastSparkleAt.current = now;
    const plays = Math.min(6, Math.max(1, Math.floor(count)));
    for (let i = 0; i < plays; i++) {
      setTimeout(() => {
        try { void appSoundManager.play(AppSoundCategory.XpGain, { force: true, volume: 0.9 }); } catch (e) {}
      }, i * 70);
    }
    // final ding
    setTimeout(() => { try { void appSoundManager.play(AppSoundCategory.PurchaseSuccess, { force: true, volume: 1 }); } catch (e) {} }, plays * 70 + 40);
  };

  const currentReward = rewards.find((r) => r.day === currentDay);
  const claimActive = !alreadyClaimed && !!currentReward;

  const handleClaim = async () => {
    try {
      const res = await onClaim();
      if (res) {
        // trigger sparkles tied to the visual counter incrementing
        triggerSparkles(res.tokens_awarded ?? currentReward?.tokens ?? 1);
        setShowSuccess(true);
      }
    } catch (e) {
      // claim failed or was already claimed - do nothing
    }
  };
  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  const stateFor = (day: number): DayState =>
    day < currentDay ? 'past' : day === currentDay ? (alreadyClaimed ? 'past' : 'current') : 'future';

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropFill} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetTint} pointerEvents="none" />

          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>

          {!showSuccess ? (
            <View>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.streakBadge}>
                  <Animated.View style={[styles.streakBadgeGlow, { opacity: glowOpacity }]} />
                  <Ionicons name="flame" size={18} color={colors.warning} />
                  <Text style={styles.streakBadgeText}>
                    <Text style={{ color: colors.textPrimary, fontFamily: FONTS.mono }}>{currentDay}</Text>
                    <Text style={{ color: colors.textSecondary }}> / 7 STREAK</Text>
                  </Text>
                </View>

                <Text style={styles.headerTitle}>Daily Reward</Text>
                <Text style={styles.headerSub}>
                  {alreadyClaimed
                    ? "You're all set for today. Come back tomorrow to keep your streak alive."
                    : `Day ${currentDay} reward is ready — don't break the chain!`}
                </Text>
              </View>

              {/* Progress track */}
              <ProgressTrack currentDay={currentDay} alreadyClaimed={alreadyClaimed} colors={colors} />

              {/* Grid: rows 1-3, 4-6, then 7 featured */}
              <View style={styles.gridRow}>
                {rewards.slice(0, 3).map((r) => (
                  <RewardCard key={r.day} reward={r} state={stateFor(r.day)} isFeatured={false} colors={colors} pulseScale={pulseScale} />
                ))}
              </View>
              <View style={styles.gridRow}>
                {rewards.slice(3, 6).map((r) => (
                  <RewardCard key={r.day} reward={r} state={stateFor(r.day)} isFeatured={false} colors={colors} pulseScale={pulseScale} />
                ))}
              </View>
              <View style={styles.gridRow}>
                <RewardCard reward={rewards[6]} state={stateFor(7)} isFeatured colors={colors} pulseScale={pulseScale} />
              </View>

              {/* Claim button */}
              <Pressable
                onPress={handleClaim}
                disabled={!claimActive}
                style={({ pressed }) => [
                  styles.claimBtn,
                  alreadyClaimed && styles.claimBtnClaimed,
                  !claimActive && styles.claimBtnDisabled,
                  pressed && claimActive && styles.pressed,
                ]}
              >
                {alreadyClaimed ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.bg} />
                    <Text style={styles.claimBtnText}>Claimed for today</Text>
                  </>
                ) : (
                  <>
                    <TokenPixelIcon width={18} height={18} />
                    <Text style={styles.claimBtnText}>
                      Claim +{currentReward?.tokens} · +{currentReward?.xp} XP
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.successContainer,
                {
                  opacity: successAnim,
                  transform: [
                    {
                      scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.successHaloOuter}>
                <Animated.View style={[styles.successHaloInner, { opacity: glowOpacity }]} />
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={56} color={colors.bg} />
                </View>
              </View>

              <Text style={styles.successTitle}>REWARD CLAIMED</Text>
              <Text style={styles.successSub}>Your balances have been updated.</Text>

              <View style={styles.successRewardSummary}>
                <View style={styles.summaryItem}>
                  <TokenPixelIcon width={20} height={20} />
                  <Text style={styles.summaryText}>+{currentReward?.tokens}</Text>
                  <Text style={styles.summaryLabel}>Tokens</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons name="sparkles" size={20} color={colors.xp} />
                  <Text style={[styles.summaryText, { color: colors.xp }]}>+{currentReward?.xp}</Text>
                  <Text style={styles.summaryLabel}>XP</Text>
                </View>
              </View>

              <View style={styles.successStreakChip}>
                <Ionicons name="flame" size={14} color={colors.warning} />
                <Text style={styles.successStreakText}>
                  Streak: <Text style={{ color: colors.textPrimary, fontFamily: FONTS.mono }}>{currentDay}</Text> day{currentDay === 1 ? '' : 's'}
                </Text>
              </View>

              <Pressable onPress={handleClose} style={({ pressed }) => [styles.claimBtn, pressed && styles.pressed, { width: '100%' }]}>
                <Text style={styles.claimBtnText}>Continue</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (C: any) =>
  StyleSheet.create({
    overlay: { flex: 1 },
    backdropFill: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingTop: 8,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: withOpacity(C.bg, 0.92) },
    handleRow: { alignItems: 'center', paddingVertical: 8 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border },
    closeBtn: { position: 'absolute', top: 12, right: 14, zIndex: 10, padding: 6 },

    header: { alignItems: 'center', paddingTop: 4, paddingBottom: 16 },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: withOpacity(C.warning, 0.12),
      borderWidth: 1,
      borderColor: withOpacity(C.warning, 0.35),
      marginBottom: 12,
      overflow: 'hidden',
    },
    streakBadgeGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: withOpacity(C.warning, 0.18) },
    streakBadgeText: { fontSize: 11, fontFamily: FONTS.body, letterSpacing: 1.2 },
    headerTitle: { fontSize: 22, fontFamily: FONTS.display, color: C.textPrimary, marginBottom: 6, textAlign: 'center', lineHeight: 30 },
    headerSub: { fontSize: 13, fontFamily: FONTS.body, color: C.textSecondary, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },

    gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

    claimBtn: {
      backgroundColor: C.favor,
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 14,
    },
    claimBtnClaimed: { backgroundColor: C.item },
    claimBtnDisabled: { opacity: 0.5 },
    claimBtnText: { fontSize: 14, fontFamily: FONTS.body, fontWeight: '700', color: C.bg, letterSpacing: 0.3 },
    pressed: { opacity: 0.85 },

    // Success
    successContainer: { alignItems: 'center', paddingVertical: 16 },
    successHaloOuter: {
      width: 140,
      height: 140,
      borderRadius: 70,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    successHaloInner: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 70,
      backgroundColor: withOpacity(C.favor, 0.18),
    },
    successIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: C.favor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: { fontSize: 18, fontFamily: FONTS.display, color: C.textPrimary, marginBottom: 6, textAlign: 'center', letterSpacing: 1 },
    successSub: { fontSize: 13, fontFamily: FONTS.body, color: C.textSecondary, marginBottom: 20, textAlign: 'center' },
    successRewardSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 16,
      marginBottom: 14,
      width: '100%',
    },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
    summaryDivider: { width: 1, height: 28, backgroundColor: C.border },
    summaryText: { fontSize: 17, fontFamily: FONTS.mono, color: C.token },
    summaryLabel: { fontSize: 11, fontFamily: FONTS.body, color: C.textSecondary, letterSpacing: 0.5 },
    successStreakChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: withOpacity(C.warning, 0.1),
      borderWidth: 1,
      borderColor: withOpacity(C.warning, 0.3),
      marginBottom: 8,
    },
    successStreakText: { fontSize: 12, fontFamily: FONTS.body, color: C.textSecondary },
  });

const createCardStyles = (C: any) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 6,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.surface,
      minHeight: 124,
      justifyContent: 'center',
    },
    cardFeatured: {
      paddingVertical: 16,
      flexDirection: 'row',
      gap: 14,
      justifyContent: 'flex-start',
      paddingHorizontal: 18,
      borderColor: withOpacity(C.token, 0.4),
      backgroundColor: withOpacity(C.token, 0.06),
      minHeight: 92,
      position: 'relative',
    },
    cardPast: { backgroundColor: withOpacity(C.item, 0.07), borderColor: withOpacity(C.item, 0.35) },
    cardCurrent: { borderColor: C.favor, backgroundColor: withOpacity(C.favor, 0.1) },
    cardCurrentFeatured: { borderColor: C.token, backgroundColor: withOpacity(C.token, 0.14) },
    cardFuture: { opacity: 0.5 },

    featuredRibbon: {
      position: 'absolute',
      top: -1,
      right: 12,
      backgroundColor: C.token,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },
    featuredRibbonText: { fontSize: 8, fontFamily: FONTS.display, color: C.bg, letterSpacing: 0.8 },

    dayLabel: { fontSize: 9, fontFamily: FONTS.display, color: C.textSecondary, letterSpacing: 0.6 },

    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: C.surface2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.border,
    },
    iconWrapFeatured: { width: 52, height: 52, borderRadius: 14 },
    iconWrapPast: { backgroundColor: withOpacity(C.item, 0.14), borderColor: withOpacity(C.item, 0.4) },

    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rewardValue: { fontSize: 11, fontFamily: FONTS.mono, color: C.token },
    rewardValueMuted: { color: C.textSecondary },
  });

const createTrackStyles = (C: any) =>
  StyleSheet.create({
    wrap: { marginVertical: 14, marginHorizontal: 6, height: 14, justifyContent: 'center' },
    bar: {
      position: 'absolute',
      left: 6,
      right: 6,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', backgroundColor: C.favor, borderRadius: 2 },
    nodes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    node: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: C.surface2,
      borderWidth: 2,
      borderColor: C.border,
    },
    nodeDone: { backgroundColor: C.favor, borderColor: C.favor },
    nodeToday: { backgroundColor: C.bg, borderColor: C.favor, width: 14, height: 14, borderRadius: 7 },
    nodeFinal: { width: 14, height: 14, borderRadius: 7, borderColor: withOpacity(C.token, 0.6) },
    nodeFinalDone: { backgroundColor: C.token, borderColor: C.token },
  });
