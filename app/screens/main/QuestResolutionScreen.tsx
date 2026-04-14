import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ThumbUpIcon from '../../../assets/QuestScreenAssets/ThumbUp.svg';
import ThumbDownIcon from '../../../assets/QuestScreenAssets/Thumb_down_Icon.svg';
import XpPixelIcon from '../../../assets/QuestScreenAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestScreenAssets/Token_Pixel_Icon.svg';

type Rating = 'positive' | 'negative' | null;

const QUEST_TITLE = 'Lemme borrow scientific calculator';
const POSTER_NAME = 'Quest Poster';
const XP_REWARD = 200;

type QuestResolutionSheetModalProps = {
  visible?: boolean;
  onClose?: () => void;
  tokenReward?: number;
  onComplete?: (reward: number) => void;
};

const QuestResolutionSheetModal = ({
  visible = true,
  onClose,
  tokenReward = 3,
  onComplete,
}: QuestResolutionSheetModalProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [rating, setRating] = useState<Rating>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = isCompleted && rating !== null;
  const shouldShowRating = isCompleted;
  const shouldShowRewards = rating !== null;
  const submitLabel = useMemo(() => {
    if (isSubmitted) {
      return 'Completed!';
    }
    if (!canSubmit) {
      return 'Complete + Rate to Submit';
    }
    return 'Submit & Finish';
  }, [canSubmit, isSubmitted]);

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    setIsSubmitted(true);
    onComplete?.(tokenReward);
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
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
            <Text style={styles.title}>Complete This Quest?</Text>
            <Text style={styles.questTitle}>"{QUEST_TITLE}"</Text>
          </View>

          <View style={styles.section}>
            <Pressable
              onPress={() => {
                if (!isCompleted) {
                  setIsCompleted(true);
                }
              }}
              disabled={isCompleted}
              style={({ pressed }) => [
                styles.completeButton,
                isCompleted && styles.completeButtonDone,
                isCompleted && styles.completeButtonLocked,
                !isCompleted && pressed && styles.pressed,
              ]}
            >
              <Text style={styles.completeButtonText}>
                {isCompleted ? 'Marked as Completed' : 'Mark as Completed'}
              </Text>
            </Pressable>
          </View>

          {shouldShowRating && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>now, rate your experience</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.section}>
                <Text style={styles.ratingPrompt}>
                  How was <Text style={styles.posterName}>{POSTER_NAME}</Text> as a quest partner?
                </Text>

                <View style={styles.ratingRow}>
                  <Pressable
                    onPress={() => setRating('positive')}
                    style={({ pressed }) => [
                      styles.ratingButton,
                      styles.positiveButton,
                      rating === 'positive' && styles.positiveButtonActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThumbUpIcon width={24} height={24} />
                    <Text
                      style={[
                        styles.ratingButtonLabel,
                        rating === 'positive' ? styles.positiveText : styles.idleText,
                      ]}
                    >
                      Positive
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setRating('negative')}
                    style={({ pressed }) => [
                      styles.ratingButton,
                      styles.negativeButton,
                      rating === 'negative' && styles.negativeButtonActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThumbDownIcon width={24} height={24} />
                    <Text
                      style={[
                        styles.ratingButtonLabel,
                        rating === 'negative' ? styles.negativeText : styles.idleText,
                      ]}
                    >
                      Negative
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {shouldShowRewards && (
            <>
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
                      <Text style={styles.rewardXpText}>+{XP_REWARD} XP</Text>
                      <Text style={styles.rewardTokenText}>+{tokenReward} Tokens</Text>
                    </View>
                    <Text style={styles.rewardSubtext}>Karma updated. Quest archived.</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.footer}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit || isSubmitted}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!canSubmit || isSubmitted) && styles.submitButtonDisabled,
                    canSubmit && !isSubmitted && pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.submitLabel}>{submitLabel}</Text>
                </Pressable>
              </View>
            </>
          )}
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
    minHeight: '78%',
    maxHeight: '88%',
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
    paddingBottom: 20,
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
  section: {
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  completeButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#39ff14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonDone: {
    backgroundColor: '#6f7280',
  },
  completeButtonLocked: {
    opacity: 0.9,
  },
  completeButtonText: {
    color: '#1a1a1f',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a48',
  },
  dividerLabel: {
    fontSize: 12,
    color: '#8a8a9a',
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  },
  ratingPrompt: {
    color: '#8a8a9a',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'DMSans-Regular',
    marginBottom: 12,
  },
  posterName: {
    color: '#f0f0f5',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  positiveButton: {
    backgroundColor: '#31313c',
    borderColor: '#3a3a48',
  },
  positiveButtonActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: '#39ff14',
    borderWidth: 2,
  },
  negativeButton: {
    backgroundColor: '#31313c',
    borderColor: '#3a3a48',
  },
  negativeButtonActive: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderColor: '#ff5c5c',
    borderWidth: 2,
  },
  ratingButtonLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    fontWeight: '500',
  },
  idleText: {
    color: '#8a8a9a',
  },
  positiveText: {
    color: '#39ff14',
  },
  negativeText: {
    color: '#ff8d8d',
  },
  rewardCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffd700',
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
    paddingBottom: 24,
    marginTop: 'auto',
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
              							