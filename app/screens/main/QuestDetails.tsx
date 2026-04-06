import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackIcon from '../../../assets/QuestDetailsAssets/Back_Icon.svg';
import ShareIcon from '../../../assets/QuestDetailsAssets/Share_Icon.svg';
import LocationIcon from '../../../assets/QuestDetailsAssets/Location_Icon.svg';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';
import { FeedCategory, FeedQuest } from '../../constants/categories';

type QuestDetailParams = {
  quest?: FeedQuest;
};

type QuestDetailsProps = {
  navigation?: any;
  route?: { params?: QuestDetailParams };
};

const CATEGORY_COLORS: Record<FeedCategory, string> = {
  favor: '#00f5ff',
  study: '#00ff90',
  item: '#ffa640',
};

const DEFAULT_COMMENTS = [
  { id: 'c1', author: 'Reyna', text: 'I can help with this after class.', time: '13:52' },
  { id: 'c2', author: 'Yoru', text: 'Can meet near library entrance.', time: '13:56' },
  { id: 'c3', author: 'Clove', text: 'Count me in if still open.', time: '14:25' },
];

export default function QuestDetails({ navigation, route }: QuestDetailsProps) {
  const quest = route?.params?.quest;
  const [accepted, setAccepted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState(DEFAULT_COMMENTS);

  const category = quest?.category ?? 'favor';
  const categoryColor = CATEGORY_COLORS[category];

  const statusText = accepted ? 'Accepted' : 'Open';
  const actionText = accepted ? 'Cancel Quest' : 'Accept Quest';

  const title = quest?.title ?? 'Need help around campus today';
  const preview =
    quest?.preview ??
    'Looking for someone nearby to help with a quick request before 5PM.';
  const posterName = quest?.posterName ?? 'Mark Lawrence';
  const ago = quest?.ago ?? '23m ago';
  const xp = quest?.xp ?? 150;
  const token = quest?.token ?? 25;

  const commentCount = useMemo(() => comments.length, [comments]);

  const onSubmitComment = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setComments((previous) => [
      ...previous,
      { id: `local-${Date.now()}`, author: 'You', text: trimmed, time: 'now' },
    ]);
    setMessage('');
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation?.goBack?.()}>
            <BackIcon width={18} height={18} />
            <Text style={styles.backText}>Feed</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Quest Details</Text>

          <Pressable style={styles.iconButton} onPress={() => setLiked((current) => !current)}>
            <ShareIcon width={22} height={22} />
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#ff5b8a' : '#8a8a9a'}
            />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}26` }]}>
                <View style={[styles.dot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {category.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.preview}>{preview}</Text>

            <View style={styles.metaRow}>
              <View>
                <Text style={styles.poster}>{posterName}</Text>
                <Text style={styles.time}>{ago}</Text>
              </View>
              <View style={styles.locationChip}>
                <LocationIcon width={14} height={14} />
                <Text style={styles.locationText}>GLE Building, Room 605</Text>
              </View>
            </View>

            <View style={styles.rewardBox}>
              <View style={styles.rewardBlock}>
                <XpPixelIcon width={48} height={48} />
                <Text style={styles.rewardValue}>{xp}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rewardBlock}>
                <TokenPixelIcon width={48} height={48} />
                <Text style={[styles.rewardValue, styles.tokenValue]}>{token}</Text>
                <Text style={styles.rewardLabel}>Tokens</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.acceptButton} onPress={() => setAccepted((current) => !current)}>
            <Text style={styles.acceptText}>{actionText}</Text>
          </Pressable>

          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <View style={styles.countChip}>
              <Text style={styles.countText}>{commentCount}</Text>
            </View>
          </View>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Ionicons name="person-circle-outline" size={28} color="#8a8a9a" />
              <View style={styles.commentContent}>
                <View style={styles.rowBetween}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentTime}>{comment.time}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Add a comment..."
            placeholderTextColor="#777789"
            style={styles.input}
          />
          <Pressable style={styles.sendButton} onPress={onSubmitComment}>
            <Ionicons name="send" size={16} color="#1a1a1f" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    backgroundColor: '#1a1a1f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#30303a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  backText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#f0f0f5',
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#343444',
    backgroundColor: '#24242d',
    padding: 14,
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(57,255,20,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#39ff14',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#f0f0f5',
    fontSize: 21,
    fontWeight: '700',
  },
  preview: {
    color: '#9a9aab',
    lineHeight: 21,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poster: {
    color: '#f0f0f5',
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: '#8a8a9a',
    fontSize: 11,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: '#9a9aab',
    fontSize: 11,
  },
  rewardBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#343444',
    backgroundColor: '#2d2d37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rewardBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 72,
    backgroundColor: '#4a4a5c',
  },
  rewardValue: {
    color: '#c084fc',
    fontSize: 20,
    fontWeight: '700',
  },
  tokenValue: {
    color: '#ffd700',
  },
  rewardLabel: {
    color: '#8a8a9a',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  acceptButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00f5ff',
  },
  acceptText: {
    color: '#121218',
    fontSize: 15,
    fontWeight: '700',
  },
  commentsHeader: {
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsTitle: {
    color: '#f0f0f5',
    fontSize: 15,
    fontWeight: '700',
  },
  countChip: {
    backgroundColor: '#2e2e38',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countText: {
    color: '#8a8a9a',
    fontSize: 12,
    fontWeight: '600',
  },
  commentRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30303a',
    backgroundColor: '#23232c',
    padding: 10,
    gap: 10,
    flexDirection: 'row',
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    color: '#f0f0f5',
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    color: '#8a8a9a',
    fontSize: 11,
  },
  commentText: {
    color: '#9a9aab',
    fontSize: 13,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: '#30303a',
    backgroundColor: '#1a1a1f',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#3a3a48',
    backgroundColor: '#2c2c36',
    paddingHorizontal: 14,
    color: '#f0f0f5',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
                    										