import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface CompactQuestCardProps {
  quest: FeedQuest & { 
    id?: string; 
    user_id?: string; 
    description?: string; 
    bonus_xp?: number; 
    token_bounty?: number; 
    accepted_by?: string;
    status?: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  statusLabel?: string;
}

const CATEGORY_COLORS: Record<FeedCategory, string> = {
  favor: COLORS.favor,
  study: COLORS.study,
  item: COLORS.item,
};

export default function CompactQuestCard({
  quest,
  isExpanded,
  onToggle,
  statusLabel = 'Open',
}: CompactQuestCardProps) {
  const category = (quest?.category ?? 'favor') as FeedCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const title = quest?.title ?? 'Untitled Quest';
  const description = quest?.description ?? quest?.preview ?? '';
  const xp = quest?.bonus_xp ?? quest?.xp ?? 0;
  const token = quest?.token_bounty ?? quest?.token ?? 0;

  return (
    <View style={styles.container}>
      {/* HEADER - Always Visible */}
      <Pressable
        style={[styles.header, isExpanded && styles.headerExpanded]}
        onPress={onToggle}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: withOpacity(categoryColor, 0.15) }]}>
            <View style={[styles.dot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusPill, { backgroundColor: withOpacity(COLORS.item, 0.15) }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </View>
      </Pressable>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Description */}
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          {/* Rewards */}
          <View style={styles.rewardBox}>
            <View style={styles.rewardBlock}>
              <XpPixelIcon width={40} height={40} />
              <Text style={styles.rewardValue}>{xp}</Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rewardBlock}>
              <TokenPixelIcon width={40} height={40} />
              <Text style={[styles.rewardValue, styles.tokenValue]}>{token}</Text>
              <Text style={styles.rewardLabel}>Tokens</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
    gap: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  title: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: COLORS.item,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.body,
  },
  rewardBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rewardBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.border,
  },
  rewardValue: {
    color: COLORS.xp,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  tokenValue: {
    color: COLORS.token,
  },
  rewardLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: FONTS.body,
  },
});