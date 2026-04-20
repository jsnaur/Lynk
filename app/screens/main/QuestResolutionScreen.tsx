import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

import ThumbUpIcon from '../../../assets/QuestScreenAssets/ThumbUp.svg';
import ThumbDownIcon from '../../../assets/QuestScreenAssets/Thumb_down_Icon.svg';
import XpPixelIcon from '../../../assets/QuestScreenAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestScreenAssets/Token_Pixel_Icon.svg';

// ─── Types ───────────────────────────────────────────────────────────────────

type ParticipantRating = 'positive' | 'negative' | null;
type ParticipantOutcome = 'completed' | 'failed' | null;

type Participant = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

type ParticipantEval = {
  outcome: ParticipantOutcome;
  rating: ParticipantRating;
};

type ResolutionPayload = {
  user_id: string;
  status: 'completed' | 'failed';
  rating: 'positive' | 'negative';
};

export type QuestResolutionSheetModalProps = {
  visible?: boolean;
  onClose?: () => void;
  questId: string;
  questTitle: string;
  tokenReward: number;
  xpReward: number;
  onComplete?: () => void;
};

// ─── ParticipantRow ───────────────────────────────────────────────────────────

type ParticipantRowProps = {
  participant: Participant;
  evalState: ParticipantEval;
  onChange: (userId: string, patch: Partial<ParticipantEval>) => void;
  disabled: boolean;
  index: number;
};

const ParticipantRow = ({
  participant,
  evalState,
  onChange,
  disabled,
  index,
}: ParticipantRowProps) => {
  const { outcome, rating } = evalState;
  const isComplete = outcome !== null && rating !== null;

  return (
    <View style={rowStyles.container}>
      {/* Index + Name */}
      <View style={rowStyles.header}>
        <View style={rowStyles.indexBadge}>
          <Text style={rowStyles.indexText}>{index + 1}</Text>
        </View>
        <Text style={rowStyles.name} numberOfLines={1}>
          {participant.display_name}
        </Text>
        {isComplete && (
          <View
            style={[
              rowStyles.doneTag,
              outcome === 'completed' ? rowStyles.doneTagSuccess : rowStyles.doneTagFail,
            ]}
          >
            <Text
              style={[
                rowStyles.doneTagText,
                outcome === 'completed' ? rowStyles.doneTagTextSuccess : rowStyles.doneTagTextFail,
              ]}
            >
              {outcome === 'completed' ? 'Done' : 'Failed'}
            </Text>
          </View>
        )}
      </View>

      {/* Outcome row */}
      <View style={rowStyles.controlRow}>
        <Text style={rowStyles.controlLabel}>Outcome</Text>
        <View style={rowStyles.controlButtons}>
          <Pressable
            onPress={() => onChange(participant.user_id, { outcome: 'completed' })}
            disabled={disabled}
            style={({ pressed }) => [
              rowStyles.outcomeBtn,
              outcome === 'completed' && rowStyles.outcomeBtnSuccess,
              pressed && !disabled && rowStyles.pressed,
            ]}
          >
            <Text
              style={[
                rowStyles.outcomeBtnText,
                outcome === 'completed' && rowStyles.outcomeBtnTextSuccess,
              ]}
            >
              ✓ Completed
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onChange(participant.user_id, { outcome: 'failed' })}
            disabled={disabled}
            style={({ pressed }) => [
              rowStyles.outcomeBtn,
              outcome === 'failed' && rowStyles.outcomeBtnFail,
              pressed && !disabled && rowStyles.pressed,
            ]}
          >
            <Text
              style={[
                rowStyles.outcomeBtnText,
                outcome === 'failed' && rowStyles.outcomeBtnTextFail,
              ]}
            >
              ✗ No-show
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Rating row */}
      <View style={rowStyles.controlRow}>
        <Text style={rowStyles.controlLabel}>Rating</Text>
        <View style={rowStyles.controlButtons}>
          <Pressable
            onPress={() => onChange(participant.user_id, { rating: 'positive' })}
            disabled={disabled}
            style={({ pressed }) => [
              rowStyles.ratingBtn,
              rating === 'positive' && rowStyles.ratingBtnPositive,
              pressed && !disabled && rowStyles.pressed,
            ]}
          >
            <ThumbUpIcon width={16} height={16} />
            <Text
              style={[
                rowStyles.ratingBtnText,
                rating === 'positive' ? rowStyles.ratingTextPositive : rowStyles.ratingTextIdle,
              ]}
            >
              Positive
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onChange(participant.user_id, { rating: 'negative' })}
            disabled={disabled}
            style={({ pressed }) => [
              rowStyles.ratingBtn,
              rating === 'negative' && rowStyles.ratingBtnNegative,
              pressed && !disabled && rowStyles.pressed,
            ]}
          >
            <ThumbDownIcon width={16} height={16} />
            <Text
              style={[
                rowStyles.ratingBtnText,
                rating === 'negative' ? rowStyles.ratingTextNegative : rowStyles.ratingTextIdle,
              ]}
            >
              Negative
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={rowStyles.divider} />
    </View>
  );
};

