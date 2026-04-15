import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView, 
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icons
import BackIcon from '../../../assets/QuestDetailsAssets/Back_Icon.svg';
import ShareIcon from '../../../assets/QuestDetailsAssets/Share_Icon.svg';
import LocationIcon from '../../../assets/QuestDetailsAssets/Location_Icon.svg';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';

// Avatar SVGs
import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";

import CompactQuestCard from '../../components/cards/CompactQuestCard';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { FEED_COLORS } from '../../constants/colors';
import { FEED_CATEGORY_BG } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

// Map the avatars to an array so we can select them by index
const avatarAssets = [
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
  Avatar5,
  Avatar6
];

type QuestDetailParams = {
  quest?: FeedQuest & { id?: string; user_id?: string; description?: string; bonus_xp?: number; token_bounty?: number; accepted_by?: string };
};

type QuestDetailsProps = {
  navigation?: any;
  route?: { params?: QuestDetailParams };
};

type UIComment = {
  id: string;
  userId: string;
  author: string;
  text: string;
  time: string;
  avatarIndex?: number | null; // Changed to track the index instead of a URL
};

type ProfilePreview = {
  id: string;
  displayName: string;
  avatarIndex?: number | null;
  major?: string | null;
  graduationYear?: string | null;
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
  const [cardExpanded, setCardExpanded] = useState(false);
  
  const [comments, setComments] = useState<UIComment[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  
  const [questData, setQuestData] = useState<any>(quest);
  const [loading, setLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState<UIComment | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfilePreview | null>(null);

  useEffect(() => {
    let mounted = true;
    let commentSubscription: any = null;

    const fetchUserAndQuestAndComments = async () => {
      // 1. Get current user
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

        // 2. Fetch Comments AND Join the Profiles table (fetching avatar_index)
        const { data: cData, error: cError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles (
              display_name,
              avatar_index
            )
          `)
          .eq('quest_id', quest.id)
          .order('created_at', { ascending: true }); 

        if (mounted && cData && !cError) {
          const formattedComments = cData.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            author: c.user_id === user?.id ? 'You' : (c.profiles?.display_name || 'Unknown User'),
            text: c.content,
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarIndex: c.profiles?.avatar_index, // Store the index here
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

                // Fetch new comment's author profile (fetching avatar_index)
                supabase
                  .from('profiles')
                  .select('display_name, avatar_index')
                  .eq('id', newC.user_id)
                  .single()
                  .then(({ data: profileData }) => {
                    if (mounted) {
                      const newFormattedComment = {
                        id: newC.id,
                        userId: newC.user_id,
                        author: profileData?.display_name || `User ${newC.user_id.substring(0, 4)}`,
                        text: newC.content,
                        time: new Date(newC.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        avatarIndex: profileData?.avatar_index, // Store the index here
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

  const isQuestAccepted = questData?.status === 'accepted' || questData?.status === 'in_progress';
  const shouldShowCompactCard = isQuestAccepted;

  const onSubmitComment = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !questData?.id) return;

    setMessage('');
    const tempCommentId = `temp-${Date.now()}`;
    
    // Add local comment instantly with current user's index
    const newLocalComment: UIComment = {
      id: tempCommentId,
      userId: currentUserId,
      author: currentUserProfile?.display_name || 'You', 
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarIndex: currentUserProfile?.avatar_index, 
    };

    setComments((prev) => [...prev, newLocalComment]);

    const { error } = await supabase.from('comments').insert([{ quest_id: questData.id, user_id: currentUserId, content: trimmed }]);
    if (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
      setComments((prev) => prev.filter(c => c.id !== tempCommentId));
      console.error('Comment error:', error);
    }
  };

  const openCommentActions = (comment: UIComment) => {
    setSelectedComment(comment);
    setActionsVisible(true);
  };

  const closeCommentActions = () => {
    setActionsVisible(false);
  };

  const closeProfilePreview = () => {
    setProfilePreviewVisible(false);
  };

  const onViewProfile = async () => {
    if (!selectedComment?.userId) return;

    // Open with immediate fallback data so the modal still works
    // even if optional profile fields are unavailable.
    setSelectedProfile({
      id: selectedComment.userId,
      displayName: selectedComment.author === 'You'
        ? (currentUserProfile?.display_name || 'You')
        : selectedComment.author,
      avatarIndex: selectedComment.avatarIndex,
      major: currentUserProfile?.major || null,
      graduationYear: currentUserProfile?.graduation_year || null,
    });
    setActionsVisible(false);
    setProfilePreviewVisible(true);

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_index, major, graduation_year')
      .eq('id', selectedComment.userId)
      .maybeSingle();

    if (error || !profileData) {
      return;
    }

    setSelectedProfile({
      id: profileData.id,
      displayName: profileData.display_name || 'Anonymous',
      avatarIndex: profileData.avatar_index,
      major: profileData.major,
      graduationYear: profileData.graduation_year,
    });
  };

  const SelectedProfileAvatar = selectedProfile
    && selectedProfile.avatarIndex !== undefined
    && selectedProfile.avatarIndex !== null
    && avatarAssets[selectedProfile.avatarIndex]
    ? avatarAssets[selectedProfile.avatarIndex]
    : avatarAssets[0];

  const profileSubtitle = selectedProfile
    ? `${selectedProfile.major || 'Undeclared'}${selectedProfile.graduationYear ? ` · Class of '${selectedProfile.graduationYear.slice(-2)}` : ''}`
    : '';

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
          
          {/* MAIN QUEST CARD */}
          {shouldShowCompactCard ? (
            <CompactQuestCard
              quest={questData || quest}
              isExpanded={cardExpanded}
              onToggle={() => setCardExpanded(!cardExpanded)}
              statusLabel={statusText}
            />
          ) : (
            <View style={styles.card}>
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

          {/* ACCEPT BUTTON */}
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
          {comments.map((comment) => {
            // Determine which SVG to render
            const CommentAvatar = (comment.avatarIndex !== undefined && comment.avatarIndex !== null && avatarAssets[comment.avatarIndex]) 
              ? avatarAssets[comment.avatarIndex] 
              : avatarAssets[0];

            return (
              <View key={comment.id} style={styles.commentRow}>
                
                {/* Render the local SVG avatar scaled down for the comments */}
                <Pressable style={styles.commentAvatarWrap} onPress={() => openCommentActions(comment)} hitSlop={8}>
                  <CommentAvatar width={28} height={28} />
                </Pressable>
                
                <View style={styles.commentContent}>
                  <View style={styles.rowBetween}>
                    <Pressable onPress={() => openCommentActions(comment)} hitSlop={8}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                    </Pressable>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            );
          })}
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

        <Modal
          visible={actionsVisible}
          animationType="fade"
          transparent
          onRequestClose={closeCommentActions}
        >
          <Pressable style={styles.actionBackdrop} onPress={closeCommentActions}>
            <Pressable style={styles.actionBubble} onPress={() => {}}>
              <Pressable style={styles.actionRow} onPress={onViewProfile}>
                <Ionicons name="person-circle-outline" size={18} color={FEED_COLORS.favor} />
                <Text style={styles.actionText}>View Profile</Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <View style={styles.actionRowDisabled}>
                <Ionicons name="flag-outline" size={18} color={FEED_COLORS.textSecondary} />
                <Text style={styles.actionTextDisabled}>Report (Soon)</Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={profilePreviewVisible}
          animationType="slide"
          transparent
          onRequestClose={closeProfilePreview}
        >
          <Pressable style={styles.previewBackdrop} onPress={closeProfilePreview}>
            <Pressable style={styles.previewCard} onPress={() => {}}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Profile</Text>
                <Pressable onPress={closeProfilePreview} hitSlop={10}>
                  <Ionicons name="close" size={20} color={FEED_COLORS.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.previewIdentityRow}>
                <View style={styles.previewAvatarFrame}>
                  <SelectedProfileAvatar width={68} height={68} />
                </View>
                <View style={styles.previewIdentityText}>
                  <Text style={styles.previewName}>{selectedProfile?.displayName || 'Anonymous'}</Text>
                  <Text style={styles.previewSubtitle}>{profileSubtitle}</Text>
                  <Text style={styles.previewBio}>
                    {'Profile details coming soon.'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

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
  commentAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: FEED_COLORS.surface2 || '#ececec', // Fallback background behind the SVG
    alignItems: 'center',
    justifyContent: 'center',
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
  actionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  actionBubble: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface,
    overflow: 'hidden',
  },
  actionRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  actionRowDisabled: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  actionText: {
    color: FEED_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextDisabled: {
    color: FEED_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    backgroundColor: FEED_COLORS.border,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.bg,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: FEED_COLORS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    color: FEED_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  previewIdentityRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  previewAvatarFrame: {
    width: 84,
    height: 84,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FEED_COLORS.border,
    backgroundColor: FEED_COLORS.surface2 || FEED_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewIdentityText: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  previewName: {
    color: FEED_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: FEED_COLORS.textSecondary,
    fontSize: 13,
  },
  previewBio: {
    color: FEED_COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});