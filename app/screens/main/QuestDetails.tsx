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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import 'react-native-url-polyfill/auto';

// Icons
import BackIcon from '../../../assets/QuestDetailsAssets/Back_Icon.svg';
import LocationIcon from '../../../assets/QuestDetailsAssets/Location_Icon.svg';
import XpPixelIcon from '../../../assets/QuestDetailsAssets/XP_Pixel_Icon.svg';
import TokenPixelIcon from '../../../assets/QuestDetailsAssets/Token_Pixel_Icon.svg';

import CompactQuestCard from '../../components/cards/CompactQuestCard';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { darkColors, withOpacity } from '../../constants/colors';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeColors = Record<keyof typeof darkColors, string>;

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
  image_url?: string | null;
};

type ProfilePreview = {
  id: string;
  displayName: string;
  accessories?: Partial<Record<AvatarSlot, string>>;
  major?: string | null;
  graduationYear?: string | null;
  bio?: string | null;
  rank?: number | null;
  totalXP?: number;
  completedQuests?: number;
  badges?: string[];
  reputation?: string;
  level?: number;
};

const PROFILE_BADGE_ASSETS = {
  badgeHat: require("../../../assets/ProfileAssets/BadgeHat.png"),
  badgeMedal: require("../../../assets/ProfileAssets/BadgeMedal.png"),
  badgeShield: require("../../../assets/ProfileAssets/BadgeShield.png"),
  experience: require("../../../assets/ProfileAssets/Experience_Pixel.png"),
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          <Ionicons name="return-down-forward" size={16} color={colors.bg} />
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

          {comment.image_url && (
            <Image 
              source={{ uri: comment.image_url }} 
              style={styles.commentImage} 
              resizeMode="cover"
            />
          )}

          <Text style={styles.commentText}>{parsed.body}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

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

function fmtXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return String(xp);
}

function getBadgeSet(totalXP: number, completedQuests: number): string[] {
  const badges = ['Guardian'];
  if (completedQuests >= 5 || totalXP >= 1000) badges.push('Achiever');
  if (completedQuests >= 15 || totalXP >= 3000) badges.push('Scholar');
  return badges.slice(0, 3);
}

function getReputationLabel(totalXP: number): string {
  if (totalXP >= 30_000) return 'Campus Legend';
  if (totalXP >= 15_000) return 'Elite Helper';
  if (totalXP >= 6_000) return 'Trusted Contributor';
  if (totalXP >= 1_000) return 'Campus Helper';
  return 'Rising Helper';
}

const XP_THRESHOLDS = [0, 1000, 3000, 6000, 10000, 15000, 22000, 31000, 42000, 55000];

function calculateLevelFromXP(totalXP: number) {
  let currentLevel = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (totalXP >= XP_THRESHOLDS[i]) currentLevel = i + 1;
    else break;
  }
  const currentThreshold = XP_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = XP_THRESHOLDS[currentLevel] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 5000;
  const xpInCurrentLevel = totalXP - currentThreshold;
  const xpNeededForNextLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min(1, Math.max(0, xpInCurrentLevel / xpNeededForNextLevel));
  return { currentLevel, xpInCurrentLevel, xpNeededForNextLevel, progressPercent };
}

type LayeredAvatarProps = {
  accessories?: Partial<Record<AvatarSlot, string>>;
  size: number;
  scale?: number;
  translateY?: number;
};

