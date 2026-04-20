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

import CompactQuestCard from '../../components/cards/CompactQuestCard';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
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
  userId: string;
  author: string;
  text: string;
  time: string;
  accessories?: Partial<Record<AvatarSlot, string>>;
};

type ProfilePreview = {
  id: string;
  displayName: string;
  accessories?: Partial<Record<AvatarSlot, string>>;
  major?: string | null;
  graduationYear?: string | null;
  bio?: string | null; // Added bio type
};

const CATEGORY_COLORS: Record<FeedCategory, string> = {
  favor: COLORS.favor,
  study: COLORS.study,
  item: COLORS.item,
};

const DEFAULT_AVATAR_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
  Body: 'body-masc-a',
  HairBase: 'hairb-flat-m',
  HairFringe: 'hairf-chill-m',
  Eyes: 'eyes-default',
  Mouth: 'mouth-neutral',
  Top: 'top-cit-m',
  Bottom: 'bot-cit-m',
};

function getAccessoryById(accessoryId?: string | null) {
  if (!accessoryId) return undefined;
  return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

function normalizeAccessories(value: unknown): Partial<Record<AvatarSlot, string>> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Partial<Record<AvatarSlot, string>>;
  }
  return DEFAULT_AVATAR_ACCESSORIES;
}

function formatRelativeTime(dateValue: string | number | Date) {
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

type LayeredAvatarProps = {
  accessories?: Partial<Record<AvatarSlot, string>>;
  size: number;
  scale?: number;
  translateY?: number;
};

function LayeredAvatar({ accessories, size, scale = 1.35, translateY = 2 }: LayeredAvatarProps) {
  const safeAccessories = normalizeAccessories(accessories);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: COLORS.surface2,
      }}
    >
      {ALL_SLOTS_Z_ORDER.map((slot) => {
        const accId = safeAccessories[slot];
        if (!accId) return null;
        const item = getAccessoryById(accId);
        if (!item) return null;
        const Sprite = item.Sprite;
        return (
          <View
            key={slot}
            pointerEvents="none"
            style={{ ...StyleSheet.absoluteFillObject, transform: [{ scale }, { translateY }] }}
          >
            <Sprite width="100%" height="100%" />
          </View>
        );
      })}
    </View>
  );
}

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

        // 2. Fetch Comments AND Join the Profiles table
        const { data: cData, error: cError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles (
              display_name,
              equipped_accessories
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
            time: formatRelativeTime(c.created_at),
            accessories: normalizeAccessories(c.profiles?.equipped_accessories),
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

                // Fetch new comment's author profile
                supabase
                  .from('profiles')
                  .select('display_name, equipped_accessories')
                  .eq('id', newC.user_id)
                  .single()
                  .then(({ data: profileData }) => {
                    if (mounted) {
                      const newFormattedComment = {
                        id: newC.id,
                        userId: newC.user_id,
                        author: profileData?.display_name || `User ${newC.user_id.substring(0, 4)}`,
                        text: newC.content,
                        time: formatRelativeTime(newC.created_at),
                        accessories: normalizeAccessories(profileData?.equipped_accessories),
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
      time: 'Just now',
      accessories: normalizeAccessories(currentUserProfile?.equipped_accessories),
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

    // Open with immediate fallback data (now including bio)
    setSelectedProfile({
      id: selectedComment.userId,
      displayName: selectedComment.author === 'You'
        ? (currentUserProfile?.display_name || 'You')
        : selectedComment.author,
      accessories: selectedComment.accessories,
      major: currentUserProfile?.major || null,
      graduationYear: currentUserProfile?.graduation_year || null,
      bio: currentUserProfile?.bio || null, // Fallback bio added
    });
    setActionsVisible(false);
    setProfilePreviewVisible(true);

    // Fetch the updated profile data including the bio
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_accessories, major, graduation_year, bio') // Added bio to the query
      .eq('id', selectedComment.userId)
      .maybeSingle();

    if (error || !profileData) {
      return;
    }

    setSelectedProfile({
      id: profileData.id,
      displayName: profileData.display_name || 'Anonymous',
      accessories: normalizeAccessories(profileData.equipped_accessories),
      major: profileData.major,
      graduationYear: profileData.graduation_year,
      bio: profileData.bio, // Set the fetched bio here
    });
  };

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
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? COLORS.heart : COLORS.textSecondary} />
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
                <View style={[styles.acceptButton, { backgroundColor: COLORS.textSecondary }]}><Text style={styles.acceptText}>Your Quest</Text></View>
              ) : isTakenBySomeoneElse ? (
                <View style={[styles.acceptButton, { backgroundColor: COLORS.textSecondary }]}><Text style={styles.acceptText}>Already Accepted</Text></View>
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
            return (
              <View key={comment.id} style={styles.commentRow}>
                
                <Pressable style={styles.commentAvatarWrap} onPress={() => openCommentActions(comment)} hitSlop={8}>
                  <LayeredAvatar accessories={comment.accessories} size={28} scale={1.4} translateY={2} />
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
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
          />
          <Pressable style={styles.sendButton} onPress={onSubmitComment}>
            <Ionicons name="send" size={16} color={COLORS.bg} />
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
                <Ionicons name="person-circle-outline" size={18} color={COLORS.favor} />
                <Text style={styles.actionText}>View Profile</Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <View style={styles.actionRowDisabled}>
                <Ionicons name="flag-outline" size={18} color={COLORS.textSecondary} />
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
                  <Ionicons name="close" size={20} color={COLORS.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.previewIdentityRow}>
                <View style={styles.previewAvatarFrame}>
                  <LayeredAvatar accessories={selectedProfile?.accessories} size={68} scale={1.55} translateY={4} />
                </View>
                <View style={styles.previewIdentityText}>
                  <Text style={styles.previewName}>{selectedProfile?.displayName || 'Anonymous'}</Text>
                  <Text style={styles.previewSubtitle}>{profileSubtitle}</Text>
                  {/* Updated Bio render here! */}
                  <Text style={styles.previewBio}>
                    {selectedProfile?.bio || 'Tell your campus a little about yourself...'}
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
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.favor,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.textPrimary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    backgroundColor: withOpacity(COLORS.item, 0.15),
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: COLORS.item,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  preview: {
    color: COLORS.textSecondary,
    lineHeight: 21,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poster: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  rewardBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.border,
  },
  rewardValue: {
    color: COLORS.xp,
    fontSize: 20,
    fontWeight: '700',
  },
  tokenValue: {
    color: COLORS.token,
  },
  rewardLabel: {
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.favor,
  },
  acceptText: {
    color: COLORS.bg,
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
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  countChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  commentRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
  },
  commentAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2 || '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  commentText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.favor,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextDisabled: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    color: COLORS.textPrimary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2 || COLORS.surface,
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
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  previewBio: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});