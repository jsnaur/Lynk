import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';
import RatingReceivedIcon from '../icons/RatingReceivedIcon';

type Category = 'Favor' | 'Study' | 'Item';

interface QuestHistoryCardProps {
  category: Category;
  title: string;
  role?: string;
  xpEarned: number;
  tokenEarned: number;
  onPress?: () => void;
}

const QuestHistoryCard: React.FC<QuestHistoryCardProps> = ({
  category,
  title,
  role = 'Contributor',
  xpEarned,
  tokenEarned,
  onPress,
}) => {
  const getCategoryColor = (): string => {
    switch (category) {
      case 'Favor':
        return FEED_COLORS.favor;
      case 'Study':
        return FEED_COLORS.study;
      case 'Item':
        return FEED_COLORS.item;
    }
  };

  const getEarnedColor = (type: 'xp' | 'token'): string => {
    return type === 'xp' ? FEED_COLORS.xp : FEED_COLORS.token;
  };

  const styles = StyleSheet.create({
    container: {
      width: 342,
      backgroundColor: '#26262e',
      borderRadius: 12,
      overflow: 'hidden',
      marginVertical: 6,
      marginHorizontal: 16,
    },
    topSection: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#3a3a48',
    },
    categoryStripe: {
      width: 3,
      backgroundColor: getCategoryColor(),
    },
    titleContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontFamily: 'DM Sans',
      fontWeight: '600',
      color: '#f0f0f5',
      marginBottom: 4,
    },
    role: {
      fontSize: 12,
      fontFamily: 'DM Sans',
      fontWeight: '400',
      color: '#8a8a9a',
    },
    bottomSection: {
      flexDirection: 'row',
      padding: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    earnedContainer: {
      flexDirection: 'row',
      gap: 8,
      flex: 1,
    },
    earnedChip: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#31313c',
    },
    xpChip: {
      backgroundColor: `${FEED_COLORS.xp}26`, // 15% opacity
    },
    tokenChip: {
      backgroundColor: `${FEED_COLORS.token}26`, // 15% opacity
    },
    earnedValue: {
      fontSize: 11,
      fontFamily: 'Space Mono',
      fontWeight: '700',
      color: '#f0f0f5',
    },
    earnedLabel: {
      fontSize: 9,
      fontFamily: 'DM Sans',
      fontWeight: '500',
      color: '#8a8a9a',
    },
    ratingIcon: {
      marginLeft: 'auto',
    },
  });

  return (
    <View style={styles.container}>
      {/* Top section with category stripe and title */}
      <View style={styles.topSection}>
        <View style={styles.categoryStripe} />
        <View style={styles.titleContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
      </View>

      {/* Bottom section with earned values and rating icon */}
      <View style={styles.bottomSection}>
        <View style={styles.earnedContainer}>
          {/* XP Earned */}
          <View style={[styles.earnedChip, styles.xpChip]}>
            <Text style={[styles.earnedValue, { color: FEED_COLORS.xp }]}>
              {xpEarned}
            </Text>
            <Text style={styles.earnedLabel}>XP</Text>
          </View>

          {/* Token Earned */}
          <View style={[styles.earnedChip, styles.tokenChip]}>
            <Text style={[styles.earnedValue, { color: FEED_COLORS.token }]}>
              {tokenEarned}
            </Text>
            <Text style={styles.earnedLabel}>TK</Text>
          </View>
        </View>

        {/* Rating Icon */}
        <View style={styles.ratingIcon}>
          <RatingReceivedIcon icon="thumbs-up" size={20} color={FEED_COLORS.favor} />
        </View>
      </View>
    </View>
  );
};

export default QuestHistoryCard;