// ─── QuestResolutionSheetModal ────────────────────────────────────────────────

const QuestResolutionSheetModal = ({
  visible = true,
  onClose,
  questId,
  questTitle,
  tokenReward,
  xpReward,
  onComplete,
}: QuestResolutionSheetModalProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evals, setEvals] = useState<Record<string, ParticipantEval>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { refreshBalance } = useTokenBalance();

  // ── Fetch participants on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!visible || !questId) return;

    const fetchParticipants = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from('quest_participants')
          .select('user_id, profiles(display_name, avatar_url)')
          .eq('quest_id', questId)
          .eq('status', 'accepted');

        if (error) throw error;

        const mapped: Participant[] = (data ?? []).map((row: any) => ({
          user_id: row.user_id,
          display_name: row.profiles?.display_name ?? 'Unknown',
          avatar_url: row.profiles?.avatar_url ?? null,
        }));

        setParticipants(mapped);
        // Seed eval state for each participant
        const seed: Record<string, ParticipantEval> = {};
        mapped.forEach((p) => {
          seed[p.user_id] = { outcome: null, rating: null };
        });
        setEvals(seed);
      } catch (err: any) {
        console.error('Failed to fetch participants:', err);
        Alert.alert('Error', 'Could not load participants. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchParticipants();
  }, [visible, questId]);

  // ── Eval helpers ─────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (userId: string, patch: Partial<ParticipantEval>) => {
      setEvals((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], ...patch },
      }));
    },
    [],
  );

  // ── Derived state ─────────────────────────────────────────────────────────
  const evaluatedCount = useMemo(
    () =>
      Object.values(evals).filter((e) => e.outcome !== null && e.rating !== null).length,
    [evals],
  );

  const allEvaluated = useMemo(
    () => participants.length > 0 && evaluatedCount === participants.length,
    [participants.length, evaluatedCount],
  );

  const submitLabel = useMemo(() => {
    if (isSubmitting) return 'Resolving...';
    if (isSubmitted) return 'Quest Resolved!';
    if (!allEvaluated)
      return `Evaluate all (${evaluatedCount}/${participants.length})`;
    return 'Submit & Finish';
  }, [isSubmitting, isSubmitted, allEvaluated, evaluatedCount, participants.length]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allEvaluated || isSubmitting) return;

    const resolutions: ResolutionPayload[] = participants.map((p) => ({
      user_id: p.user_id,
      status: evals[p.user_id].outcome as 'completed' | 'failed',
      rating: evals[p.user_id].rating as 'positive' | 'negative',
    }));

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('resolve_group_quest', {
        p_quest_id: questId,
        p_resolutions: resolutions,
      });

      if (error) throw error;

      await refreshBalance();
      setIsSubmitted(true);
      onComplete?.();

      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to resolve group quest:', err);
      Alert.alert('Error', err.message || 'Failed to resolve the quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose?.();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Dismiss" />

        <View style={styles.screen}>
          {/* Handle */}
          <Pressable style={styles.handleWrap} onPress={handleClose}>
            <View style={styles.handleBar} />
          </Pressable>

          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Resolve Quest</Text>
            <Text style={styles.questTitle}>"{questTitle}"</Text>
            {participants.length > 0 && (
              <View style={styles.progressPill}>
                <Text style={styles.progressText}>
                  {evaluatedCount}/{participants.length} evaluated
                </Text>
              </View>
            )}
          </View>

          {/* Body */}
          {isFetching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.favor} size="small" />
              <Text style={styles.loadingText}>Loading participants…</Text>
            </View>
          ) : participants.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No accepted participants found.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {participants.map((p, i) => (
                <ParticipantRow
                  key={p.user_id}
                  participant={p}
                  evalState={evals[p.user_id] ?? { outcome: null, rating: null }}
                  onChange={handleChange}
                  disabled={isSubmitting || isSubmitted}
                  index={i}
                />
              ))}

              {/* Reward preview — visible once all are evaluated */}
              {allEvaluated && (
                <LinearGradient
                  style={styles.rewardCard}
                  locations={[0, 1]}
                  colors={[withOpacity(COLORS.token, 0.10), withOpacity(COLORS.xp, 0.10)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.rewardIcons}>
                    <XpPixelIcon width={32} height={32} />
                    <TokenPixelIcon width={32} height={32} />
                  </View>
                  <View style={styles.rewardTextWrap}>
                    <View style={styles.rewardTopRow}>
                      <Text style={styles.rewardXpText}>+{xpReward} XP</Text>
                      <Text style={styles.rewardTokenText}>+{tokenReward} Tokens</Text>
                    </View>
                    <Text style={styles.rewardSubtext}>Karma updated. Quest archived.</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Spacer for footer */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* Footer submit button */}
          {!isFetching && participants.length > 0 && (
            <View style={styles.footer}>
              <Pressable
                onPress={handleSubmit}
                disabled={!allEvaluated || isSubmitted || isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  (!allEvaluated || isSubmitted || isSubmitting) && styles.submitButtonDisabled,
                  allEvaluated && !isSubmitted && pressed && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.submitLabel}>{submitLabel}</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── ParticipantRow Styles ────────────────────────────────────────────────────

const rowStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: `${FONTS.mono}-Bold`,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: `${FONTS.body}-SemiBold`,
    fontWeight: '600',
  },
  doneTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doneTagSuccess: {
    backgroundColor: withOpacity(COLORS.item, 0.14),
  },
  doneTagFail: {
    backgroundColor: withOpacity(COLORS.error, 0.14),
  },
  doneTagText: {
    fontSize: 11,
    fontFamily: `${FONTS.body}-Medium`,
    fontWeight: '500',
  },
  doneTagTextSuccess: {
    color: COLORS.item,
  },
  doneTagTextFail: {
    color: COLORS.error,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  controlLabel: {
    width: 56,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: `${FONTS.body}-Regular`,
  },
  controlButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  outcomeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outcomeBtnSuccess: {
    backgroundColor: withOpacity(COLORS.item, 0.12),
    borderColor: COLORS.item,
    borderWidth: 2,
  },
  outcomeBtnFail: {
    backgroundColor: withOpacity(COLORS.error, 0.12),
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  outcomeBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: `${FONTS.body}-Medium`,
    fontWeight: '500',
  },
  outcomeBtnTextSuccess: {
    color: COLORS.item,
  },
  outcomeBtnTextFail: {
    color: COLORS.error,
  },
  ratingBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  ratingBtnPositive: {
    backgroundColor: withOpacity(COLORS.item, 0.12),
    borderColor: COLORS.item,
    borderWidth: 2,
  },
  ratingBtnNegative: {
    backgroundColor: withOpacity(COLORS.error, 0.12),
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  ratingBtnText: {
    fontSize: 12,
    fontFamily: `${FONTS.body}-Medium`,
    fontWeight: '500',
  },
  ratingTextIdle: {
    color: COLORS.textSecondary,
  },
  ratingTextPositive: {
    color: COLORS.item,
  },
  ratingTextNegative: {
    color: '#ff8d8d',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  screen: {
    minHeight: '78%',
    maxHeight: '92%',
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 0,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: `${FONTS.body}-Bold`,
    fontWeight: '700',
    textAlign: 'center',
  },
  questTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: `${FONTS.body}-Regular`,
    textAlign: 'center',
  },
  progressPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: withOpacity(COLORS.favor, 0.10),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.favor, 0.30),
  },
  progressText: {
    fontSize: 12,
    color: COLORS.favor,
    fontFamily: `${FONTS.mono}-Regular`,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: `${FONTS.body}-Regular`,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: `${FONTS.body}-Regular`,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  rewardCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.token,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  rewardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardTextWrap: {
    flex: 1,
    gap: 2,
  },
  rewardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rewardXpText: {
    color: COLORS.xp,
    fontSize: 15,
    fontFamily: `${FONTS.mono}-Bold`,
    fontWeight: '700',
  },
  rewardTokenText: {
    color: COLORS.token,
    fontSize: 15,
    fontFamily: `${FONTS.mono}-Bold`,
    fontWeight: '700',
  },
  rewardSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: `${FONTS.body}-Regular`,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.favor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    color: COLORS.bg,
    fontSize: 16,
    fontFamily: `${FONTS.body}-Bold`,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

export default QuestResolutionSheetModal;