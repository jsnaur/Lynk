import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
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
        return COLORS.favor;
      case 'Study':
        return COLORS.study;
      case 'Item':
        return COLORS.item;
    }
  };

  const styles = StyleSheet.create({
    container: {
      width: 342,
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginVertical: 6,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    topSection: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    categoryStripe: {
      width: 4,
      backgroundColor: getCategoryColor(),
    },
    titleContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontFamily: FONTS.body,
      fontWeight: '600',
      color: COLORS.textPrimary,
      marginBottom: 4,
    },
    role: {
      fontSize: 12,
      fontFamily: FONTS.body,
      fontWeight: '400',
      color: COLORS.textSecondary,
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
    },
    xpChip: {
      backgroundColor: withOpacity(COLORS.xp, 0.15),
    },
    tokenChip: {
      backgroundColor: withOpacity(COLORS.token, 0.15),
    },
    earnedValue: {
      fontSize: 12,
      fontFamily: FONTS.mono,
      fontWeight: '700',
    },
    earnedLabel: {
      fontSize: 10,
      fontFamily: FONTS.body,
      fontWeight: '600',
      color: COLORS.textSecondary,
    },
    ratingIcon: {
      marginLeft: 'auto',
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
            <Text style={[styles.earnedValue, { color: COLORS.xp }]}>
              {xpEarned}
            </Text>
            <Text style={styles.earnedLabel}>XP</Text>
          </View>

          {/* Token Earned */}
          <View style={[styles.earnedChip, styles.tokenChip]}>
            <Text style={[styles.earnedValue, { color: COLORS.token }]}>
              {tokenEarned}
            </Text>
            <Text style={styles.earnedLabel}>TK</Text>
          </View>
        </View>

        {/* Rating Icon */}
        <View style={styles.ratingIcon}>
          <RatingReceivedIcon type="Positive" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default QuestHistoryCard;