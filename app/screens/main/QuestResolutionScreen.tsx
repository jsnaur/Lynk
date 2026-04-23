import React, { useMemo, useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';

import ThumbUpIcon from '../../../assets/QuestScreenAssets/ThumbUp.svg';
import ThumbDownIcon from '../../../assets/QuestScreenAssets/Thumb_down_Icon.svg';
import XpPixelIcon from '../../../assets/QuestScreenAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestScreenAssets/Token_Pixel_Icon.svg';

type Rating = 'positive' | 'negative' | null;
type Outcome = 'completed' | 'failed' | null;

type ParticipantEvaluation = {
  userId: string;
  name: string;
  outcome: Outcome;
  rating: Rating;
};

export type QuestResolutionSheetModalProps = {
  visible?: boolean;
  onClose?: () => void;
  questId: string;
  questTitle: string;
  acceptorName: string; // Kept for prop-compatibility, but we fetch the true list dynamically
  tokenReward: number;
  xpReward: number;
  onComplete?: () => void;
};

const QuestResolutionSheetModal = ({
  visible = true,
  onClose,
  questId,
  questTitle,
  tokenReward,
  xpReward,
  onComplete,
}: QuestResolutionSheetModalProps) => {
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [evaluations, setEvaluations] = useState<ParticipantEvaluation[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { refreshBalance } = useTokenBalance();

  useEffect(() => {
    let mounted = true;
    if (!visible) return;

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const { data, error } = await supabase
          .from('quest_participants')
          .select('user_id, profiles(display_name)')
          .eq('quest_id', questId)
          .eq('status', 'accepted');

        if (error) throw error;

        if (mounted && data) {
          setEvaluations(
            data.map((d: any) => ({
              userId: d.user_id,
              name: d.profiles?.display_name || 'Anonymous',
              outcome: null,
              rating: null,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch participants', err);
      } finally {
        if (mounted) setLoadingParticipants(false);
      }
    };

    fetchParticipants();

    return () => {
      mounted = false;
    };
  }, [questId, visible]);

  const updateEvaluation = (userId: string, key: 'outcome' | 'rating', value: any) => {
    setEvaluations((prev) =>
      prev.map((ev) => {
        if (ev.userId !== userId) return ev;
        const updated = { ...ev, [key]: value };
        // Reset rating if they failed the quest
        if (key === 'outcome' && value === 'failed') {
          updated.rating = null;
        }
        return updated;
      })
    );
  };

  const canSubmit = useMemo(() => {
    if (evaluations.length === 0) return false;
    // Everyone must have an outcome. If completed, they must also have a rating.
    return evaluations.every(
      (ev) => ev.outcome === 'failed' || (ev.outcome === 'completed' && ev.rating !== null)
    );
  }, [evaluations]);

  const submitLabel = useMemo(() => {
    if (isSubmitting) return 'Resolving...';
    if (isSubmitted) return 'Completed!';
    if (!canSubmit) return 'Complete evaluations to submit';
    return 'Submit & Finish';
  }, [canSubmit, isSubmitted, isSubmitting]);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = evaluations.map((ev) => ({
        user_id: ev.userId,
        status: ev.outcome,
        rating: ev.rating,
      }));

      const { error } = await supabase.rpc('resolve_group_quest', {
        p_quest_id: questId,
        p_resolutions: payload,
      });

      if (error) throw error;

      await refreshBalance();
      setIsSubmitted(true);
      onComplete?.();

      setTimeout(() => {
        onClose?.();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to resolve group quest:', error);
      Alert.alert('Error', error.message || 'Failed to resolve the quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose?.();
    }
  };

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
          <Pressable style={styles.handleWrap} onPress={handleClose}>
            <View style={styles.handleBar} />
          </Pressable>

          <View style={styles.headerBlock}>
            <Text style={styles.title}>Quest Resolution</Text>
            <Text style={styles.questTitle}>"{questTitle}"</Text>
          </View>

          {loadingParticipants ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator color="#00f5ff" size="large" />
              <Text style={styles.loadingText}>Fetching participants...</Text>
            </View>
          ) : evaluations.length === 0 ? (
            <View style={styles.centerWrap}>
              <Text style={styles.loadingText}>No active participants found.</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollArea} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {evaluations.map((ev) => {
                const isCompleted = ev.outcome === 'completed';
                const isFailed = ev.outcome === 'failed';

                return (
                  <View key={ev.userId} style={styles.evalCard}>
                    <Text style={styles.evalName}>{ev.name}</Text>

                    <View style={styles.outcomeRow}>
                      <Pressable
                        onPress={() => updateEvaluation(ev.userId, 'outcome', 'failed')}
                        style={[styles.outcomeBtn, isFailed && styles.outcomeBtnFailed]}
                      >
                        <Text style={[styles.outcomeText, isFailed && styles.outcomeTextFailedActive]}>
                          Failed
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => updateEvaluation(ev.userId, 'outcome', 'completed')}
                        style={[styles.outcomeBtn, isCompleted && styles.outcomeBtnCompleted]}
                      >
                        <Text style={[styles.outcomeText, isCompleted && styles.outcomeTextCompletedActive]}>
                          Completed
                        </Text>
                      </Pressable>
                    </View>

                    {isCompleted && (
                      <View style={styles.ratingRowGroup}>
                        <Pressable
                          onPress={() => updateEvaluation(ev.userId, 'rating', 'negative')}
                          style={[
                            styles.ratingBtnSmall,
                            ev.rating === 'negative' && styles.ratingBtnSmallNeg,
                          ]}
                        >
                          <ThumbDownIcon width={20} height={20} />
                          <Text style={[styles.ratingBtnText, ev.rating === 'negative' && styles.textNeg]}>
                            Negative
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => updateEvaluation(ev.userId, 'rating', 'positive')}
                          style={[
                            styles.ratingBtnSmall,
                            ev.rating === 'positive' && styles.ratingBtnSmallPos,
                          ]}
                        >
                          <ThumbUpIcon width={20} height={20} />
                          <Text style={[styles.ratingBtnText, ev.rating === 'positive' && styles.textPos]}>
                            Positive
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={styles.section}>
                <LinearGradient
                  style={styles.rewardCard}
                  locations={[0, 1]}
                  colors={['rgba(255, 215, 0, 0.10)', 'rgba(192, 132, 252, 0.10)']}
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
                      <Text style={styles.rewardTokenText}>{tokenReward} Tokens</Text>
                    </View>
                    <Text style={styles.rewardSubtext}>Rewards pool split among completed.</Text>
                  </View>
                </LinearGradient>
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitted || isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                (!canSubmit || isSubmitted || isSubmitting) && styles.submitButtonDisabled,
                canSubmit && !isSubmitted && pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#1a1a1f" />
              ) : (
                <Text style={styles.submitLabel}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    height: '88%',
    width: '100%',
    backgroundColor: '#26262e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
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
    backgroundColor: '#3a3a48',
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
    color: '#f0f0f5',
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  questTitle: {
    fontSize: 14,
    color: '#f0f0f5',
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8a8a9a',
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 14,
  },
  evalCard: {
    backgroundColor: '#31313c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a3a48',
    padding: 16,
    gap: 14,
  },
  evalName: {
    color: '#f0f0f5',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    fontWeight: '600',
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outcomeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a48',
    backgroundColor: '#26262e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeBtnFailed: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderColor: '#ff5c5c',
  },
  outcomeBtnCompleted: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: '#39ff14',
  },
  outcomeText: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#8a8a9a',
  },
  outcomeTextFailedActive: {
    color: '#ff8d8d',
  },
  outcomeTextCompletedActive: {
    color: '#39ff14',
  },
  ratingRowGroup: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#3a3a48',
    paddingTop: 14,
  },
  ratingBtnSmall: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a48',
    backgroundColor: '#26262e',
  },
  ratingBtnSmallPos: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: '#39ff14',
  },
  ratingBtnSmallNeg: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderColor: '#ff5c5c',
  },
  ratingBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: '#8a8a9a',
  },
  textPos: { color: '#39ff14' },
  textNeg: { color: '#ff8d8d' },
  section: {
    marginTop: 6,
  },
  rewardCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: '#c084fc',
    fontSize: 15,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
  },
  rewardTokenText: {
    color: '#ffd700',
    fontSize: 15,
    fontFamily: 'SpaceMono-Bold',
    fontWeight: '700',
  },
  rewardSubtext: {
    color: '#8a8a9a',
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    color: '#1a1a1f',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

export default QuestResolutionSheetModal;