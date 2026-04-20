import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
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
import { FONTS } from '../../constants/fonts';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestStatus = 'open' | 'in_progress' | 'completed' | 'accepted' | string;

type QuestDetailParams = {
  quest?: FeedQuest & {
    id?: string;
    user_id?: string;
    description?: string;
    bonus_xp?: number;
    token_bounty?: number;
    accepted_by?: string;
    max_participants?: number;
    is_auto_accept?: boolean;
    status?: QuestStatus;
  };
};

type QuestDetailsProps = {
  navigation?: any;
  route?: { params?: QuestDetailParams };
};

type ParticipantStatus = 'applied' | 'accepted' | 'rejected' | 'dropped';

type QuestParticipant = {
  id: string;
  quest_id: string;
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
  displayName?: string;
  accessories?: Partial<Record<AvatarSlot, string>>;
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
  bio?: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
            style={{
              ...StyleSheet.absoluteFillObject,
              transform: [{ scale }, { translateY }],
            }}
          >
            <Sprite width="100%" height="100%" />
          </View>
        );
      })}
    </View>
  );
}

function SlotDots({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={styles.slotDotsRow}>
      {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.slotDot,
            { backgroundColor: i < filled ? withOpacity(COLORS.xp, 0.8) : COLORS.border },
          ]}
        />
      ))}
      {total > 12 && (
        <Text style={styles.slotDotOverflow}>+{total - 12}</Text>
      )}
    </View>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

type ApplicantCTAProps = {
  isAutoAccept: boolean;
  myStatus: ParticipantStatus | null;
  acceptedCount: number;
  maxParticipants: number;
  isFull: boolean;
  loading: boolean;
  onApply: () => void;
  onDrop: () => void;
};

function ApplicantCTA({
  isAutoAccept,
  myStatus,
  acceptedCount,
  maxParticipants,
  isFull,
  loading,
  onApply,
  onDrop,
}: ApplicantCTAProps) {
  const isGroup = maxParticipants > 1;

  const slotRow = isGroup ? (
    <View style={styles.slotRow}>
      <SlotDots filled={acceptedCount} total={maxParticipants} />
      <Text style={styles.slotLabel}>
        {acceptedCount}/{maxParticipants} spots filled
      </Text>
    </View>
  ) : null;

  if (myStatus === null) {
    if (isFull) {
      return (
        <View style={styles.ctaContainer}>
          {slotRow}
          <View style={[styles.ctaButton, styles.ctaDisabled]}>
            <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
            <Text style={styles.ctaTextDisabled}>Quest Full</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.ctaContainer}>
        {slotRow}
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            isAutoAccept ? styles.ctaPrimary : styles.ctaSecondary,
            pressed && styles.ctaPressed,
            loading && styles.ctaLoading,
          ]}
          onPress={onApply}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <>
              <Ionicons
                name={isAutoAccept ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={isAutoAccept ? COLORS.bg : COLORS.xp}
              />
              <Text style={[styles.ctaText, !isAutoAccept && styles.ctaTextAlt]}>
                {isAutoAccept ? 'Accept Quest' : 'Join Waitlist'}
              </Text>
            </>
          )}
        </Pressable>
        {!isAutoAccept && (
          <Text style={styles.ctaHint}>
            The poster will review and approve your request
          </Text>
        )}
      </View>
    );
  }

  if (myStatus === 'applied') {
    return (
      <View style={styles.ctaContainer}>
        {slotRow}
        <View style={[styles.ctaButton, styles.ctaPending]}>
          <Ionicons name="hourglass-outline" size={16} color={COLORS.token} />
          <Text style={[styles.ctaText, { color: COLORS.token }]}>Awaiting Approval</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.ctaDrop, pressed && { opacity: 0.6 }]}
          onPress={onDrop}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.ctaDropText}>Withdraw request</Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (myStatus === 'accepted') {
    return (
      <View style={styles.ctaContainer}>
        {slotRow}
        <View style={[styles.ctaButton, styles.ctaAccepted]}>
          <Ionicons name="checkmark-done-circle" size={18} color={COLORS.item} />
          <Text style={[styles.ctaText, { color: COLORS.item }]}>You're In!</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.ctaDrop, pressed && { opacity: 0.6 }]}
          onPress={onDrop}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.ctaDropText}>Drop my spot</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.ctaContainer}>
      {slotRow}
      {!isFull && (
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            styles.ctaSecondary,
            pressed && styles.ctaPressed,
            loading && styles.ctaLoading,
          ]}
          onPress={onApply}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.xp} />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={COLORS.xp} />
              <Text style={[styles.ctaText, styles.ctaTextAlt]}>Re-apply</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

