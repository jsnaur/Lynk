import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav, { MainTab } from '../../components/BottomNav';
import QuestCardSkeleton from '../../components/cards/QuestCardSkeleton';
import ThumbUpIcon from '../../../assets/RatingsAssets/ThumbUp.svg';
import QuestResolutionSheetModal from './QuestResolutionScreen';
import { useTokenBalance } from '../../contexts/TokenContext';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

type QuestStatus = 'Awaiting approval' | 'In progress' | 'Pending resolution' | 'Resolved';

type QuestItem = {
  id: string; title: string; role: string; status: QuestStatus; timeLabel?: string; historyTag?: 'Posted' | 'Accepted'; accent: string; statusColor: string; cardTint: string; isActionable?: boolean; xp?: number; token?: number; acceptorName?: string;
};

type HistoryFilter = 'All' | 'Posted' | 'Accepted';
type QuestScreenProps = { navigation?: any; onTabPress?: (tab: MainTab) => void; };

function timeAgo(dateString: string) {
  const diffMins = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
  if (diffMins < 60) return `${diffMins || 1}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

const HISTORY_FILTERS: HistoryFilter[] = ['All', 'Posted', 'Accepted'];

function QuestCard({ item, onPress, onResolve, variant = 'active' }: { item: QuestItem; onPress?: () => void; onResolve?: () => void; variant?: 'active' | 'history'; }) {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: item.isActionable ? 'rgba(57,255,20,0.38)' : colors.border, backgroundColor: item.cardTint },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: item.accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.textColumn}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {variant === 'history' ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              <Text style={styles.metaRole}>{item.role}</Text><Text style={styles.metaSeparator}> • </Text><Text style={styles.metaRole}>{item.timeLabel}</Text>
            </Text>
          ) : (
            <Text style={styles.metaLine} numberOfLines={1}>
              <Text style={styles.metaRole}>{item.role}</Text><Text style={styles.metaSeparator}> • </Text><Text style={[styles.metaStatus, { color: item.statusColor }]}>{item.status}</Text>
            </Text>
          )}
        </View>
        <View style={styles.actionCluster}>
          {variant === 'history' ? (
            <>
              <View style={styles.rewardPill}><Text style={styles.rewardPillText}>{item.xp} XP</Text></View>
              <View style={styles.rewardPillToken}><Text style={styles.rewardPillTokenText}>{item.token} TK</Text></View>
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
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const [activeSection, setActiveSection] = useState<'Active' | 'History'>('Active');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('All');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [activeQuests, setActiveQuests] = useState<QuestItem[]>([]);
  const [historyQuests, setHistoryQuests] = useState<QuestItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mainQuests } = await supabase.from('quests').select(`*, acceptor:profiles!quests_accepted_by_fkey(display_name, first_name), participants:quest_participants(user_id, status)`).or(`user_id.eq.${user.id},accepted_by.eq.${user.id}`).order('created_at', { ascending: false });
      const { data: partData } = await supabase.from('quest_participants').select('quest_id').eq('user_id', user.id).in('status', ['accepted', 'completed', 'failed', 'resolved']);

      const partQuestIds = partData?.map((p) => p.quest_id) || [];
      let extraQuests: any[] = [];
      if (partQuestIds.length > 0) {
        const existingIds = mainQuests?.map((q) => q.id) || [];
        const missingIds = partQuestIds.filter((id) => !existingIds.includes(id));
        if (missingIds.length > 0) {
          const { data: extra } = await supabase.from('quests').select(`*, acceptor:profiles!quests_accepted_by_fkey(display_name, first_name), participants:quest_participants(user_id, status)`).in('id', missingIds);
          if (extra) extraQuests = extra;
        }
      }

      const allData = [...(mainQuests || []), ...extraQuests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const activeList: QuestItem[] = [];
      const historyList: QuestItem[] = [];
      const seenIds = new Set();

      allData.forEach((q) => {
        if (seenIds.has(q.id)) return;
        seenIds.add(q.id);

        const isPoster = q.user_id === user.id;
        const isAccepter = q.accepted_by === user.id || (q.participants?.find((p: any) => p.user_id === user.id) && ['accepted', 'completed', 'failed', 'resolved'].includes(q.participants.find((p: any) => p.user_id === user.id).status));
        const isResolved = q.status === 'completed' || q.status === 'resolved';
        const hasAcceptedParticipants = q.accepted_by || (q.participants?.some((p: any) => p.status === 'accepted'));
        
        const acceptorObj = Array.isArray(q.acceptor) ? q.acceptor[0] : q.acceptor;
        const fetchedAcceptorName = acceptorObj?.display_name || acceptorObj?.first_name || 'your quest partner';

        let role = ''; let statusLabel = ''; let statusColor: string = colors.textSecondary; let isActionable = false; let historyTag: 'Posted' | 'Accepted' | undefined; let cardTint = theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
        
        let accent: string = colors.textSecondary;
        if (q.category === 'favor') accent = colors.favor;
        if (q.category === 'study') accent = colors.study;
        if (q.category === 'item') accent = colors.item;

        if (isResolved) {
          role = isPoster ? 'Requester' : 'Accepter'; statusLabel = 'Resolved'; historyTag = isPoster ? 'Posted' : 'Accepted';
          if (isPoster || isAccepter) historyList.push({ id: q.id, title: q.title, role, status: statusLabel as QuestStatus, timeLabel: timeAgo(q.created_at), historyTag, accent, statusColor, cardTint, xp: q.bonus_xp || 0, token: q.token_bounty || 0, acceptorName: fetchedAcceptorName });
        } else {
          if (isPoster) {
            role = 'You posted';
            if (hasAcceptedParticipants) { statusLabel = 'In progress'; statusColor = colors.item; cardTint = 'rgba(57,255,20,0.08)'; isActionable = true; }
            else { statusLabel = 'Awaiting approval'; }
          } else if (isAccepter) {
            role = 'You accepted'; statusLabel = 'In progress'; statusColor = colors.xp; cardTint = 'rgba(192,132,252,0.08)'; isActionable = false;
          }
          if (!role) return;
          activeList.push({ id: q.id, title: q.title, role, status: statusLabel as QuestStatus, accent, statusColor, cardTint, isActionable, xp: q.bonus_xp || 0, token: q.token_bounty || 0, acceptorName: fetchedAcceptorName });
        }
      });
      setActiveQuests(activeList); setHistoryQuests(historyList);
    } catch (err) { console.error(err); }
    finally { setIsInitialLoading(false); }
  }, [colors, theme]);

  useEffect(() => {
    fetchQuests();
    const unsubscribe = navigation?.addListener('focus', () => fetchQuests());
    return unsubscribe;
  }, [fetchQuests, navigation]);

  const quests = useMemo(() => (activeSection === 'Active' ? activeQuests : historyQuests), [activeSection, activeQuests, historyQuests]);
  const filteredHistoryQuests = useMemo(() => (activeSection !== 'History' || historyFilter === 'All' ? quests : quests.filter((q) => q.historyTag === historyFilter)), [activeSection, historyFilter, quests]);
  const selectedQuest = useMemo(() => activeQuests.find((q) => q.id === selectedQuestId), [activeQuests, selectedQuestId]);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: activeSection === 'History' ? 1 : 0, duration: 240, useNativeDriver: true }).start();
  }, [activeSection, slideAnim]);

  return (
    <View style={styles.root}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}><Text style={styles.title}>My Quests</Text></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={async () => { setIsRefreshing(true); await fetchQuests(); setIsRefreshing(false); }} tintColor={colors.item} />}>
          <View style={styles.segmentedControl} onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}>
            {segmentWidth > 0 && <Animated.View pointerEvents="none" style={[styles.segmentIndicator, { width: (segmentWidth - 12) / 2, transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (segmentWidth - 12) / 2 + 4] }) }] }]} />}
            {(['Active', 'History'] as const).map((label) => (
              <Pressable key={label} onPress={() => setActiveSection(label)} style={({ pressed }) => [styles.segment, pressed && styles.segmentPressed]}>
                <Text style={[styles.segmentText, activeSection === label && styles.segmentTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            {activeSection === 'History' ? <Text style={styles.sectionTitle}>Filter</Text> : <><Text style={styles.sectionTitle}>{activeSection} Quests</Text><View style={styles.countBadge}><Text style={styles.countText}>{quests.length}</Text></View></>}
          </View>

          {activeSection === 'History' && (
            <View style={styles.filterRow}>
              {HISTORY_FILTERS.map((filter) => (
                <Pressable key={filter} onPress={() => setHistoryFilter(filter)} style={({ pressed }) => [styles.filterChip, historyFilter === filter && styles.filterChipSelected, pressed && styles.filterChipPressed]}>
                  <Text style={[styles.filterChipText, historyFilter === filter && styles.filterChipTextSelected]}>{filter}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.list}>
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, index) => <QuestCardSkeleton key={`quest-skeleton-${index}`} />)
            ) : (
              filteredHistoryQuests.map((q) => (
                <QuestCard key={q.id} item={q} variant={activeSection === 'History' ? 'history' : 'active'}
                  onPress={() => { if (activeSection === 'Active') navigation?.navigate?.('QuestDetail', { quest: { id: q.id, category: q.accent === colors.favor ? 'favor' : q.accent === colors.study ? 'study' : 'item', title: q.title, preview: `${q.role} · ${q.status}`, posterName: 'You', ago: 'now', xp: q.xp || 80, token: q.token || 15 }}); }}
                  onResolve={q.isActionable ? () => { setSelectedQuestId(q.id); setResolutionModalVisible(true); } : undefined}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeTab="Quests" onTabPress={onTabPress} />
      <QuestResolutionSheetModal visible={resolutionModalVisible} onClose={() => setResolutionModalVisible(false)} questId={selectedQuest?.id || ''} questTitle={selectedQuest?.title || ''} acceptorName={selectedQuest?.acceptorName || 'your quest partner'} tokenReward={selectedQuest?.token ?? 0} xpReward={selectedQuest?.xp ?? 0} onComplete={async () => { await fetchQuests(); setResolutionModalVisible(false); }} />
    </View>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  header: { height: 68, paddingHorizontal: 20, justifyContent: 'flex-end', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: FONTS.display, color: colors.textPrimary, fontSize: 20, lineHeight: 34, fontWeight: '700', letterSpacing: 0.2 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 112 },
  segmentedControl: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4, gap: 4, position: 'relative' },
  segmentIndicator: { position: 'absolute', top: 4, left: 4, height: 38, borderRadius: 10, backgroundColor: theme === 'dark' ? colors.border : '#FFFFFF', elevation: theme === 'light' ? 2 : 0, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  segment: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  segmentPressed: { opacity: 0.88 },
  segmentText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  segmentTextSelected: { color: colors.textPrimary },
  sectionHeaderRow: { marginTop: 34, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  countBadge: { minWidth: 24, height: 24, paddingHorizontal: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(57,255,20,0.18)', borderWidth: 1, borderColor: colors.item },
  countText: { color: colors.item, fontSize: 12, lineHeight: 12, fontWeight: '700' },
  list: { gap: 12 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  filterChip: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(138,138,154,0.35)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.01)' },
  filterChipSelected: { borderColor: colors.favor, backgroundColor: 'rgba(0,245,255,0.12)' },
  filterChipPressed: { opacity: 0.9 },
  filterChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterChipTextSelected: { color: colors.favor },
  card: { minHeight: 80, borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.997 }] },
  stripe: { width: 3 },
  cardBody: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  textColumn: { flex: 1, gap: 6 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 19, fontWeight: '700' },
  metaLine: { color: colors.textSecondary, fontSize: 12, lineHeight: 15, fontWeight: '500' },
  metaRole: { color: colors.textSecondary },
  metaSeparator: { color: 'rgba(138,138,154,0.65)' },
  metaStatus: { fontWeight: '500' },
  actionCluster: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rewardPill: { height: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(192,132,252,0.4)', backgroundColor: 'rgba(192,132,252,0.12)', alignItems: 'center', justifyContent: 'center' },
  rewardPillText: { color: colors.xp, fontSize: 12, lineHeight: 14, fontWeight: '700' },
  rewardPillToken: { height: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  rewardPillTokenText: { color: colors.token, fontSize: 12, lineHeight: 14, fontWeight: '700' },
  resolveButton: { minHeight: 28, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.item, alignItems: 'center', justifyContent: 'center' },
  resolveButtonPressed: { opacity: 0.85 },
  resolveText: { color: '#1A1A1F', fontSize: 12, lineHeight: 14, fontWeight: '800' },
});