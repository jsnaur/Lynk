import React, { useMemo, useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView, 
  Platform,
  Image, // <-- Make sure to import Image if you want to use avatar_url later!
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackIcon from '../../../assets/QuestDetailsAssets/Back_Icon.svg';
import ShareIcon from '../../../assets/QuestDetailsAssets/Share_Icon.svg';
import LocationIcon from '../../../assets/QuestDetailsAssets/Location_Icon.svg';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';
import CompactQuestCard from '../../components/cards/CompactQuestCard';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { FEED_COLORS } from '../../constants/colors';
import { FEED_CATEGORY_BG } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

type QuestDetailParams = {
  quest?: FeedQuest & { id?: string; user_id?: string; description?: string; bonus_xp?: number; token_bounty?: number; accepted_by?: string };
};

type QuestDetailsProps = {
  navigation?: any;
  route?: { params?: QuestDetailParams };
};

type UIComment = {
  id: string;
  author: string;
  text: string;
  time: string;
  avatarUrl?: string | null; // <-- Added to hold the profile picture
};

const CATEGORY_COLORS: Record<FeedCategory, string> = {
  favor: FEED_COLORS.favor,
  study: FEED_COLORS.study,
  item: FEED_COLORS.item,
};

export default function QuestDetails({ navigation, route }: QuestDetailsProps) {
  const quest = route?.params?.quest;
  
  const [accepted, setAccepted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [cardExpanded, setCardExpanded] = useState(false); // <-- Track compact card expansion
  
  const [comments, setComments] = useState<UIComment[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null); // <-- Added to store YOUR profile data
  
  const [questData, setQuestData] = useState<any>(quest);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let commentSubscription: any = null;

    const fetchUserAndQuestAndComments = async () => {
      // 1. Get current authenticated user AND their Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted && user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (mounted && profile) setCurrentUserProfile(profile);
      }

      if (quest?.id) {
        const { data: qData, error: qError } = await supabase
          .from('quests')
          .select('*')
          .eq('id', quest.id)
          .single();

        if (mounted && qData && !qError) {
          setQuestData(qData);
          if (qData.status === 'accepted' && qData.accepted_by === user?.id) {
            setAccepted(true);
          }
        }

        // 2. Fetch Comments AND Join the Profiles table
        const { data: cData, error: cError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .eq('quest_id', quest.id)
          .order('created_at', { ascending: true }); 

        if (mounted && cData && !cError) {
          const formattedComments = cData.map((c: any) => ({
            id: c.id,
            // Use the joined profile data!
            author: c.user_id === user?.id ? 'You' : (c.profiles?.display_name || 'Unknown User'),
            text: c.content,
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarUrl: c.profiles?.avatar_url,
          }));
          setComments(formattedComments);
        }

        // 3. Setup Realtime Subscription
        commentSubscription = supabase
          .channel(`public:comments:quest_id=eq.${quest.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments', filter: `quest_id=eq.${quest.id}` },
            (payload) => {
              if (mounted) {
                const newC = payload.new;
                if (newC.user_id === user?.id) return; 

                // We only get the user_id from realtime, so we must quickly fetch their profile
                supabase
                  .from('profiles')
                  .select('display_name, avatar_url')
                  .eq('id', newC.user_id)
                  .single()
                  .then(({ data: profileData }) => {
                    if (mounted) {
                      const newFormattedComment = {
                        id: newC.id,
                        author: profileData?.display_name || `User ${newC.user_id.substring(0, 4)}`,
                        text: newC.content,
                        time: new Date(newC.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        avatarUrl: profileData?.avatar_url,
                      };
                      setComments((prev) => [...prev, newFormattedComment]);
                    }
                  });
              }
            }
          )
          .subscribe();
      }
    };

    fetchUserAndQuestAndComments();

    return () => {
      mounted = false;
      if (commentSubscription) supabase.removeChannel(commentSubscription);
    };
  }, [quest?.id]);

  const toggleAccept = async () => {
    if (!currentUserId || !questData?.id) return;
    if (questData.user_id === currentUserId) {
      Alert.alert("Cannot Accept", "You cannot accept your own quest.");
      return;
    }
    try {
      setLoading(true);
      const isCurrentlyAcceptedByMe = accepted;
      const newStatus = isCurrentlyAcceptedByMe ? 'open' : 'accepted';
      const newAcceptedBy = isCurrentlyAcceptedByMe ? null : currentUserId;

      const { error } = await supabase.from('quests').update({ status: newStatus, accepted_by: newAcceptedBy }).eq('id', questData.id);
      if (error) throw error;

      setAccepted(!isCurrentlyAcceptedByMe);
      setQuestData({ ...questData, status: newStatus, accepted_by: newAcceptedBy });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update quest.");
    } finally {
      setLoading(false);
    }
  };

  const category = (questData?.category ?? quest?.category ?? 'favor') as FeedCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const title = questData?.title ?? quest?.title ?? 'Need help around campus today';
  const preview = questData?.description ?? quest?.preview ?? 'Looking for someone nearby to help with a quick request before 5PM.';
  const posterName = quest?.posterName ?? 'Mark Lawrence';
  const ago = quest?.ago ?? '23m ago';
  const xp = questData?.bonus_xp ?? quest?.xp ?? 150;
  const token = questData?.token_bounty ?? quest?.token ?? 25;
  const isPoster = currentUserId === questData?.user_id;
  const isTakenBySomeoneElse = questData?.status === 'accepted' && questData?.accepted_by !== currentUserId;
  const statusText = questData?.status === 'accepted' ? 'Accepted' : 'Open';
  const actionText = accepted ? 'Cancel Quest' : 'Accept Quest';
  const commentCount = useMemo(() => comments.length, [comments]);

  // Determine if we should show compact card (quest in progress/pending resolution)
  const isQuestAccepted = questData?.status === 'accepted' || questData?.status === 'in_progress';
  const shouldShowCompactCard = isQuestAccepted;

  const onSubmitComment = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !questData?.id) return;

    setMessage('');
    const tempCommentId = `temp-${Date.now()}`;
    
    // Use your own profile data for the instant UI update!
    const newLocalComment: UIComment = {
      id: tempCommentId,
      author: currentUserProfile?.display_name || 'You', 
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarUrl: currentUserProfile?.avatar_url,
    };

    setComments((prev) => [...prev, newLocalComment]);

    const { error } = await supabase.from('comments').insert([{ quest_id: questData.id, user_id: currentUserId, content: trimmed }]);
    if (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
      setComments((prev) => prev.filter(c => c.id !== tempCommentId));
      console.error('Comment error:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.modalBackdrop}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.sheet}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation?.goBack?.()}>
            <BackIcon width={18} height={18} />
            <Text style={styles.backText}>Feed</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Quest Details</Text>
          <Pressable style={styles.iconButton} onPress={() => setLiked((current) => !current)}>
            <ShareIcon width={22} height={22} />
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? FEED_COLORS.heart : FEED_COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* MAIN QUEST CARD - Compact or Full Version */}
          {shouldShowCompactCard ? (
            <CompactQuestCard
              quest={questData || quest}
              isExpanded={cardExpanded}
              onToggle={() => setCardExpanded(!cardExpanded)}
              statusLabel={statusText}
            />
          ) : (
            <View style={styles.card}>
              {/* ... Your Quest Card Content ... */}
              <View style={styles.rowBetween}>
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}26` }]}>
                  <View style={[styles.dot, { backgroundColor: categoryColor }]} />
                  <Text style={[styles.categoryText, { color: categoryColor }]}>{category.toUpperCase()}</Text>
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
          )}

          {/* ACCEPT BUTTON - Only for Open Quests */}
          {!shouldShowCompactCard && (
            <>
              {isPoster ? (
                <View style={[styles.acceptButton, { backgroundColor: FEED_COLORS.textSecondary }]}><Text style={styles.acceptText}>Your Quest</Text></View>
              ) : isTakenBySomeoneElse ? (
                <View style={[styles.acceptButton, { backgroundColor: FEED_COLORS.textSecondary }]}><Text style={styles.acceptText}>Already Accepted</Text></View>
              ) : (
                <Pressable style={[styles.acceptButton, loading && { opacity: 0.7 }]} onPress={toggleAccept} disabled={loading}>
                  <Text style={styles.acceptText}>{actionText}</Text>
                </Pressable>
              )}
            </>
          )}

          {/* COMMENTS HEADER */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <View style={styles.countChip}>
              <Text style={styles.countText}>{commentCount}</Text>
            </View>
          </View>

          {/* COMMENTS LIST */}
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              
              {/* Profile Picture Logic */}
              {comment.avatarUrl ? (
                <Image 
                  source={{ uri: comment.avatarUrl }} 
                  style={{ width: 28, height: 28, borderRadius: 14 }} 
                />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color={FEED_COLORS.textSecondary} />
              )}
              
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

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Add a comment..."
            placeholderTextColor={FEED_COLORS.textSecondary}
            style={styles.input}
          />
          <Pressable style={styles.sendButton} onPress={onSubmitComment}>
            <Ionicons name="send" size={16} color={FEED_COLORS.bg} />
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: FEED_COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
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
    color: FEED_COLORS.favor,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: FEED_COLORS.textPrimary,
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
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
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
    backgroundColor: FEED_CATEGORY_BG.item,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: FEED_COLORS.item,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: FEED_COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  preview: {
    color: FEED_COLORS.textSecondary,
    lineHeight: 21,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poster: {
    color: FEED_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: FEED_COLORS.textSecondary,
    fontSize: 11,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: FEED_COLORS.textSecondary,
    fontSize: 11,
  },
  rewardBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
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
    backgroundColor: FEED_COLORS.border,
  },
  rewardValue: {
    color: FEED_COLORS.xp,
    fontSize: 20,
    fontWeight: '700',
  },
  tokenValue: {
    color: FEED_COLORS.token,
  },
  rewardLabel: {
    color: FEED_COLORS.textSecondary,
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
    backgroundColor: FEED_COLORS.favor,
  },
  acceptText: {
    color: FEED_COLORS.bg,
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
    color: FEED_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  countChip: {
    backgroundColor: FEED_COLORS.surface,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countText: {
    color: FEED_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  commentRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    color: FEED_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    color: FEED_COLORS.textSecondary,
    fontSize: 11,
  },
  commentText: {
    color: FEED_COLORS.textSecondary,
    fontSize: 13,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
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
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    paddingHorizontal: 14,
    color: FEED_COLORS.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: FEED_COLORS.favor,
    alignItems: 'center',
    justifyContent: 'center',
  },
});