import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav, { MainTab } from '../../components/BottomNav';
import { COLORS } from '../../constants/colors';
import ThumbUpIcon from '../../../assets/RatingsAssets/ThumbUp.svg';
import QuestResolutionSheetModal from './QuestResolutionScreen';
import { useTokenBalance } from '../../contexts/TokenContext';
import { supabase } from '../../lib/supabase';

type QuestStatus = 'Awaiting approval' | 'In progress' | 'Pending resolution' | 'Resolved';

type QuestItem = {
  id: string;
  title: string;
  role: string;
  status: QuestStatus;
  timeLabel?: string;
  historyTag?: 'Posted' | 'Accepted';
  accent: string;
  statusColor: string;
  cardTint: string;
  isActionable?: boolean;
  xp?: number;
  token?: number;
  acceptorName?: string;
};

type HistoryFilter = 'All' | 'Posted' | 'Accepted';

type QuestScreenProps = {
  navigation?: any;
  onTabPress?: (tab: MainTab) => void;
};

// Helper to format timestamps
function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins || 1}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const HISTORY_FILTERS: HistoryFilter[] = ['All', 'Posted', 'Accepted'];

function QuestCard({
  item,
  onPress,
  onResolve,
  variant = 'active',
}: {
  item: QuestItem;
  onPress?: () => void;
  onResolve?: () => void;
  variant?: 'active' | 'history';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: item.isActionable ? 'rgba(57,255,20,0.38)' : COLORS.border, backgroundColor: item.cardTint },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: item.accent }]} />

      <View style={styles.cardBody}>
        <View style={styles.textColumn}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {variant === 'history' ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              <Text style={styles.metaRole}>{item.role}</Text>
              <Text style={styles.metaSeparator}> • </Text>
              <Text style={styles.metaRole}>{item.timeLabel}</Text>
            </Text>
          ) : (
            <Text style={styles.metaLine} numberOfLines={1}>
              <Text style={styles.metaRole}>{item.role}</Text>
              <Text style={styles.metaSeparator}> • </Text>
              <Text style={[styles.metaStatus, { color: item.statusColor }]}>{item.status}</Text>
            </Text>
          )}
        </View>

        <View style={styles.actionCluster}>
          {variant === 'history' ? (
            <>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText}>
                  {item.xp} XP
                </Text>
              </View>
              <View style={styles.rewardPillToken}>
                <Text style={styles.rewardPillTokenText}>
                  {item.token} TK
                </Text>
              </View>
              <ThumbUpIcon width={18} height={17} />
            </>
          ) : item.isActionable && onResolve ? (
            <Pressable onPress={onResolve} style={({ pressed }) => [styles.resolveButton, pressed && styles.resolveButtonPressed]}>
              <Text style={styles.resolveText}>Resolve</Text>
            </Pressable>
          ) : null}

          <Ionicons name="chevron-forward" size={18} color="rgba(138,138,154,0.52)" />
        </View>
      </View>
    </Pressable>
  );
}

