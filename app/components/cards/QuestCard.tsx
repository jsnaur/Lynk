import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';
import EarnedChip from '../../components/chips/EarnedChip';

type QuestCategory = 'Favor' | 'Study' | 'Item';

type QuestCardProps = {
  variant?: QuestCategory;
  title?: string;
  description?: string;
  posterName?: string;
  posterAvatarUrl?: string;
  xpReward?: number;
  tokenReward?: number;
  timeAgo?: string;
  onPress?: () => void;
};

export default function QuestCard({
  variant = 'Favor',
  title = 'Quest Title',
  description = 'Quest preview text, lorem ipsum dolor sit amet.',
  posterName = 'Poster Name',
  posterAvatarUrl,
  xpReward = 30,
  tokenReward = 30,
  timeAgo = '23m ago',
  onPress,
}: QuestCardProps) {
  const getCategoryColor = () => {
    switch (variant) {
      case 'Favor':
        return FEED_COLORS.favor;
      case 'Study':
        return FEED_COLORS.study;
      case 'Item':
        return FEED_COLORS.item;
      default:
        return FEED_COLORS.favor;
    }
  };

  const categoryColor = getCategoryColor();
  const badges = {
    Favor: 'FAVOR',
    Study: 'STUDY',
    Item: 'ITEM',
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: categoryColor }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Category stripe */}
      <View
        style={[
          styles.stripe,
          { backgroundColor: categoryColor },
        ]}
      />

      {/* Card body */}
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${categoryColor}25` },
            ]}
          >
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: categoryColor },
              ]}
            />
            <Text style={[styles.badgeText, { color: categoryColor }]}>
              {badges[variant]}
            </Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.posterChip}>
            {posterAvatarUrl ? (
              <Image
                source={{ uri: posterAvatarUrl }}
                style={styles.posterAvatar}
              />
            ) : (
              <View style={styles.posterAvatarPlaceholder} />
            )}
            <Text style={styles.posterName}>{posterName}</Text>
          </View>

          <View style={styles.bountyCluster}>
            <EarnedChip type="Experience" value={xpReward} />
            <EarnedChip type="Tokens" value={tokenReward} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#26262e',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: 326,
  },
  stripe: {
    height: 4,
    width: '100%',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DM_Sans-Medium',
  },
  timeAgo: {
    color: '#8a8a9a',
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
  },
  title: {
    color: '#f0f0f5',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
  description: {
    color: '#8a8a9a',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  posterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  posterAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3a3a48',
  },
  posterName: {
    color: '#8a8a9a',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DM_Sans-Medium',
  },
  bountyCluster: {
    flexDirection: 'row',
    gap: 8,
  },
});