// ─── Poster Panel ───────────────────────────────────────────────────────────

type PosterPanelProps = {
  participants: QuestParticipant[];
  maxParticipants: number;
  isAutoAccept: boolean;
  questStatus: QuestStatus;
  loadingIds: Set<string>;
  startLoading: boolean;
  onAcceptParticipant: (participantId: string) => void;
  onRejectParticipant: (participantId: string) => void;
  onStartQuest: () => void;
};

function PosterPanel({
  participants,
  maxParticipants,
  isAutoAccept,
  questStatus,
  loadingIds,
  startLoading,
  onAcceptParticipant,
  onRejectParticipant,
  onStartQuest,
}: PosterPanelProps) {
  const accepted = participants.filter((p) => p.status === 'accepted');
  const applied = participants.filter((p) => p.status === 'applied');
  const isGroup = maxParticipants > 1;
  const isFull = accepted.length >= maxParticipants;
  
  // Logic Fix: simplified check because if questStatus is 'open', it cannot be 'in_progress'.
  const canStart = accepted.length > 0 && questStatus === 'open';

  return (
    <View style={styles.posterPanel}>
      <View style={styles.posterPanelHeader}>
        <View style={styles.posterPanelTitleRow}>
          <Ionicons name="people" size={16} color={COLORS.xp} />
          <Text style={styles.posterPanelTitle}>
            {isAutoAccept ? 'PARTY ROSTER' : 'APPLICANT QUEUE'}
          </Text>
        </View>
        {isGroup && (
          <View style={styles.posterPanelSlotBadge}>
            <Text style={styles.posterPanelSlotText}>
              {accepted.length}/{maxParticipants}
            </Text>
          </View>
        )}
      </View>

      {isGroup && (
        <View style={styles.posterSlotRow}>
          <SlotDots filled={accepted.length} total={maxParticipants} />
        </View>
      )}

      {accepted.length > 0 && (
        <View style={styles.posterSection}>
          <Text style={styles.posterSectionLabel}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.item} /> ACCEPTED
          </Text>
          {accepted.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              variant="accepted"
              isLoading={loadingIds.has(p.id)}
              onReject={() => onRejectParticipant(p.id)}
            />
          ))}
        </View>
      )}

      {!isAutoAccept && applied.length > 0 && (
        <View style={styles.posterSection}>
          <Text style={styles.posterSectionLabel}>
            <Ionicons name="hourglass" size={11} color={COLORS.token} /> PENDING REVIEW
          </Text>
          {applied.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              variant="applied"
              isLoading={loadingIds.has(p.id)}
              isFull={isFull}
              onAccept={() => onAcceptParticipant(p.id)}
              onReject={() => onRejectParticipant(p.id)}
            />
          ))}
        </View>
      )}

      {accepted.length === 0 && applied.length === 0 && (
        <View style={styles.posterEmptyState}>
          <Ionicons name="people-outline" size={28} color={COLORS.border} />
          <Text style={styles.posterEmptyText}>
            {isAutoAccept
              ? 'No one has joined yet'
              : 'No applications yet'}
          </Text>
        </View>
      )}

      {canStart && (
        <>
          <View style={styles.posterDivider} />
          <Pressable
            style={({ pressed }) => [
              styles.startQuestBtn,
              pressed && { opacity: 0.85 },
              startLoading && { opacity: 0.7 },
            ]}
            onPress={onStartQuest}
            disabled={startLoading}
          >
            {startLoading ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={COLORS.bg} />
                <Text style={styles.startQuestText}>Start Quest Now</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.startQuestHint}>
            This locks the party and notifies all accepted helpers
          </Text>
        </>
      )}

      {questStatus === 'in_progress' && (
        <View style={styles.inProgressBanner}>
          <Ionicons name="flash" size={14} color={COLORS.item} />
          <Text style={styles.inProgressText}>Quest is in progress</Text>
        </View>
      )}
    </View>
  );
}