export default function QuestScreen({ navigation, onTabPress }: QuestScreenProps) {
  const { earnTokens } = useTokenBalance();
  const [activeSection, setActiveSection] = useState<'Active' | 'History'>('Active');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('All');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Dynamic state
  const [activeQuests, setActiveQuests] = useState<QuestItem[]>([]);
  const [historyQuests, setHistoryQuests] = useState<QuestItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Join with profiles to get the acceptor's details
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          acceptor:profiles!quests_accepted_by_fkey(display_name, first_name)
        `)
        .or(`user_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quests:', error);
        return;
      }

      const activeList: QuestItem[] = [];
      const historyList: QuestItem[] = [];

      data?.forEach((q) => {
        const isPoster = q.user_id === user.id;
        const isAccepter = q.accepted_by === user.id;
        const isResolved = q.status === 'completed' || q.status === 'resolved';

        // Extract acceptor's name safely
        const acceptorObj = Array.isArray(q.acceptor) ? q.acceptor[0] : q.acceptor;
        const fetchedAcceptorName = acceptorObj?.display_name || acceptorObj?.first_name || 'your quest partner';

        let role = '';
        let statusLabel = '';
        let statusColor: string = COLORS.textSecondary;
        let isActionable = false;
        let historyTag: 'Posted' | 'Accepted' | undefined;
        let cardTint = 'rgba(255,255,255,0.02)';

        // Map Category Colors
        let accent: string = COLORS.textSecondary;
        if (q.category === 'favor') accent = COLORS.favor || '#00F5FF';
        if (q.category === 'study') accent = COLORS.study || '#FF2D78';
        if (q.category === 'item') accent = COLORS.item || '#39FF14';

        if (isResolved) {
          role = isPoster ? 'Requester' : 'Accepter';
          statusLabel = 'Resolved';
          historyTag = isPoster ? 'Posted' : 'Accepted';

          historyList.push({
            id: q.id,
            title: q.title,
            role,
            status: statusLabel as QuestStatus,
            timeLabel: timeAgo(q.created_at),
            historyTag,
            accent,
            statusColor,
            cardTint,
            xp: q.bonus_xp || 0,
            token: q.token_bounty || 0,
            acceptorName: fetchedAcceptorName,
          });
        } else {
          if (isPoster && !q.accepted_by) {
            role = 'You posted';
            statusLabel = 'Awaiting approval';
          } else if (isAccepter) {
            role = 'You accepted';
            statusLabel = 'In progress';
            statusColor = COLORS.xp || '#C084FC'; // Purple
          } else if (isPoster && q.accepted_by) {
            role = 'You posted';
            statusLabel = 'Pending resolution';
            statusColor = COLORS.item || '#39FF14'; // Green
            cardTint = 'rgba(57,255,20,0.08)';
            isActionable = true;
          }

          // Edge case safety (e.g. malformed data)
          if (!role) return;

          activeList.push({
            id: q.id,
            title: q.title,
            role,
            status: statusLabel as QuestStatus,
            accent,
            statusColor,
            cardTint,
            isActionable,
            xp: q.bonus_xp || 0,
            token: q.token_bounty || 0,
            acceptorName: fetchedAcceptorName,
          });
        }
      });

      setActiveQuests(activeList);
      setHistoryQuests(historyList);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchQuests();
    // Refetch when tab comes into focus
    const unsubscribe = navigation?.addListener('focus', () => {
      fetchQuests();
    });
    return unsubscribe;
  }, [fetchQuests, navigation]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchQuests();
    setIsRefreshing(false);
  };

  const selectedQuest = useMemo(
    () => activeQuests.find((quest) => quest.id === selectedQuestId),
    [activeQuests, selectedQuestId],
  );

  useEffect(() => {
    const nextIndex = activeSection === 'History' ? 1 : 0;
    Animated.timing(slideAnim, {
      toValue: nextIndex,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [activeSection, slideAnim]);

  const quests = useMemo(
    () => (activeSection === 'Active' ? activeQuests : historyQuests),
    [activeSection, activeQuests, historyQuests],
  );

  const filteredHistoryQuests = useMemo(() => {
    if (activeSection !== 'History' || historyFilter === 'All') {
      return quests;
    }
    return quests.filter((quest) => quest.historyTag === historyFilter);
  }, [activeSection, historyFilter, quests]);

  const handleResolveComplete = async () => {
    if (!selectedQuestId) return;
    
    // The resolve_quest RPC already handled the database update and rewards safely.
    // We only need to refresh the local list here.
    await fetchQuests();
    setResolutionModalVisible(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Quests</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.item}
            />
          }
        >
          <View
            style={styles.segmentedControl}
            onLayout={(event) => {
              setSegmentWidth(event.nativeEvent.layout.width);
            }}
          >
            {segmentWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentIndicator,
                  {
                    width: (segmentWidth - 12) / 2,
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (segmentWidth - 12) / 2 + 4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : null}

            {(['Active', 'History'] as const).map((label) => {
              const selected = activeSection === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => setActiveSection(label)}
                  style={({ pressed }) => [
                    styles.segment,
                    pressed && styles.segmentPressed,
                  ]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeaderRow}>
            {activeSection === 'History' ? (
              <Text style={styles.sectionTitle}>Filter</Text>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{activeSection} Quests</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{quests.length}</Text>
                </View>
              </>
            )}
          </View>

          {activeSection === 'History' ? (
            <View style={styles.filterRow}>
              {HISTORY_FILTERS.map((filter) => {
                const selected = historyFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setHistoryFilter(filter)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.list}>
            {filteredHistoryQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                item={quest}
                variant={activeSection === 'History' ? 'history' : 'active'}
                onPress={() => {
                  if (activeSection === 'Active') {
                    navigation?.navigate?.('QuestDetail', {
                      quest: {
                        id: quest.id,
                        category: quest.accent === COLORS.favor ? 'favor' : quest.accent === COLORS.study ? 'study' : 'item',
                        title: quest.title,
                        preview: `${quest.role} · ${quest.status}`,
                        posterName: 'You',
                        ago: 'now',
                        xp: quest.xp || 80,
                        token: quest.token || 15,
                      },
                    });
                  }
                }}
                onResolve={
                  quest.isActionable
                    ? () => {
                        setSelectedQuestId(quest.id);
                        setResolutionModalVisible(true);
                      }
                    : undefined
                }
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeTab="Quests" onTabPress={onTabPress} />

      <QuestResolutionSheetModal
        visible={resolutionModalVisible}
        onClose={() => setResolutionModalVisible(false)}
        questId={selectedQuest?.id || ''}
        questTitle={selectedQuest?.title || ''}
        acceptorName={selectedQuest?.acceptorName || 'your quest partner'}
        tokenReward={selectedQuest?.token ?? 0}
        xpReward={selectedQuest?.xp ?? 0}
        onComplete={handleResolveComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 68,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 112,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentPressed: {
    opacity: 0.88,
  },
  segmentText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: COLORS.textPrimary,
  },
  sectionHeaderRow: {
    marginTop: 34,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(57,255,20,0.18)',
    borderWidth: 1,
    borderColor: COLORS.item,
  },
  countText: {
    color: COLORS.item,
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  filterChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(138,138,154,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  filterChipSelected: {
    borderColor: COLORS.favor,
    backgroundColor: 'rgba(0,245,255,0.12)',
  },
  filterChipPressed: {
    opacity: 0.9,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: COLORS.favor,
  },
  card: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.997 }],
  },
  stripe: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textColumn: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },
  metaLine: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
  metaRole: {
    color: COLORS.textSecondary,
  },
  metaSeparator: {
    color: 'rgba(138,138,154,0.65)',
  },
  metaStatus: {
    fontWeight: '500',
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardPill: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.4)',
    backgroundColor: 'rgba(192,132,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardPillText: {
    color: COLORS.xp,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  rewardPillToken: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardPillTokenText: {
    color: COLORS.token,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  resolveButton: {
    minHeight: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.item,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveButtonPressed: {
    opacity: 0.85,
  },
  resolveText: {
    color: COLORS.bg,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
});