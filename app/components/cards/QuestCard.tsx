import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface QuestCardProps {
  quest: FeedQuest & { max_participants?: number; maxParticipants?: number };
  onPress?: () => void;
}

const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = {
  favor: { label: 'FAVOR', color: COLORS.favor },
  study: { label: 'STUDY', color: COLORS.study },
  item: { label: 'ITEM', color: COLORS.item },
};

export default function QuestCard({ quest, onPress }: QuestCardProps) {
  const categoryMeta = CATEGORY_META[quest.category] || CATEGORY_META.favor;
  
  // Safely check for either snake_case or camelCase depending on how the frontend mapped the RPC payload
  const maxParticipants = quest.max_participants || quest.maxParticipants || 1;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={[styles.stripe, { backgroundColor: categoryMeta.color }]} />
      
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: withOpacity(categoryMeta.color, 0.15) }]}>
              <View style={[styles.categoryDot, { backgroundColor: categoryMeta.color }]} />
              <Text style={[styles.categoryLabel, { color: categoryMeta.color }]}>
                {categoryMeta.label}
              </Text>
            </View>

            {maxParticipants > 1 && (
              <View style={styles.groupBadge}>
                <MaterialCommunityIcons name="account-group-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.groupBadgeText}>Group: {maxParticipants} Slots</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>{quest.ago}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{quest.title}</Text>
        <Text style={styles.preview} numberOfLines={3}>{quest.preview}</Text>

        <View style={styles.footerRow}>
          <View style={styles.userWrap}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.userName}>{quest.posterName}</Text>
          </View>

          <View style={styles.rewardWrap}>
            <View style={[styles.rewardPill, { backgroundColor: withOpacity(COLORS.xp, 0.15) }]}>
              <MaterialCommunityIcons name="star-four-points" size={14} color={COLORS.xp} />
              <Text style={[styles.rewardValue, { color: COLORS.xp }]}>{quest.xp}</Text>
            </View>

            <View style={[styles.rewardPill, { backgroundColor: withOpacity(COLORS.token, 0.15) }]}>
              <MaterialCommunityIcons name="lightning-bolt-circle" size={14} color={COLORS.token} />
              <Text style={[styles.rewardValue, { color: COLORS.token }]}>{quest.token}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stripe: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surface2,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  rewardWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
});