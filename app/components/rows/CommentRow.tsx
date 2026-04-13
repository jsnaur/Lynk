import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type CommentRowProps = {
  avatarUrl?: string;
  commenterName?: string;
  timestamp?: string;
  commentText?: string;
};

export default function CommentRow({
  avatarUrl,
  commenterName = 'User Name',
  timestamp = '2h ago',
  commentText = 'Great post! This is really helpful.',
}: CommentRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{commenterName}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Text style={styles.commentText} numberOfLines={3}>
          {commentText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#26262e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a48',
    padding: 12,
    gap: 10,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a48',
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#f0f0f5',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
  timestamp: {
    color: '#8a8a9a',
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
  },
  commentText: {
    color: '#8a8a9a',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'DM_Sans-Regular',
    lineHeight: 18,
  },
});