function LayeredAvatar({ accessories, size, scale = 1.35, translateY = 2 }: LayeredAvatarProps) {
  const { colors } = useTheme();
  const safeAccessories = normalizeAccessories(accessories);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.surface2,
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const CATEGORY_COLORS: Record<FeedCategory, string> = useMemo(() => ({
    favor: colors.favor,
    study: colors.study,
    item: colors.item,
  }), [colors]);

  const quest = route?.params?.quest;
  const { refreshBalance } = useTokenBalance();
  
  const [message, setMessage] = useState('');
  const [cardExpanded, setCardExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
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

  const [viewingArchive, setViewingArchiveState] = useState(false);
  const viewingArchiveRef = useRef(false);

  const questStatusRef = useRef(questData?.status || 'open');

  const parseReplyEncodedContent = useCallback((text: string) => {
    const raw = (text ?? '').trim();
    
    const arrowMatch = raw.match(/^↪\uFE0F?\s*/);
    if (!arrowMatch) {
      return { repliedToName: '', replyPreview: '', body: raw };
    }
    
    const withoutArrow = raw.slice(arrowMatch[0].length);
    const newLineIdx = withoutArrow.indexOf('\n');
    
    if (newLineIdx === -1) {
      return { repliedToName: '', replyPreview: '', body: raw };
    }
    
    const header = withoutArrow.slice(0, newLineIdx).trim();
    const bodyText = withoutArrow.slice(newLineIdx + 1).trim();
    
    if (!header || !bodyText) {
      return { repliedToName: '', replyPreview: '', body: raw };
    }
    
    const colonSpaceIdx = header.indexOf(': ');
    if (colonSpaceIdx !== -1 && colonSpaceIdx > 0) {
      const repliedToName = header.slice(0, colonSpaceIdx).trim();
      const previewText = header.slice(colonSpaceIdx + 2).trim();
      if (repliedToName && previewText) {
        return { repliedToName, replyPreview: previewText, body: bodyText };
      }
    }
    
    return { repliedToName: '', replyPreview: header, body: bodyText };
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
    
    const { data: qData } = await supabase.from('quests').select('*').eq('id', quest.id).single();
    if (qData) {
      setQuestData(qData);
      questStatusRef.current = qData.status;
      if (qData.user_id) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', qData.user_id).maybeSingle();
        if (pData) setPosterProfile(pData);
      }
    }

    const { data: partData } = await supabase
      .from('quest_participants')
      .select('*, profiles(display_name, equipped_accessories)')
      .eq('quest_id', quest.id);
    if (partData) {
      setParticipants(partData);
    }

    const activeVisibility = (qData?.status === 'open' || viewingArchiveRef.current) ? 'public' : 'private';

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
        image_url: c.image_url,
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

                const expectedVisibility = (questStatusRef.current === 'open' || viewingArchiveRef.current) ? 'public' : 'private';
                if (newC.visibility !== expectedVisibility) return;

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
                        image_url: newC.image_url,
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

  // Image Picking & Uploading Logic (BASE64 Fix applied)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.2,
      base64: true, // Added base64 extraction
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null); // Save base64 string
    }
  };

  const uploadImage = async (base64Str: string) => {
    const fileName = `${Date.now()}-${currentUserId}.jpg`;
    const filePath = `comment_photos/${fileName}`;

    // Upload directly using base64 decode bypasses the React Native fetch bug
    const { data, error } = await supabase.storage
      .from('quest-attachments') 
      .upload(filePath, decode(base64Str), {
        contentType: 'image/jpeg',
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('quest-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleDeleteQuest = () => {
    Alert.alert(
      "Delete Quest",
      `Are you sure you want to delete this quest? \n\n${questData?.token_bounty} Tokens will be refunded to your account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!questData?.id) return;
            try {
              setLoading(true);
              const { error } = await supabase.rpc('delete_quest_and_refund', {
                p_quest_id: questData.id,
              });
              if (error) throw error;
              await refreshBalance();
              if (navigation?.goBack) navigation.goBack();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete quest.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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

  const isParticipant = isPoster || myParticipantStatus === 'accepted';
  const commentsOpen = questData?.status === 'open';
  const showComments = commentsOpen || isParticipant;
  
  const showArchivedToggle = !commentsOpen && isPoster;

  const onSubmitComment = async () => {
    const trimmed = message.trim();
    if ((!trimmed && !selectedImage) || !currentUserId || !questData?.id) return;

    setLoading(true);
    try {
      let uploadedUrl = null;
      if (selectedImage && imageBase64) {
        uploadedUrl = await uploadImage(imageBase64);
      }

      const replyTargetName = replyTo?.author?.trim() ?? '';
      const replyTargetBody = replyTo?.text ? parseReplyEncodedContent(replyTo.text).body : '';
      const replyQuoted = replyTargetBody ? replyTargetBody.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
      
      const finalContent = replyQuoted && replyTargetName
          ? `↪ ${replyTargetName}: ${replyQuoted}\n${trimmed}`
          : trimmed;

      const targetVisibility = questData?.status === 'open' ? 'public' : 'private';

      const { error } = await supabase
        .from('comments')
        .insert([{ 
          quest_id: questData.id, 
          user_id: currentUserId, 
          content: finalContent,
          image_url: uploadedUrl,
          visibility: targetVisibility 
        }]);
        
      if (error) throw error;

      // Clear all states after successful send
      setMessage('');
      setSelectedImage(null);
      setImageBase64(null); 
      setReplyTo(null);
      fetchQuestData(currentUserId);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to post: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const beginReply = (comment: UIComment) => {
    if (!currentUserId) return;
    setReplyTo(comment);
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
  }, [replyTo?.text, parseReplyEncodedContent]);

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

  const fetchAndSetProfilePreview = async (targetUserId: string) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_accessories, major, graduation_year, bio, total_xp')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error || !profileData) return;

    const { data: leaderboardData } = await supabase
      .from('leaderboard')
      .select('rank, completed_quests, total_xp')
      .eq('id', targetUserId)
      .maybeSingle();

    let fallbackRank: number | null = null;
    if (!leaderboardData) {
      const { data: rankData } = await supabase.rpc('get_user_leaderboard_rank', { user_id: targetUserId });
      fallbackRank = rankData?.rank ?? null;
    }

    const totalXP = Number(leaderboardData?.total_xp ?? profileData.total_xp ?? 0);
    const completedQuests = Number(leaderboardData?.completed_quests ?? 0);
    const levelData = calculateLevelFromXP(totalXP);

    setSelectedProfile({
      id: profileData.id,
      displayName: profileData.display_name || 'Anonymous',
      accessories: normalizeAccessories(profileData.equipped_accessories),
      major: profileData.major,
      graduationYear: profileData.graduation_year,
      bio: profileData.bio,
      rank: leaderboardData?.rank ?? fallbackRank,
      totalXP,
      completedQuests,
      badges: getBadgeSet(totalXP, completedQuests),
      reputation: getReputationLabel(totalXP),
      level: levelData.currentLevel,
    });
  };

  const onViewProfile = async () => {
    if (!selectedComment?.userId) return;

    const initialTotalXP = Number(currentUserProfile?.total_xp ?? 0);
    const initialLevelData = calculateLevelFromXP(initialTotalXP);

    setSelectedProfile({
      id: selectedComment.userId,
      displayName: selectedComment.author === 'You'
        ? (currentUserProfile?.display_name || 'You')
        : selectedComment.author,
      accessories: selectedComment.accessories,
      major: currentUserProfile?.major || null,
      graduationYear: currentUserProfile?.graduation_year || null,
      bio: currentUserProfile?.bio || null,
      rank: null,
      totalXP: initialTotalXP,
      completedQuests: 0,
      badges: getBadgeSet(initialTotalXP, 0),
      reputation: getReputationLabel(initialTotalXP),
      level: initialLevelData.currentLevel,
    });
    setActionsVisible(false);
    setProfilePreviewVisible(true);

    await fetchAndSetProfilePreview(selectedComment.userId);
  };

  const openPosterProfile = async () => {
    const targetUserId = questData?.user_id || quest?.user_id;
    if (!targetUserId) return;

    const initialTotalXP = Number(posterProfile?.total_xp ?? 0);
    const initialLevelData = calculateLevelFromXP(initialTotalXP);

    setSelectedProfile({
      id: targetUserId,
      displayName: posterProfile?.display_name || posterName,
      accessories: normalizeAccessories(posterProfile?.equipped_accessories),
      major: posterProfile?.major || null,
      graduationYear: posterProfile?.graduation_year || null,
      bio: posterProfile?.bio || null,
      rank: null,
      totalXP: initialTotalXP,
      completedQuests: 0,
      badges: getBadgeSet(initialTotalXP, 0),
      reputation: getReputationLabel(initialTotalXP),
      level: initialLevelData.currentLevel,
    });
    setProfilePreviewVisible(true);

    await fetchAndSetProfilePreview(targetUserId);
  };

  const profileSubtitle = selectedProfile
    ? `${selectedProfile.major || 'Undeclared'}${selectedProfile.graduationYear ? ` · Class of '${selectedProfile.graduationYear.slice(-2)}` : ''}`
    : '';
  const selectedTotalXP = selectedProfile?.totalXP ?? 0;
  const levelData = calculateLevelFromXP(selectedTotalXP);
  const nextLevel = Math.min(levelData.currentLevel + 1, 10);
  const selectedBadges = selectedProfile?.badges ?? ['Guardian'];

  return (
    <KeyboardAvoidingView 
      style={styles.modalBackdrop}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.sheet}>
        
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation?.goBack?.()}>
            <BackIcon width={18} height={18} />
            <Text style={styles.backText}>Feed</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Quest Details</Text>
          {isPoster && questData?.status === 'open' ? (
            <Pressable 
              style={[styles.iconButton, { justifyContent: 'flex-end', opacity: loading ? 0.5 : 1 }]} 
              onPress={handleDeleteQuest}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error || '#FF3B30'} />
            </Pressable>
          ) : (
            <View style={styles.headerRightSpacer} />
          )}
        </View>

        <ScrollView
          ref={(r) => {
            scrollRef.current = r;
          }}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          
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
                <View style={[styles.categoryBadge, { backgroundColor: withOpacity(categoryColor, 0.15) }]}>
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

          {isPoster && !isAutoAccept && questData?.status === 'open' && (
            <View style={styles.applicantsCard}>
               <Pressable 
                 style={styles.applicantsHeader} 
                 onPress={() => setApplicantsExpanded(!applicantsExpanded)}
               >
                 <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                   <Ionicons name="people" size={18} color={colors.textPrimary} />
                   <Text style={styles.applicantsTitle}>Review Applicants</Text>
                   <View style={styles.countChip}>
                     <Text style={styles.countText}>{appliedParticipants.length}</Text>
                   </View>
                 </View>
                 <Ionicons name={applicantsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
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

          {(!shouldShowCompactCard || myParticipantStatus === 'accepted') && !isPoster && (
             <View style={{ marginTop: 4 }}>
                {myParticipantStatus === 'applied' ? (
                  <View style={[styles.acceptButton, { backgroundColor: colors.textSecondary }]}>
                    <Text style={styles.acceptText}>Application Pending</Text>
                  </View>
                ) : myParticipantStatus === 'accepted' ? (
                  <Pressable style={[styles.acceptButton, { backgroundColor: colors.error || '#FF3B30' }, loading && { opacity: 0.7 }]} onPress={handleApplyOrDrop} disabled={loading}>
                    <Text style={styles.acceptText}>Drop Quest</Text>
                  </Pressable>
                ) : questData?.status === 'open' ? (
                  <Pressable style={[styles.acceptButton, loading && { opacity: 0.7 }]} onPress={handleApplyOrDrop} disabled={loading}>
                    <Text style={styles.acceptText}>{isAutoAccept ? 'Accept Quest' : 'Apply for Quest'}</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.acceptButton, { backgroundColor: colors.textSecondary }]}>
                    <Text style={styles.acceptText}>Quest Unavailable</Text>
                  </View>
                )}
             </View>
          )}

          {showComments ? (
            <>
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
              <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
              <Text style={styles.lockedCommentsText}>This quest is currently in progress.{"\n"}Comments are closed to the public.</Text>
            </View>
          )}
        </ScrollView>

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
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              </Animated.View>
            )}

            <Pressable onPress={pickImage} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="camera" size={28} color="#FF3B30" />
            </Pressable>

            <View style={{ flex: 1 }}>
              {selectedImage && (
                <View style={styles.selectedImagePreview}>
                  <Image source={{ uri: selectedImage }} style={styles.miniPreview} />
                  <Pressable 
                    onPress={() => { 
                      setSelectedImage(null); 
                      setImageBase64(null); 
                    }} 
                    style={styles.removeImageBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="red" />
                  </Pressable>
                </View>
              )}
              <TextInput
                ref={(r) => { inputRef.current = r; }}
                value={message}
                onChangeText={setMessage}
                placeholder={replyTo ? `Reply to ${replyTo.author}...` : "Message..."}
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />
            </View>

            <Pressable style={[styles.sendButton, loading && {opacity: 0.5}]} onPress={onSubmitComment} disabled={loading}>
              <Ionicons name="send" size={16} color={colors.bg} />
            </Pressable>
          </View>
        )}

        <Modal visible={actionsVisible} animationType="fade" transparent onRequestClose={closeCommentActions}>
          <Pressable style={styles.actionBackdrop} onPress={closeCommentActions}>
            <Pressable style={styles.actionBubble} onPress={() => {}}>
              <Pressable style={styles.actionRow} onPress={onViewProfile}>
                <Ionicons name="person-circle-outline" size={18} color={colors.favor} />
                <Text style={styles.actionText}>View Profile</Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <View style={styles.actionRowDisabled}>
                <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.actionTextDisabled}>Report (Soon)</Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={profilePreviewVisible} animationType="slide" transparent onRequestClose={closeProfilePreview}>
          <Pressable style={styles.previewBackdrop} onPress={closeProfilePreview}>
            <Pressable style={styles.previewCard} onPress={() => {}}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Profile</Text>
                <Pressable onPress={closeProfilePreview} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
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

              <View style={styles.previewStatsRow}>
                <View style={styles.previewStatCard}>
                  <Text style={styles.previewStatValue}>#{selectedProfile?.rank ?? '-'}</Text>
                  <Text style={styles.previewStatLabel}>Global Rank</Text>
                </View>
                <View style={styles.previewStatCard}>
                  <Text style={styles.previewStatValue}>{selectedProfile?.completedQuests ?? 0}</Text>
                  <Text style={styles.previewStatLabel}>Quests Completed</Text>
                </View>
                <View style={styles.previewStatCard}>
                  <Text style={styles.previewStatValue}>LVL {selectedProfile?.level ?? levelData.currentLevel}</Text>
                  <Text style={styles.previewStatLabel}>Level</Text>
                </View>
              </View>

              <View style={styles.previewSection}>
                <View style={styles.previewSectionHeaderRow}>
                  <Text style={styles.previewSectionTitle}>Badges</Text>
                </View>
                <View style={styles.previewBadgeRow}>
                  <View style={styles.previewBadgeSlot}>
                    <Image source={PROFILE_BADGE_ASSETS.badgeShield} style={styles.previewBadgeImage} resizeMode="contain" />
                    <Text style={styles.previewBadgeLabel}>{selectedBadges[0] || 'Guardian'}</Text>
                  </View>
                  <View style={styles.previewBadgeSlot}>
                    <Image source={PROFILE_BADGE_ASSETS.badgeMedal} style={styles.previewBadgeImage} resizeMode="contain" />
                    <Text style={styles.previewBadgeLabel}>{selectedBadges[1] || 'Achiever'}</Text>
                  </View>
                  <View style={styles.previewBadgeSlot}>
                    <Image source={PROFILE_BADGE_ASSETS.badgeHat} style={styles.previewBadgeImage} resizeMode="contain" />
                    <Text style={styles.previewBadgeLabel}>{selectedBadges[2] || 'Scholar'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewSection}>
                <View style={styles.previewSectionHeaderRow}>
                  <Text style={styles.previewSectionTitle}>Reputation</Text>
                  <View style={styles.previewRankChip}>
                    <Text style={styles.previewRankChipText}>{selectedProfile?.reputation || 'Campus Helper'}</Text>
                  </View>
                </View>
                <View style={styles.previewKarmaLabelRow}>
                  <View style={styles.previewKarmaTitleCluster}>
                    <Image source={PROFILE_BADGE_ASSETS.experience} style={styles.previewKarmaIcon} />
                    <Text style={styles.previewKarmaTitle}>EXPERIENCE</Text>
                  </View>
                  <Text style={styles.previewKarmaValueText}>{levelData.xpInCurrentLevel} / {levelData.xpNeededForNextLevel}</Text>
                </View>
                <View style={styles.previewProgressTrack}>
                  <View style={[styles.previewProgressFill, { width: `${levelData.progressPercent * 100}%` }]} />
                </View>
                <View style={styles.previewLevelRow}>
                  <Text style={styles.previewLevelRangeText}>LVL {levelData.currentLevel}</Text>
                  <Text style={styles.previewLevelRangeText}>LVL {nextLevel}</Text>
                </View>
              </View>

              <View style={styles.previewStatsRow}>
                <View style={styles.previewStatCard}>
                  <Text style={styles.previewStatValue}>{fmtXP(selectedProfile?.totalXP ?? 0)}</Text>
                  <Text style={styles.previewStatLabel}>Total EXP</Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    backgroundColor: COLORS.surface2,
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
    backgroundColor: COLORS.surface2,
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
  commentImage: {
    width: '100%', 
    height: 180, 
    borderRadius: 10, 
    marginVertical: 8,
    backgroundColor: '#1E1E1E'
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
    alignItems: 'stretch',
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
  },
  replyQuoteText: {
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
  selectedImagePreview: {
    marginBottom: 8,
    position: 'relative',
    width: 60,
  },
  miniPreview: {
    width: 60, 
    height: 60, 
    borderRadius: 8
  },
  removeImageBtn: {
    position: 'absolute', 
    top: -5, 
    right: -5, 
    backgroundColor: 'white', 
    borderRadius: 10
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
    gap: 12,
    marginBottom: 86,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  previewIdentityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  previewAvatarFrame: {
    borderWidth: 1.5,
    borderColor: withOpacity(COLORS.favor, 0.4),
    borderRadius: 40,
    padding: 2,
  },
  previewIdentityText: {
    flex: 1,
    gap: 4,
  },
  previewName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  previewBio: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  previewStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewStatCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: withOpacity(COLORS.favor, 0.25),
    backgroundColor: withOpacity(COLORS.favor, 0.06),
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  previewStatValue: {
    color: COLORS.favor,
    fontSize: 10,
    fontWeight: '700',
  },
  previewStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  previewSection: {
    gap: 10,
  },
  previewSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  previewBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  previewBadgeSlot: {
    flex: 1,
    height: 90,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewBadgeImage: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  previewBadgeLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewRankChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: withOpacity(COLORS.favor, 0.08),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.favor, 0.2),
  },
  previewRankChipText: {
    color: COLORS.favor,
    fontSize: 12,
    fontWeight: '600',
  },
  previewKarmaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewKarmaTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewKarmaIcon: {
    width: 16,
    height: 16,
  },
  previewKarmaTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewKarmaValueText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewProgressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.xp,
  },
  previewLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLevelRangeText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
});