// ─── Participant Row ──────────────────────────────────────────────────────────

type ParticipantRowProps = {
  participant: QuestParticipant;
  variant: 'accepted' | 'applied';
  isLoading: boolean;
  isFull?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};

function ParticipantRow({
  participant,
  variant,
  isLoading,
  isFull,
  onAccept,
  onReject,
}: ParticipantRowProps) {
  return (
    <View style={styles.participantRow}>
      <LayeredAvatar accessories={participant.accessories} size={34} scale={1.4} translateY={2} />
      <Text style={styles.participantName} numberOfLines={1}>
        {participant.displayName || 'Player'}
      </Text>
      <Text style={styles.participantTime}>{formatRelativeTime(participant.created_at)}</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.xp} style={{ marginLeft: 4 }} />
      ) : variant === 'applied' ? (
        <View style={styles.participantActions}>
          <Pressable
            style={({ pressed }) => [
              styles.participantBtn,
              styles.participantBtnAccept,
              (isFull || pressed) && { opacity: 0.5 },
            ]}
            onPress={onAccept}
            disabled={isFull}
          >
            <Ionicons name="checkmark" size={14} color={COLORS.bg} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.participantBtn,
              styles.participantBtnReject,
              pressed && { opacity: 0.5 },
            ]}
            onPress={onReject}
          >
            <Ionicons name="close" size={14} color={COLORS.bg} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.participantBtnSmall, pressed && { opacity: 0.5 }]}
          onPress={onReject}
        >
          <Ionicons name="person-remove-outline" size={14} color={COLORS.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QuestDetails({ navigation, route }: QuestDetailsProps) {
  const quest = route?.params?.quest;

  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [cardExpanded, setCardExpanded] = useState(false);

  const [comments, setComments] = useState<UIComment[]>([]);
  const [participants, setParticipants] = useState<QuestParticipant[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [questData, setQuestData] = useState<any>(quest);

  const [pageLoading, setPageLoading] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [participantLoadingIds, setParticipantLoadingIds] = useState<Set<string>>(new Set());
  const [startQuestLoading, setStartQuestLoading] = useState(false);

  const [actionsVisible, setActionsVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<UIComment | null>(null);
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfilePreview | null>(null);

  // ── Derived values ──────────────────────────────────────────────────────────
  const category = (questData?.category ?? quest?.category ?? 'favor') as FeedCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const title = questData?.title ?? quest?.title ?? 'Need help around campus today';
  const preview = questData?.description ?? quest?.preview ?? '';
  const posterName = quest?.posterName ?? 'Unknown';
  const ago = quest?.ago ?? '';
  const xp = questData?.bonus_xp ?? quest?.xp ?? 0;
  const token = questData?.token_bounty ?? quest?.token ?? 0;
  const maxParticipants: number = questData?.max_participants ?? quest?.max_participants ?? 1;
  const isAutoAccept: boolean = questData?.is_auto_accept ?? true;
  const isGroup = maxParticipants > 1;
  const questStatus: QuestStatus = questData?.status ?? 'open';

  const isPoster = currentUserId != null && currentUserId === questData?.user_id;

  const acceptedParticipants = useMemo(
    () => participants.filter((p) => p.status === 'accepted'),
    [participants],
  );
  const isFull = acceptedParticipants.length >= maxParticipants;

  const myParticipant = useMemo(
    () => (currentUserId ? participants.find((p) => p.user_id === currentUserId) : undefined),
    [participants, currentUserId],
  );
  const myStatus: ParticipantStatus | null = myParticipant?.status ?? null;

  const statusText = questStatus === 'accepted' || questStatus === 'in_progress'
    ? questStatus === 'in_progress' ? 'In Progress' : 'Accepted'
    : 'Open';

  const shouldShowCompactCard =
    questStatus === 'accepted' || questStatus === 'in_progress';

  const fetchParticipants = useCallback(async (questId: string, userId: string | null) => {
    const { data, error } = await supabase
      .from('quest_participants')
      .select(`
        id, quest_id, user_id, status, created_at,
        profiles ( display_name, equipped_accessories )
      `)
      .eq('quest_id', questId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const mapped: QuestParticipant[] = data.map((row: any) => ({
        id: row.id,
        quest_id: row.quest_id,
        user_id: row.user_id,
        status: row.status as ParticipantStatus,
        created_at: row.created_at,
        displayName: row.profiles?.display_name || 'Player',
        accessories: normalizeAccessories(row.profiles?.equipped_accessories),
      }));
      setParticipants(mapped);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let commentSub: any = null;
    let participantSub: any = null;

    const init = async () => {
      setPageLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      if (mounted) setCurrentUserId(uid);

      if (uid) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
        if (mounted && profile) setCurrentUserProfile(profile);
      }

      if (!quest?.id) {
        setPageLoading(false);
        return;
      }

      const { data: qData } = await supabase
        .from('quests')
        .select('*')
        .eq('id', quest.id)
        .single();
      if (mounted && qData) setQuestData(qData);

      const { data: cData } = await supabase
        .from('comments')
        .select(`*, profiles ( display_name, equipped_accessories )`)
        .eq('quest_id', quest.id)
        .order('created_at', { ascending: true });

      if (mounted && cData) {
        setComments(
          cData.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            author: c.user_id === uid ? 'You' : (c.profiles?.display_name || 'Unknown'),
            text: c.content,
            time: formatRelativeTime(c.created_at),
            accessories: normalizeAccessories(c.profiles?.equipped_accessories),
          })),
        );
      }

      await fetchParticipants(quest.id, uid);
      if (mounted) setPageLoading(false);

      commentSub = supabase
        .channel(`comments:quest_id=eq.${quest.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments', filter: `quest_id=eq.${quest.id}` },
          (payload) => {
            if (!mounted) return;
            const newC = payload.new;
            if (newC.user_id === uid) return;
            supabase
              .from('profiles')
              .select('display_name, equipped_accessories')
              .eq('id', newC.user_id)
              .single()
              .then(({ data: pd }) => {
                if (!mounted) return;
                setComments((prev) => [
                  ...prev,
                  {
                    id: newC.id,
                    userId: newC.user_id,
                    author: pd?.display_name || 'Player',
                    text: newC.content,
                    time: formatRelativeTime(newC.created_at),
                    accessories: normalizeAccessories(pd?.equipped_accessories),
                  },
                ]);
              });
          },
        )
        .subscribe();

      participantSub = supabase
        .channel(`quest_participants:quest_id=eq.${quest.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'quest_participants', filter: `quest_id=eq.${quest.id}` },
          () => {
            if (mounted) fetchParticipants(quest.id!, uid);
          },
        )
        .subscribe();
    };

    init();

    return () => {
      mounted = false;
      if (commentSub) supabase.removeChannel(commentSub);
      if (participantSub) supabase.removeChannel(participantSub);
    };
  }, [quest?.id]);

  const handleApply = useCallback(async () => {
    if (!currentUserId || !questData?.id) return;
    setCtaLoading(true);
    try {
      const { error } = await supabase.rpc('apply_for_quest', { p_quest_id: questData.id });
      if (error) throw error;
      await fetchParticipants(questData.id, currentUserId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not apply for this quest.');
    } finally {
      setCtaLoading(false);
    }
  }, [currentUserId, questData?.id, fetchParticipants]);

  const handleDrop = useCallback(async () => {
    if (!myParticipant) return;
    Alert.alert(
      myStatus === 'accepted' ? 'Drop your spot?' : 'Withdraw request?',
      myStatus === 'accepted'
        ? 'You will lose your accepted spot and need to re-apply.'
        : 'Your application will be removed.',
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: myStatus === 'accepted' ? 'Drop Spot' : 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setCtaLoading(true);
            try {
              const { error } = await supabase
                .from('quest_participants')
                .update({ status: 'dropped' })
                .eq('id', myParticipant.id);
              if (error) throw error;
              await fetchParticipants(questData!.id, currentUserId);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to update.');
            } finally {
              setCtaLoading(false);
            }
          },
        },
      ],
    );
  }, [myParticipant, myStatus, questData, currentUserId, fetchParticipants]);

  const setParticipantLoading = (id: string, loading: boolean) => {
    setParticipantLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleAcceptParticipant = useCallback(async (participantId: string) => {
    setParticipantLoading(participantId, true);
    try {
      const { error } = await supabase
        .from('quest_participants')
        .update({ status: 'accepted' })
        .eq('id', participantId);
      if (error) throw error;
      await fetchParticipants(questData!.id, currentUserId);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not accept participant.');
    } finally {
      setParticipantLoading(participantId, false);
    }
  }, [questData, currentUserId, fetchParticipants]);

  const handleRejectParticipant = useCallback(async (participantId: string) => {
    Alert.alert('Remove participant?', 'They will be notified and can re-apply.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setParticipantLoading(participantId, true);
          try {
            const { error } = await supabase
              .from('quest_participants')
              .update({ status: 'rejected' })
              .eq('id', participantId);
            if (error) throw error;
            await fetchParticipants(questData!.id, currentUserId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not remove participant.');
          } finally {
            setParticipantLoading(participantId, false);
          }
        },
      },
    ]);
  }, [questData, currentUserId, fetchParticipants]);

  const handleStartQuest = useCallback(async () => {
    if (!questData?.id) return;
    Alert.alert(
      'Start Quest Now?',
      `This will lock the party (${acceptedParticipants.length} helper${acceptedParticipants.length !== 1 ? 's' : ''}) and notify everyone. You can't undo this.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Start!',
          onPress: async () => {
            setStartQuestLoading(true);
            try {
              const { error } = await supabase.rpc('start_manual_quest', {
                p_quest_id: questData.id,
              });
              if (error) throw error;
              const { data: qData } = await supabase
                .from('quests')
                .select('*')
                .eq('id', questData.id)
                .single();
              if (qData) setQuestData(qData);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not start quest.');
            } finally {
              setStartQuestLoading(false);
            }
          },
        },
      ],
    );
  }, [questData?.id, acceptedParticipants.length]);

  const onSubmitComment = async () => {
    const trimmed = message.trim();
    if (!trimmed || !currentUserId || !questData?.id) return;
    setMessage('');
    const tempId = `temp-${Date.now()}`;
    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        userId: currentUserId,
        author: currentUserProfile?.display_name || 'You',
        text: trimmed,
        time: 'Just now',
        accessories: normalizeAccessories(currentUserProfile?.equipped_accessories),
      },
    ]);
    const { error } = await supabase
      .from('comments')
      .insert([{ quest_id: questData.id, user_id: currentUserId, content: trimmed }]);
    if (error) {
      Alert.alert('Error', 'Failed to post comment.');
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    }
  };

  const openCommentActions = (comment: UIComment) => {
    setSelectedComment(comment);
    setActionsVisible(true);
  };

  const onViewProfile = async () => {
    if (!selectedComment?.userId) return;
    setSelectedProfile({
      id: selectedComment.userId,
      displayName:
        selectedComment.author === 'You'
          ? currentUserProfile?.display_name || 'You'
          : selectedComment.author,
      accessories: selectedComment.accessories,
      major: null,
      graduationYear: null,
      bio: null,
    });
    setActionsVisible(false);
    setProfilePreviewVisible(true);

    const { data: pd } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_accessories, major, graduation_year, bio')
      .eq('id', selectedComment.userId)
      .maybeSingle();

    if (pd) {
      setSelectedProfile({
        id: pd.id,
        displayName: pd.display_name || 'Anonymous',
        accessories: normalizeAccessories(pd.equipped_accessories),
        major: pd.major,
        graduationYear: pd.graduation_year,
        bio: pd.bio,
      });
    }
  };

  const profileSubtitle = selectedProfile
    ? `${selectedProfile.major || 'Undeclared'}${
        selectedProfile.graduationYear
          ? ` · Class of '${selectedProfile.graduationYear.slice(-2)}`
          : ''
      }`
    : '';

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quest Details</Text>
            {isGroup && (
              <View style={styles.headerGroupPill}>
                <Ionicons name="people" size={11} color={COLORS.xp} />
                <Text style={styles.headerGroupText}>GROUP</Text>
              </View>
            )}
          </View>
          <Pressable style={styles.iconButton} onPress={() => setLiked((v) => !v)}>
            <ShareIcon width={22} height={22} />
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? COLORS.heart : COLORS.textSecondary}
            />
          </Pressable>
        </View>

        {pageLoading ? (
          <View style={styles.pageLoader}>
            <ActivityIndicator size="large" color={COLORS.xp} />
          </View>
        ) : (
          <>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {shouldShowCompactCard ? (
                <CompactQuestCard
                  quest={questData || quest}
                  isExpanded={cardExpanded}
                  onToggle={() => setCardExpanded(!cardExpanded)}
                  statusLabel={statusText}
                />
              ) : (
                <View style={[styles.card, isGroup && styles.cardGroup]}>
                  {isGroup && (
                    <View style={[styles.groupStripe, { backgroundColor: COLORS.xp }]} />
                  )}
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
                      <Text style={styles.locationText}>
                        {questData?.location || 'Campus'}
                      </Text>
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

              {!shouldShowCompactCard && (
                <>
                  {isPoster ? (
                    <PosterPanel
                      participants={participants}
                      maxParticipants={maxParticipants}
                      isAutoAccept={isAutoAccept}
                      questStatus={questStatus}
                      loadingIds={participantLoadingIds}
                      startLoading={startQuestLoading}
                      onAcceptParticipant={handleAcceptParticipant}
                      onRejectParticipant={handleRejectParticipant}
                      onStartQuest={handleStartQuest}
                    />
                  ) : (
                    <ApplicantCTA
                      isAutoAccept={isAutoAccept}
                      myStatus={myStatus}
                      acceptedCount={acceptedParticipants.length}
                      maxParticipants={maxParticipants}
                      isFull={isFull}
                      loading={ctaLoading}
                      onApply={handleApply}
                      onDrop={handleDrop}
                    />
                  )}
                </>
              )}

              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <View style={styles.countChip}>
                  <Text style={styles.countText}>{comments.length}</Text>
                </View>
              </View>

              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <Pressable
                    style={styles.commentAvatarWrap}
                    onPress={() => openCommentActions(comment)}
                    hitSlop={8}
                  >
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
              ))}

              <View style={{ height: 16 }} />
            </ScrollView>

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
          </>
        )}
      </View>

      <Modal visible={actionsVisible} animationType="fade" transparent onRequestClose={() => setActionsVisible(false)}>
        <Pressable style={styles.actionBackdrop} onPress={() => setActionsVisible(false)}>
          <Pressable style={styles.actionBubble}>
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

      <Modal visible={profilePreviewVisible} animationType="slide" transparent onRequestClose={() => setProfilePreviewVisible(false)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setProfilePreviewVisible(false)}>
          <Pressable style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Profile</Text>
              <Pressable onPress={() => setProfilePreviewVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.previewIdentityRow}>
              <View style={styles.previewAvatarFrame}>
                <LayeredAvatar
                  accessories={selectedProfile?.accessories}
                  size={68}
                  scale={1.55}
                  translateY={4}
                />
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
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  pageLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FONTS.body,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  headerGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: withOpacity(COLORS.xp, 0.14),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.xp, 0.3),
  },
  headerGroupText: {
    fontSize: 8,
    fontFamily: FONTS.display,
    color: COLORS.xp,
    letterSpacing: 0.3,
  },
  scroll: { flex: 1 },
  card: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  cardGroup: {
    borderColor: withOpacity(COLORS.xp, 0.35),
  },
  groupStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.body },
  statusPill: {
    borderRadius: 999,
    backgroundColor: withOpacity(COLORS.item, 0.15),
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: COLORS.item, fontSize: 12, fontWeight: '600', fontFamily: FONTS.body },
  title: { color: COLORS.textPrimary, fontSize: 21, fontWeight: '700', fontFamily: FONTS.body },
  preview: { color: COLORS.textSecondary, lineHeight: 21, fontSize: 14, fontFamily: FONTS.body },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  poster: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', fontFamily: FONTS.body },
  time: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.body },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.body },
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
  rewardBlock: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 72, backgroundColor: COLORS.border },
  rewardValue: { color: COLORS.xp, fontSize: 20, fontWeight: '700', fontFamily: FONTS.mono },
  tokenValue: { color: COLORS.token },
  rewardLabel: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 0.6, fontFamily: FONTS.body },
  slotDotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  slotDot: { width: 8, height: 8, borderRadius: 4 },
  slotDotOverflow: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.body },
  ctaContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaPrimary: { backgroundColor: COLORS.favor },
  ctaSecondary: {
    backgroundColor: withOpacity(COLORS.xp, 0.12),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.xp, 0.4),
  },
  ctaPending: {
    backgroundColor: withOpacity(COLORS.token, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.token, 0.35),
  },
  ctaAccepted: {
    backgroundColor: withOpacity(COLORS.item, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.item, 0.35),
  },
  ctaDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaPressed: { opacity: 0.8 },
  ctaLoading: { opacity: 0.7 },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.bg,
    fontFamily: FONTS.body,
  },
  ctaTextAlt: { color: COLORS.xp },
  ctaTextDisabled: { color: COLORS.textSecondary, fontSize: 15, fontFamily: FONTS.body, fontWeight: '600' },
  ctaHint: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  ctaDrop: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ctaDropText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
    fontFamily: FONTS.body,
  },
  posterPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: withOpacity(COLORS.xp, 0.28),
    backgroundColor: withOpacity(COLORS.xp, 0.05),
    padding: 14,
    gap: 12,
  },
  posterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  posterPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  posterPanelTitle: {
    fontSize: 9,
    fontFamily: FONTS.display,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  posterPanelSlotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  posterPanelSlotText: {
    fontSize: 12,
    fontFamily: FONTS.mono,
    color: COLORS.xp,
    fontWeight: '700',
  },
  posterSlotRow: {
    paddingVertical: 4,
  },
  posterSection: { gap: 8 },
  posterSectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.body,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  posterEmptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  posterEmptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  posterDivider: {
    height: 1,
    backgroundColor: withOpacity(COLORS.xp, 0.18),
    marginVertical: 4,
  },
  startQuestBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.xp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startQuestText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.bg,
    fontFamily: FONTS.body,
  },
  startQuestHint: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  inProgressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: withOpacity(COLORS.item, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(COLORS.item, 0.3),
  },
  inProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.item,
    fontFamily: FONTS.body,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  participantName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  participantTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  participantActions: { flexDirection: 'row', gap: 6 },
  participantBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantBtnAccept: { backgroundColor: COLORS.item },
  participantBtnReject: { backgroundColor: COLORS.error },
  participantBtnSmall: {
    padding: 6,
  },
  commentsHeader: {
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', fontFamily: FONTS.body },
  countChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', fontFamily: FONTS.body },
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
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: { flex: 1, gap: 2 },
  commentAuthor: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', fontFamily: FONTS.body },
  commentTime: { color: COLORS.textSecondary, fontSize: 11, fontFamily: FONTS.body },
  commentText: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body },
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
    fontFamily: FONTS.body,
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
  actionText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', fontFamily: FONTS.body },
  actionTextDisabled: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500', fontFamily: FONTS.body },
  actionDivider: { height: 1, backgroundColor: COLORS.border },
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
  previewTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', fontFamily: FONTS.body },
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
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewIdentityText: { flex: 1, gap: 6, justifyContent: 'center' },
  previewName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', fontFamily: FONTS.body },
  previewSubtitle: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.body },
  previewBio: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 18, fontFamily: FONTS.body },
});