import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface ActiveQuestRowProps {
  title: string;
  category: FeedCategory;
  timeLeft?: string;
  onPress?: () => void;
}

export default function ActiveQuestRow({ title, category, timeLeft, onPress }: ActiveQuestRowProps) {
  const getCategoryColor = () => {
    switch (category) {
      case 'favor': return COLORS.favor;
      case 'study': return COLORS.study;
      case 'item': return COLORS.item;
      default: return COLORS.favor;
    }
  };

  const color = getCategoryColor();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: withOpacity(color, 0.15) }]}>
        <MaterialCommunityIcons 
          name={category === 'study' ? 'book-open-variant' : category === 'item' ? 'gift' : 'heart'} 
          size={20} 
          color={color} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {timeLeft && (
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.warning} />
            <Text style={styles.timeText}>{timeLeft}</Text>
          </View>
        )}
      </View>
      
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.warning,
    fontFamily: FONTS.body,
  },
});