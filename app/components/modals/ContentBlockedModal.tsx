import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { useTheme } from '../../contexts/ThemeContext';
import type { ModerationCategory } from '../../services/ModeratorService';

type Props = {
  visible: boolean;
  onClose: () => void;
  reason?: string;
  category?: ModerationCategory;
  contentType?: 'quest' | 'comment' | 'profile' | 'content';
};

const CATEGORY_LABEL: Record<ModerationCategory, string> = {
  sexual: 'Sexual content',
  profanity: 'Vulgar language',
  hate: 'Hate speech',
  harassment: 'Harassment',
  violence: 'Violence or harm',
  spam: 'Spam',
  other: 'Policy violation',
};

const CATEGORY_ICON: Record<ModerationCategory, keyof typeof Ionicons.glyphMap> = {
  sexual: 'eye-off-outline',
  profanity: 'chatbubble-ellipses-outline',
  hate: 'ban-outline',
  harassment: 'warning-outline',
  violence: 'alert-circle-outline',
  spam: 'mail-unread-outline',
  other: 'shield-outline',
};

export default function ContentBlockedModal({
  visible,
  onClose,
  reason,
  category,
  contentType = 'content',
}: Props) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  const tag = category ? CATEGORY_LABEL[category] : 'Policy violation';
  const iconName = category ? CATEGORY_ICON[category] : 'shield-outline';

  const subjectMap: Record<NonNullable<Props['contentType']>, string> = {
    quest: 'quest',
    comment: 'comment',
    profile: 'bio',
    content: 'content',
  };
  const subject = subjectMap[contentType];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { backgroundColor: withOpacity('#000000', 0.65), opacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.error, 0.4),
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.iconColumn}>
            <View
              style={[
                styles.iconRing,
                { borderColor: withOpacity(colors.error, 0.25) },
              ]}
            />
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: withOpacity(colors.error, 0.18),
                  borderColor: withOpacity(colors.error, 0.5),
                },
              ]}
            >
              <Ionicons name={iconName} size={30} color={colors.error} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Content Blocked</Text>

          <View
            style={[
              styles.tagRow,
              {
                backgroundColor: withOpacity(colors.error, 0.12),
                borderColor: withOpacity(colors.error, 0.35),
              },
            ]}
          >
            <View style={[styles.tagDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.tagText, { color: colors.error }]}>{tag}</Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your {subject} can't be posted because it appears to violate our community guidelines.
          </Text>

          {!!reason && (
            <View
              style={[
                styles.reasonBox,
                { backgroundColor: colors.surface2, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>REASON</Text>
              <Text style={[styles.reasonText, { color: colors.textPrimary }]} numberOfLines={4}>
                {reason}
              </Text>
            </View>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.error },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.buttonText}>Edit & Try Again</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconColumn: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  reasonLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  reasonText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
