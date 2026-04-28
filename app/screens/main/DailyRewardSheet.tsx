import React, { useEffect, useMemo, useRef, useState, ComponentProps } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS } from '../../constants/fonts'; // Added for consistency

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayReward = {
  day: number;
  tokens: number;
  xp: number;
  // Robust typing for Ionicons names
  icon: ComponentProps<typeof Ionicons>['name']; 
};

type DayState = 'past' | 'current' | 'future';

type DailyRewardSheetProps = {
  visible: boolean;
  currentDay: number;
  alreadyClaimed: boolean;
  rewards?: DayReward[];
  onClose: () => void;
  onClaim: () => void;
};

// ─── Reward Matrix (Updated Icons to avoid TS Error) ──────────────────────────

const DEFAULT_REWARDS: DayReward[] = [
  { day: 1, tokens: 5,  xp: 10, icon: 'star-outline' },
  { day: 2, tokens: 7,  xp: 20, icon: 'flash-outline' },
  { day: 3, tokens: 9,  xp: 30, icon: 'flame-outline' },
  { day: 4, tokens: 11, xp: 40, icon: 'trophy-outline' },
  { day: 5, tokens: 13, xp: 50, icon: 'diamond-outline' },
  { day: 6, tokens: 15, xp: 60, icon: 'rocket-outline' },
  { day: 7, tokens: 17, xp: 70, icon: 'gift-outline' }, // Replaced "crown-outline"
];

// ─── Animation Hooks ──────────────────────────────────────────────────────────

function usePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { 
          toValue: 1.06, 
          duration: 850, 
          easing: Easing.inOut(Easing.sin), 
          useNativeDriver: true 
        }),
        Animated.timing(anim, { 
          toValue: 1, 
          duration: 850, 
          easing: Easing.inOut(Easing.sin), 
          useNativeDriver: true 
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

// ─── Reward Card Component ────────────────────────────────────────────────────

function RewardCard({ reward, state, colors, pulseScale }: { reward: DayReward, state: DayState, colors: any, pulseScale: Animated.Value }) {
  const styles = createCardStyles(colors);
  const content = (
    <View style={[styles.card, state === 'past' && styles.cardPast, state === 'current' && styles.cardCurrent, state === 'future' && styles.cardFuture]}>
      <Text style={[styles.dayLabel, state === 'current' && styles.dayLabelCurrent, state === 'past' && styles.dayLabelPast]}>
        {state === 'current' ? `DAY ${reward.day}` : `D${reward.day}`}
      </Text>
      <View style={[styles.iconWrap, state === 'past' && styles.iconWrapPast]}>
        {state === 'past' ? <Ionicons name="checkmark" size={22} color={colors.item} /> :
         state === 'future' ? <Ionicons name="lock-closed" size={18} color={colors.textSecondary} /> :
         <Ionicons name={reward.icon} size={24} color={colors.token} />}
      </View>
      <View style={styles.rewardPill}>
        <Ionicons name="logo-bitcoin" size={10} color={colors.token} />
        <Text style={[styles.rewardValue, state === 'future' && styles.rewardValueMuted]}>{reward.tokens}</Text>
      </View>
      <View style={[styles.rewardPill, styles.xpPill]}>
        <Ionicons name="sparkles" size={10} color={colors.xp} />
        <Text style={[styles.rewardValue, styles.xpValue, state === 'future' && styles.rewardValueMuted]}>{reward.xp}</Text>
      </View>
    </View>
  );
  return state === 'current' ? <Animated.View style={{ transform: [{ scale: pulseScale }] }}>{content}</Animated.View> : content;
}

// ─── Main Sheet Component ─────────────────────────────────────────────────────

export default function DailyRewardSheet({ visible, currentDay, alreadyClaimed, rewards = DEFAULT_REWARDS, onClose, onClaim }: DailyRewardSheetProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const pulseScale = usePulse();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const currentReward = rewards.find((r) => r.day === currentDay);
  const claimActive = !alreadyClaimed && !!currentReward;

  const handleClaim = () => {
    onClaim();
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropFill} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetTint} pointerEvents="none" />
          <View style={styles.handleRow}><View style={styles.handle} /></View>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>

          {!showSuccess ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.headerEyebrow}>STREAK REWARD</Text>
                <Text style={styles.headerTitle}>Daily Check-In</Text>
                <Text style={styles.headerSub}>
                  {alreadyClaimed ? "You've claimed today's reward. See you tomorrow!" : `Claim your Day ${currentDay} reward before midnight.`}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {rewards.map((reward) => (
                  <RewardCard key={reward.day} reward={reward} state={reward.day < currentDay ? 'past' : reward.day === currentDay ? 'current' : 'future'} colors={colors} pulseScale={pulseScale} />
                ))}
              </ScrollView>

              <View style={styles.streakBar}>
                <Ionicons name="flame" size={16} color={colors.warning} />
                <Text style={styles.streakText}>Day <Text style={{ color: colors.textPrimary, fontFamily: FONTS.mono }}>{currentDay}</Text> of 7 · A Weekly Streak</Text>
              </View>

              <Pressable onPress={handleClaim} disabled={!claimActive} style={({ pressed }) => [styles.claimBtn, !claimActive && styles.claimBtnDisabled, pressed && claimActive && styles.pressed]}>
                {alreadyClaimed ? (
                  <><Ionicons name="checkmark-circle" size={20} color={colors.bg} /><Text style={styles.claimBtnText}>Claimed</Text></>
                ) : (
                  <><Ionicons name="gift-outline" size={20} color={colors.bg} /><Text style={styles.claimBtnText}>Claim {currentReward?.tokens} Tokens + {currentReward?.xp} XP</Text></>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={80} color={colors.favor} />
              </View>
              <Text style={styles.successTitle}>REWARD CLAIMED!</Text>
              <Text style={styles.successSub}>Your balances have been updated.</Text>
              
              <View style={styles.successRewardSummary}>
                <View style={styles.summaryItem}>
                  <Ionicons name="logo-bitcoin" size={20} color={colors.token} />
                  <Text style={styles.summaryText}>+{currentReward?.tokens} Tokens</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="sparkles" size={20} color={colors.xp} />
                  <Text style={[styles.summaryText, { color: colors.xp }]}>+{currentReward?.xp} XP</Text>
                </View>
              </View>

              <Pressable onPress={handleClose} style={({ pressed }) => [styles.claimBtn, pressed && styles.pressed, { width: '100%' }]}>
                <Text style={styles.claimBtnText}>Great!</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: any) => StyleSheet.create({
  overlay: { flex: 1 },
  backdropFill: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: withOpacity(COLORS.bg, 0.9) },
  handleRow: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  closeBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 4 },
  header: { alignItems: 'center', paddingTop: 4, paddingBottom: 20 },
  headerEyebrow: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 6 },
  headerTitle: { fontSize: 24, fontFamily: FONTS.display, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center', lineHeight: 34 },
  headerSub: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  scrollContent: { paddingHorizontal: 4, paddingVertical: 8, gap: 10 },
  streakBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: withOpacity(COLORS.warning, 0.1), borderWidth: 1, borderColor: withOpacity(COLORS.warning, 0.25), marginTop: 12, marginBottom: 14 },
  streakText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textSecondary },
  claimBtn: { backgroundColor: COLORS.favor, paddingVertical: 17, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  claimBtnDisabled: { opacity: 0.38 },
  claimBtnText: { fontSize: 15, fontFamily: FONTS.body, fontWeight: '700', color: COLORS.bg },
  pressed: { opacity: 0.84 },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: withOpacity(COLORS.favor, 0.1), alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontFamily: FONTS.display, color: COLORS.favor, marginBottom: 10, textAlign: 'center' },
  successSub: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 24 },
  successRewardSummary: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  summaryText: { fontSize: 16, fontFamily: FONTS.mono, color: COLORS.token },
});

const createCardStyles = (COLORS: any) => StyleSheet.create({
  card: { width: 80, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  cardPast: { backgroundColor: withOpacity(COLORS.item, 0.06), borderColor: withOpacity(COLORS.item, 0.3) },
  cardCurrent: { backgroundColor: withOpacity(COLORS.favor, 0.1), borderColor: COLORS.favor, elevation: 6 },
  cardFuture: { opacity: 0.45 },
  dayLabel: { fontSize: 9, fontFamily: FONTS.display, color: COLORS.textSecondary, textAlign: 'center' },
  dayLabelCurrent: { color: COLORS.favor, fontSize: 8 },
  dayLabelPast: { color: COLORS.item },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  iconWrapPast: { backgroundColor: withOpacity(COLORS.item, 0.12), borderColor: withOpacity(COLORS.item, 0.35) },
  rewardPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rewardValue: { fontSize: 11, fontFamily: FONTS.mono, color: COLORS.token },
  xpPill: {},
  xpValue: { color: COLORS.xp },
  rewardValueMuted: { color: COLORS.textSecondary },
});