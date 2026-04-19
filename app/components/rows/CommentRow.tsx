import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface CommentRowProps {
  authorName: string;
  timestamp: string;
  content: string;
}

export default function CommentRow({ authorName, timestamp, content }: CommentRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder} />
      
      <View style={styles.contentWrap}>
        <View style={styles.header}>
          <Text style={styles.author}>{authorName}</Text>
          <Text style={styles.time}>{timestamp}</Text>
        </View>
        <Text style={styles.content}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  content: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
});