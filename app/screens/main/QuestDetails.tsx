import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icons
import BackIcon from '../../../assets/QuestDetailsAssets/Back_Icon.svg';
// Share icon removed (header simplified)
import LocationIcon from '../../../assets/QuestDetailsAssets/Location_Icon.svg';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';

import CompactQuestCard from '../../components/cards/CompactQuestCard';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { supabase } from '../../lib/supabase';

type QuestDetailParams = {
  quest?: FeedQuest & { 
    id?: string; 
    user_id?: string; 
    description?: string; 
    bonus_xp?: number; 
    token_bounty?: number; 
    accepted_by?: string;
    is_auto_accept?: boolean;
    max_participants?: number;
    status?: string;
  };
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
  visibility?: string;
};

type ProfilePreview = {
  id: string;
  displayName: string;
  accessories?: Partial<Record<AvatarSlot, string>>;
  major?: string | null;
  graduationYear?: string | null;
  bio?: string | null;
};

const SWIPE_REPLY_MAX = 86;
const SWIPE_REPLY_TRIGGER = 56;

function SwipeReplyCommentRow({
  comment,
  onReply,
  onOpenActions,
  parse,
}: {
  comment: UIComment;
  onReply: (comment: UIComment) => void;
  onOpenActions: (comment: UIComment) => void;
  parse: (text: string) => { repliedToName: string; replyPreview: string; body: string };
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const revealed = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 10,
        onPanResponderMove: (_evt, gesture) => {
          const clamped = Math.max(0, Math.min(SWIPE_REPLY_MAX, gesture.dx));
          translateX.setValue(clamped);
          revealed.current = clamped > 12;
        },
        onPanResponderRelease: (_evt, gesture) => {
          const shouldTrigger = gesture.dx > SWIPE_REPLY_TRIGGER;
          if (shouldTrigger) {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              speed: 18,
              bounciness: 0,
            }).start();
            onReply(comment);
            return;
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 0,
          }).start();
        },
      }),
    [comment, onReply, translateX],
  );

  const actionOpacity = translateX.interpolate({
    inputRange: [0, 12, SWIPE_REPLY_MAX],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  const actionScale = translateX.interpolate({
    inputRange: [0, 12, SWIPE_REPLY_MAX],
    outputRange: [0.98, 1, 1.02],
    extrapolate: 'clamp',
  });

  const parsed = parse(comment.text);

  return (
    <View style={styles.swipeRowWrap}>
      <View style={styles.replyUnderlay}>
        <Animated.View style={[styles.replyUnderlayPill, { opacity: actionOpacity, transform: [{ scale: actionScale }] }]}>
          <Ionicons name="return-down-forward" size={16} color={COLORS.bg} />
          <Text style={styles.replyUnderlayText}>Reply</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.commentRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable style={styles.commentAvatarWrap} onPress={() => onOpenActions(comment)} hitSlop={8}>
          <LayeredAvatar accessories={comment.accessories} size={28} scale={1.4} translateY={2} />
        </Pressable>

        <View style={styles.commentContent}>
          <View style={styles.rowBetween}>
            <Pressable onPress={() => onOpenActions(comment)} hitSlop={8}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
            </Pressable>
            <Text style={styles.commentTime}>{comment.time}</Text>
          </View>

          {!!parsed.replyPreview && (
            <View style={styles.replyQuoteBox}>
              <View style={styles.replyQuoteBar} />
              <View style={styles.replyQuoteTextWrap}>
                {!!parsed.repliedToName && (
                  <Text style={styles.replyQuoteMeta} numberOfLines={1}>
                    Reply to {parsed.repliedToName}
                  </Text>
                )}
                <Text style={styles.replyQuoteText} numberOfLines={2}>
                  {parsed.replyPreview}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.commentText}>{parsed.body}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

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
  
  const [message, setMessage] = useState('');
  const [cardExpanded, setCardExpanded] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  
  const [comments, setComments] = useState<UIComment[]>([]);
  const [replyTo, setReplyTo] = useState<UIComment | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [posterProfile, setPosterProfile] = useState<any>(null);
  
  const [questData, setQuestData] = useState<any>(quest);
  const [loading, setLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState<UIComment | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfilePreview | null>(null);
  const [applicantsExpanded, setApplicantsExpanded] = useState(true);

  // Archive Viewer State specifically for the Poster
  const [viewingArchive, setViewingArchiveState] = useState(false);
  const viewingArchiveRef = useRef(false);

  // Use a ref to ensure the realtime subscription always checks against the latest status
  const questStatusRef = useRef(questData?.status || 'open');

  const parseReplyEncodedContent = useCallback((text: string) => {
    const raw = (text ?? '').trim();
    // Supported formats:
    // - "↪ <name>: <preview>\n<body>"   (new)
    // - "↪ <preview>\n<body>"          (old)
    if (raw.startsWith('↪')) {
      // Remove the arrow and any following whitespace safely (don't assume "↪ ").
      // Also strip the emoji-variation selector if present (↪️).
      const withoutArrow = raw.replace(/^↪\uFE0F?\s*/, '');
      const newLineIdx = withoutArrow.indexOf('\n');
      if (newLineIdx !== -1) {
        const header = withoutArrow.slice(0, newLineIdx).trim();
        const bodyText = withoutArrow.slice(newLineIdx + 1).trim();
        if (header && bodyText) {
          // Try to parse "name: preview"
          const colonIdx = header.indexOf(':');
          if (colonIdx !== -1) {
            const repliedToName = header.slice(0, colonIdx).trim();
            const previewText = header.slice(colonIdx + 1).trim();
            if (previewText) {
              return { repliedToName, replyPreview: previewText, body: bodyText };
            }
          }
          return { repliedToName: '', replyPreview: header, body: bodyText };
        }
      }
    }
    return { repliedToName: '', replyPreview: '', body: raw };
  }, []);

  const toggleArchiveView = () => {
    const newState = !viewingArchiveRef.current;
    viewingArchiveRef.current = newState;
    setViewingArchiveState(newState);
    if (currentUserId) {
      fetchQuestData(currentUserId);
    }
  };

  const fetchQuestData = useCallback(async (userIdToUse?: string) => {
    if (!quest?.id) return;
    
    // Fetch Quest Details
    const { data: qData } = await supabase.from('quests').select('*').eq('id', quest.id).single();
    if (qData) {
      setQuestData(qData);
      questStatusRef.current = qData.status; // Update Ref for realtime
      if (qData.user_id) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', qData.user_id).maybeSingle();
        if (pData) setPosterProfile(pData);
      }
    }

    // Fetch Participants
    const { data: partData } = await supabase
      .from('quest_participants')
      .select('*, profiles(display_name, equipped_accessories)')
      .eq('quest_id', quest.id);
    if (partData) {
      setParticipants(partData);
    }

    // Determine which comments to fetch (Respecting the Poster's Archive Toggle)
    const activeVisibility = (qData?.status === 'open' || viewingArchiveRef.current) ? 'public' : 'private';

    // Fetch Comments based on visibility
    const { data: cData } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          display_name,
          equipped_accessories
        )
      `)
      .eq('quest_id', quest.id)
      .eq('visibility', activeVisibility)
      .order('created_at', { ascending: true }); 

    if (cData) {
      const formattedComments = cData.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        author: c.user_id === userIdToUse ? 'You' : (c.profiles?.display_name || 'Unknown User'),
        text: c.content,
        time: formatRelativeTime(c.created_at),
        accessories: normalizeAccessories(c.profiles?.equipped_accessories),
        visibility: c.visibility,
      }));
      setComments(formattedComments);
    }
  }, [quest?.id]);

  useEffect(() => {
    let mounted = true;
    let commentSubscription: any = null;

    const initData = async () => {
      let activeUserId = currentUserId;
      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user) {
          activeUserId = user.id;
          setCurrentUserId(user.id);
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (mounted && profile) setCurrentUserProfile(profile);
        }
      }

      if (mounted) {
        await fetchQuestData(activeUserId!);
      }

      // Setup Realtime Subscription
      if (quest?.id) {
        commentSubscription = supabase
          .channel(`public:comments:quest_id=eq.${quest.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments', filter: `quest_id=eq.${quest.id}` },
            (payload) => {
              if (mounted) {
                const newC = payload.new;
                if (newC.user_id === activeUserId) return; 

                // Ignore incoming messages that don't match our current view state
                const expectedVisibility = (questStatusRef.current === 'open' || viewingArchiveRef.current) ? 'public' : 'private';
                if (newC.visibility !== expectedVisibility) return;

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
                        visibility: newC.visibility,
                      };
                      setComments((prev) => [...prev, newFormattedComment]);
                      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
                    }
                  });
              }
            }
          )
          .subscribe();
      }
    };

    initData();

    return () => {
      mounted = false;
      if (commentSubscription) supabase.removeChannel(commentSubscription);
    };
  }, [quest?.id, fetchQuestData]);

  const handleApplyOrDrop = async () => {
    if (!currentUserId || !questData?.id) return;
    try {
      setLoading(true);
      if (myParticipantStatus === 'accepted') {
        const { error } = await supabase
          .from('quest_participants')
          .update({ status: 'withdrawn' })
          .eq('quest_id', questData.id)
          .eq('user_id', currentUserId);
        if (error) throw error;
        setParticipants(prev => prev.map(p => p.user_id === currentUserId ? { ...p, status: 'withdrawn' } : p));
      } else {
        const { data: newStatus, error } = await supabase.rpc('apply_for_quest', { p_quest_id: questData.id });
        if (error) throw error;
        
        await fetchQuestData(currentUserId); 

        if (newStatus === 'accepted') {
          Alert.alert('Quest Accepted', 'You have successfully joined the quest!');
        } else {
          Alert.alert('Application Sent', 'Your application is pending poster approval.');
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update quest.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplicant = async (applicantId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('quest_participants')
        .update({ status: 'accepted' })
        .eq('quest_id', questData.id)
        .eq('user_id', applicantId);
      if (error) throw error;
      await fetchQuestData(currentUserId!); 
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartManualQuest = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('start_manual_quest', { p_quest_id: questData.id });
      if (error) throw error;
      Alert.alert("Quest Started", "The quest is now in progress!");
      await fetchQuestData(currentUserId!);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const category = (questData?.category ?? quest?.category ?? 'favor') as FeedCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const title = questData?.title ?? quest?.title ?? 'Need help around campus today';
  const preview = questData?.description ?? quest?.preview ?? 'Looking for someone nearby to help with a quick request before 5PM.';
  const posterName = quest?.posterName ?? 'Anonymous User';
  const ago = quest?.ago ?? 'Just now';
  const xp = questData?.bonus_xp ?? quest?.xp ?? 150;
  const token = questData?.token_bounty ?? quest?.token ?? 25;
  
  const isPoster = currentUserId === questData?.user_id;
  const isAutoAccept = questData?.is_auto_accept ?? true;
  const maxParticipants = questData?.max_participants ?? 1;

  const myParticipantRow = participants.find(p => p.user_id === currentUserId);
  const myParticipantStatus = myParticipantRow?.status;

  const appliedParticipants = participants.filter(p => p.status === 'applied');
  const acceptedParticipants = participants.filter(p => p.status === 'accepted');

  const commentCount = useMemo(() => comments.length, [comments]);

  let statusText = 'Open';
  if (questData?.status === 'in_progress') statusText = 'In Progress';
  if (questData?.status === 'completed') statusText = 'Completed';
  if (questData?.status === 'accepted') statusText = 'In Progress';

  const isQuestAccepted = questData?.status === 'in_progress' || questData?.status === 'completed' || questData?.status === 'accepted';
  const shouldShowCompactCard = isQuestAccepted;

  // VISIBILITY LOGIC
  const isParticipant = isPoster || myParticipantStatus === 'accepted';
  const commentsOpen = questData?.status === 'open';
  const showComments = commentsOpen || isParticipant;
  
  // Only the poster can see the toggle button to view archived comments
  const showArchivedToggle = !commentsOpen && isPoster;

  const onSubmitComment = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !questData?.id) return;

    // Since we don't have parent_comment_id in DB, we encode reply context into the content.
    // Format:
    //   ↪ <replied-to name>: <preview of replied-to comment>\n<actual reply message>
    // (Keeps it dynamic + readable even without threading.)
    const replyTargetName = replyTo?.author?.trim() ?? '';
    const replyTargetBody = replyTo?.text ? parseReplyEncodedContent(replyTo.text).body : '';
    const replyQuoted = replyTargetBody
      ? replyTargetBody.trim().replace(/\s+/g, ' ').slice(0, 120)
      : '';
    const finalContent =
      replyQuoted && replyTargetName
        ? `↪ ${replyTargetName}: ${replyQuoted}\n${trimmed}`
        : replyQuoted
          ? `↪ ${replyQuoted}\n${trimmed}`
          : trimmed;

    setMessage('');
    setReplyTo(null);
    const targetVisibility = questData?.status === 'open' ? 'public' : 'private';
    const tempCommentId = `temp-${Date.now()}`;
    
    const newLocalComment: UIComment = {
      id: tempCommentId,
      userId: currentUserId,
      author: currentUserProfile?.display_name || 'You', 
      text: finalContent,
      time: 'Just now',
      accessories: normalizeAccessories(currentUserProfile?.equipped_accessories),
      visibility: targetVisibility,
    };

    setComments((prev) => [...prev, newLocalComment]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    const { error } = await supabase
      .from('comments')
      .insert([{ 
        quest_id: questData.id, 
        user_id: currentUserId, 
        content: finalContent,
        visibility: targetVisibility 
      }]);
      
    if (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
      setComments((prev) => prev.filter(c => c.id !== tempCommentId));
      console.error('Comment error:', error);
    }
  };

  const beginReply = (comment: UIComment) => {
    if (!currentUserId) return;
    // Allow replying to yourself too
    setReplyTo(comment);
    // animate banner in
    replyBannerAnim.setValue(0);
    Animated.timing(replyBannerAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelReply = () => {
    Animated.timing(replyBannerAnim, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setReplyTo(null);
    });
  };

  const replyBannerAnim = useRef(new Animated.Value(0)).current;
  const replyBannerStyle = useMemo(
    () => ({
      opacity: replyBannerAnim,
      transform: [
        {
          translateY: replyBannerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
        },
        {
          scale: replyBannerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    }),
    [replyBannerAnim],
  );

  const replyPreview = useMemo(() => {
    if (!replyTo?.text) return '';
    const trimmed = parseReplyEncodedContent(replyTo.text).body.trim();
    if (trimmed.length <= 90) return trimmed;
    return `${trimmed.slice(0, 90)}…`;
  }, [replyTo?.text]);

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

    setSelectedProfile({
      id: selectedComment.userId,
      displayName: selectedComment.author === 'You'
        ? (currentUserProfile?.display_name || 'You')
        : selectedComment.author,
      accessories: selectedComment.accessories,
      major: currentUserProfile?.major || null,
      graduationYear: currentUserProfile?.graduation_year || null,
      bio: currentUserProfile?.bio || null, 
    });
    setActionsVisible(false);
    setProfilePreviewVisible(true);

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_accessories, major, graduation_year, bio') 
      .eq('id', selectedComment.userId)
      .maybeSingle();

    if (error || !profileData) return;

    setSelectedProfile({
      id: profileData.id,
      displayName: profileData.display_name || 'Anonymous',
      accessories: normalizeAccessories(profileData.equipped_accessories),
      major: profileData.major,
      graduationYear: profileData.graduation_year,
      bio: profileData.bio,
    });
  };

  const openPosterProfile = async () => {
    const targetUserId = questData?.user_id || quest?.user_id;
    if (!targetUserId) return;

    setSelectedProfile({
      id: targetUserId,
      displayName: posterProfile?.display_name || posterName,
      accessories: normalizeAccessories(posterProfile?.equipped_accessories),
      major: posterProfile?.major || null,
      graduationYear: posterProfile?.graduation_year || null,
      bio: posterProfile?.bio || null,
    });
    setProfilePreviewVisible(true);

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_accessories, major, graduation_year, bio')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!error && profileData) {
      setSelectedProfile({
        id: profileData.id,
        displayName: profileData.display_name || 'Anonymous',
        accessories: normalizeAccessories(profileData.equipped_accessories),
        major: profileData.major,
        graduationYear: profileData.graduation_year,
        bio: profileData.bio,
      });
      setPosterProfile(profileData);
    }
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
          <View style={styles.headerRightSpacer} />
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          
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
                <Pressable 
                  onPress={openPosterProfile} 
                  style={styles.posterInfoWrap}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View style={styles.posterAvatarWrap}>
                    <LayeredAvatar 
                      accessories={normalizeAccessories(posterProfile?.equipped_accessories)} 
                      size={32} 
                      scale={1.4} 
                      translateY={2} 
                    />
                  </View>
                  <View>
                    <Text style={styles.poster}>{posterProfile?.display_name || posterName}</Text>
                    <Text style={styles.time}>{ago}</Text>
                  </View>
                </Pressable>
                
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

          {/* POSTER VIEW (MANUAL REVIEW) */}
          {isPoster && !isAutoAccept && questData?.status === 'open' && (
            <View style={styles.applicantsCard}>
               <Pressable 
                 style={styles.applicantsHeader} 
                 onPress={() => setApplicantsExpanded(!applicantsExpanded)}
               >
                 <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                   <Ionicons name="people" size={18} color={COLORS.textPrimary} />
                   <Text style={styles.applicantsTitle}>Review Applicants</Text>
                   <View style={styles.countChip}>
                     <Text style={styles.countText}>{appliedParticipants.length}</Text>
                   </View>
                 </View>
                 <Ionicons name={applicantsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
               </Pressable>

               {applicantsExpanded && (
                 <View style={styles.applicantsList}>
                   {acceptedParticipants.length > 0 && (
                     <Text style={styles.startQuestHint}>
                       Accepted ({acceptedParticipants.length}/{maxParticipants})
                     </Text>
                   )}
                   {appliedParticipants.length === 0 ? (
                     <Text style={styles.emptyApplicants}>No applicants yet.</Text>
                   ) : (
                     appliedParticipants.map(p => (
                       <View key={p.id} style={styles.applicantRow}>
                         <View style={styles.applicantInfo}>
                           <LayeredAvatar accessories={normalizeAccessories(p.profiles?.equipped_accessories)} size={32} />
                           <Text style={styles.applicantName}>{p.profiles?.display_name || 'Anonymous'}</Text>
                         </View>
                         <Pressable 
                           style={[styles.acceptApplicantBtn, loading && {opacity: 0.7}]} 
                           onPress={() => handleAcceptApplicant(p.user_id)}
                           disabled={loading || acceptedParticipants.length >= maxParticipants}
                         >
                           <Text style={styles.acceptApplicantText}>Accept</Text>
                         </Pressable>
                       </View>
                     ))
                   )}
                   
                   <View style={styles.startQuestWrap}>
                      <Pressable 
                        style={[styles.startQuestBtn, (loading || acceptedParticipants.length === 0) && {opacity: 0.7}]} 
                        onPress={handleStartManualQuest}
                        disabled={loading || acceptedParticipants.length === 0}
                      >
                        <Text style={styles.startQuestText}>Start Quest Now</Text>
                      </Pressable>
                      <Text style={styles.startQuestHint}>
                        This will lock the quest and reject remaining applicants.
                      </Text>
                   </View>
                 </View>
               )}
            </View>
          )}

          {/* NON-POSTER CTA BUTTON */}
          {(!shouldShowCompactCard || myParticipantStatus === 'accepted') && !isPoster && (
             <View style={{ marginTop: 4 }}>
                {myParticipantStatus === 'applied' ? (
                  <View style={[styles.acceptButton, { backgroundColor: COLORS.textSecondary }]}>
                    <Text style={styles.acceptText}>Application Pending</Text>
                  </View>
                ) : myParticipantStatus === 'accepted' ? (
                  <Pressable style={[styles.acceptButton, { backgroundColor: COLORS.error }, loading && { opacity: 0.7 }]} onPress={handleApplyOrDrop} disabled={loading}>
                    <Text style={styles.acceptText}>Drop Quest</Text>
                  </Pressable>
                ) : questData?.status === 'open' ? (
                  <Pressable style={[styles.acceptButton, loading && { opacity: 0.7 }]} onPress={handleApplyOrDrop} disabled={loading}>
                    <Text style={styles.acceptText}>{isAutoAccept ? 'Accept Quest' : 'Apply for Quest'}</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.acceptButton, { backgroundColor: COLORS.textSecondary }]}>
                    <Text style={styles.acceptText}>Quest Unavailable</Text>
                  </View>
                )}
             </View>
          )}

          {showComments ? (
            <>
              {/* COMMENTS HEADER WITH MINIMAL TOGGLE FOR POSTER */}
              <View style={styles.commentsHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={styles.commentsTitle}>
                    {commentsOpen ? 'Comments' : (viewingArchive ? 'Archived Comments' : 'Group Chat')}
                  </Text>
                  <View style={styles.countChip}>
                    <Text style={styles.countText}>{commentCount}</Text>
                  </View>
                </View>

                {showArchivedToggle && (
                  <Pressable onPress={toggleArchiveView} hitSlop={12}>
                    <Text style={styles.archiveToggleText}>
                      {viewingArchive ? 'View Chat' : 'View Archive'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* COMMENTS LIST */}
              {comments.map((comment) => (
                <SwipeReplyCommentRow
                  key={comment.id}
                  comment={comment}
                  onReply={beginReply}
                  onOpenActions={openCommentActions}
                  parse={parseReplyEncodedContent}
                />
              ))}
            </>
          ) : (
            <View style={styles.lockedCommentsBox}>
              <Ionicons name="lock-closed" size={24} color={COLORS.textSecondary} />
              <Text style={styles.lockedCommentsText}>This quest is currently in progress.{"\n"}Comments are closed to the public.</Text>
            </View>
          )}
        </ScrollView>

        {/* INPUT BAR (HIDDEN WHEN POSTER IS VIEWING ARCHIVE) */}
        {showComments && !viewingArchive && (
          <View style={styles.inputBar}>
            {replyTo && (
              <Animated.View style={[styles.replyBanner, replyBannerStyle]}>
                <View style={styles.replyBannerLeft}>
                  <Text style={styles.replyBannerTitle} numberOfLines={1}>
                    Replying to <Text style={styles.replyBannerName}>{replyTo.author}</Text>
                  </Text>
                  {!!replyPreview && (
                    <Text style={styles.replyBannerPreview} numberOfLines={1}>
                      {replyPreview}
                    </Text>
                  )}
                </View>

                <Pressable onPress={cancelReply} hitSlop={10} style={styles.replyBannerClose}>
                  <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                </Pressable>
              </Animated.View>
            )}
            <TextInput
              ref={(r) => {
                inputRef.current = r;
              }}
              value={message}
              onChangeText={setMessage}
              placeholder={
                replyTo
                  ? `Reply to ${replyTo.author}...`
                  : commentsOpen
                    ? "Add a public comment..."
                    : "Message group..."
              }
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />
            <Pressable style={styles.sendButton} onPress={onSubmitComment}>
              <Ionicons name="send" size={16} color={COLORS.bg} />
            </Pressable>
          </View>
        )}

        {/* COMMENT ACTION MODAL */}
        <Modal visible={actionsVisible} animationType="fade" transparent onRequestClose={closeCommentActions}>
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

        {/* PROFILE PREVIEW MODAL */}
        <Modal visible={profilePreviewVisible} animationType="slide" transparent onRequestClose={closeProfilePreview}>
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
  headerRightSpacer: {
    minWidth: 72,
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
  posterInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  posterAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2 || '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
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
  applicantsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  applicantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: COLORS.surface2,
  },
  applicantsTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  applicantsList: {
    padding: 14,
    gap: 12,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applicantName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  acceptApplicantBtn: {
    backgroundColor: COLORS.favor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptApplicantText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  startQuestWrap: {
    marginTop: 8,
    gap: 6,
  },
  startQuestBtn: {
    backgroundColor: COLORS.xp,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startQuestText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '700',
  },
  startQuestHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  emptyApplicants: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
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
  archiveToggleText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  commentRow: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
  },
  swipeRowWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  replyUnderlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 14,
    borderRadius: 12,
    backgroundColor: withOpacity(COLORS.favor, 0.14),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.favor, 0.22),
  },
  replyUnderlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.favor,
  },
  replyUnderlayText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '800',
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
  lockedCommentsBox: {
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  lockedCommentsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  replyBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: -36,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyBannerLeft: { flex: 1, paddingRight: 10 },
  replyBannerTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  replyBannerName: { color: COLORS.textPrimary, fontWeight: '800' },
  replyBannerPreview: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, opacity: 0.9 },
  replyBannerClose: { padding: 4, borderRadius: 10 },
  replyQuoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: withOpacity(COLORS.textPrimary, 0.04),
    marginTop: 6,
    marginBottom: 6,
  },
  replyQuoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: withOpacity(COLORS.favor, 0.7),
    marginTop: 2,
    marginBottom: 2,
  },
  replyQuoteText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  replyQuoteTextWrap: {
    flex: 1,
  },
  replyQuoteMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    opacity: 0.9,
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