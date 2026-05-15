import { StatusBar } from 'expo-status-bar';
import {
    Animated,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { darkColors, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { createFadeSlideStyle, createMotionValues, createStaggeredEntrance } from '../../navigation/navigationMotion';
import { getBadgeById } from '../../constants/badges';

// ─── Types ───────────────────────────────────────────────────────────────────

type ThemeColors = Record<keyof typeof darkColors, string>;

type LeaderboardEntry = {
    id: string;
    display_name: string | null;
    total_xp: number;
    completed_quests: number;
    level: number;
    equipped_accessories: Record<string, string> | null;
    rank: number;
};

type UserRankData = {
    rank: number;
    total_xp: number;
    display_name: string | null;
    equipped_accessories: Record<string, string> | null;
};

type LeaderboardMetric = 'quest' | 'xp';

type ProfilePreview = {
    id: string;
    displayName: string;
    accessories?: Partial<Record<AvatarSlot, string>>;
    major?: string | null;
    graduationYear?: string | null;
    bio?: string | null;
    level: number;
    totalXP: number;
    completedQuests: number;
    rank: number;
    badges?: string[];
    reputation?: string;
};

type Props = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any;
};

// ─── Avatar Helpers ──────────────────────────────────────────────────────────

const DEFAULT_AVATAR_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
    Body: 'body-masc-a',
    HairBase: 'hairb-flat-m',
    HairFringe: 'hairf-chill-m',
    Eyes: 'eyes-default',
    Mouth: 'mouth-neutral',
    Top: 'top-cit-m',
    Bottom: 'bot-cit-m',
};

function normalizeAccessories(value: unknown): Partial<Record<AvatarSlot, string>> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Partial<Record<AvatarSlot, string>>;
    }
    return DEFAULT_AVATAR_ACCESSORIES;
}

function getAccessoryById(accessoryId?: string | null) {
    if (!accessoryId) return undefined;
    return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

function LayeredAvatar({
    accessories,
    size,
    scale = 1.45,
    translateY = 3,
}: {
    accessories?: Partial<Record<AvatarSlot, string>>;
    size: number;
    scale?: number;
    translateY?: number;
}) {
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
                const accessoryId = safeAccessories[slot];
                if (!accessoryId) return null;
                const accessory = getAccessoryById(accessoryId);
                if (!accessory) return null;
                const Sprite = accessory.Sprite;
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

// ─── Constants & Utils ────────────────────────────────────────────────────────

const MEDALS = [
    { rank: 1, label: '1ST', color: '#FFD700', bg: 'rgba(255,215,0,0.10)', border: 'rgba(255,215,0,0.45)', avatarSize: 76, crownSize: 22, podiumHeight: 110, crown: '♛' },
    { rank: 2, label: '2ND', color: '#C0C0C0', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.35)', avatarSize: 60, crownSize: 18, podiumHeight: 82, crown: '♛' },
    { rank: 3, label: '3RD', color: '#CD7F32', bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.35)', avatarSize: 60, crownSize: 18, podiumHeight: 68, crown: '♛' },
];

function fmtXP(xp: number): string {
    if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
    if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
    return String(xp);
}

const XP_THRESHOLDS = [0, 200, 400, 600, 800, 1000, 1500, 2500, 3000, 50000];

const REPUTATION_TITLES: Record<number, string> = {
    1: 'Cub',
    2: 'Stray',
    3: 'Prowler',
    4: 'Hunter',
    5: 'Wildcat',
    6: 'Alpha',
    7: 'Pack Leader',
    8: 'Apex',
    9: 'Teknoy Sidekick',
    10: 'Lynk Master',
};

function getReputationTitle(level: number): string {
    const clamped = Math.max(1, Math.min(10, level));
    return REPUTATION_TITLES[clamped];
}

function calculateLevelFromXP(totalXP: number): number {
    let currentLevel = 1;
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
        if (totalXP >= XP_THRESHOLDS[i]) currentLevel = i + 1;
        else break;
    }
    return currentLevel;
}

function calculateLevelProgressFromXP(totalXP: number) {
    const currentLevel = calculateLevelFromXP(totalXP);
    const currentThreshold = XP_THRESHOLDS[currentLevel - 1] || 0;
    const nextThreshold = XP_THRESHOLDS[currentLevel] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 5000;
    const xpInCurrentLevel = totalXP - currentThreshold;
    const xpNeededForNextLevel = nextThreshold - currentThreshold;
    const progressPercent = Math.min(1, Math.max(0, xpInCurrentLevel / xpNeededForNextLevel));
    return { currentLevel, xpInCurrentLevel, xpNeededForNextLevel, progressPercent };
}

const PROFILE_BADGE_ASSETS = {
    experience: require("../../../assets/ProfileAssets/Star_Icon.png"),
};

// ─── Components ───────────────────────────────────────────────────────────────

function LoadingDots() {
    const { colors } = useTheme();
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bounce = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: -8, duration: 280, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
                    Animated.delay(500),
                ])
            );
        Animated.parallel([bounce(dot1, 0), bounce(dot2, 150), bounce(dot3, 300)]).start();
    }, []);

    return (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View key={i} style={[{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.favor }, { transform: [{ translateY: dot }] }]} />
            ))}
        </View>
    );
}


function PodiumCard({
    entry,
    medal,
    animValue,
    metric,
    onPress,
}: {
    entry: LeaderboardEntry | null;
    medal: (typeof MEDALS)[0];
    animValue: Animated.Value;
    metric: LeaderboardMetric;
    onPress: (entry: LeaderboardEntry) => void;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const translateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
    const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const metricValue = metric === 'xp' 
        ? `${entry ? fmtXP(entry.total_xp) : '—'} XP` 
        : `${entry?.completed_quests ?? 0} Quests`;

    return (
        <Animated.View
            style={[
                styles.podiumCard,
                {
                    backgroundColor: medal.bg,
                    borderColor: medal.border,
                    opacity,
                    transform: [{ translateY }],
                    flex: medal.rank === 1 ? 1.1 : 1,
                    alignSelf: 'flex-end',
                },
            ]}
        >
            <Pressable onPress={() => entry && onPress(entry)} style={styles.podiumPressable} disabled={!entry}>
                <Text style={[styles.crown, { color: medal.color, fontSize: medal.crownSize }]}>{medal.crown}</Text>
                
                <View style={[styles.podiumAvatarWrap, { width: medal.avatarSize + 8, height: medal.avatarSize + 8, borderRadius: (medal.avatarSize + 8) / 2, borderColor: medal.color, shadowColor: medal.color }]}>
                    <LayeredAvatar accessories={normalizeAccessories(entry?.equipped_accessories)} size={medal.avatarSize} scale={1.5} translateY={4} />
                </View>

                <View style={[styles.rankPill, { backgroundColor: medal.color }]}>
                    <Text style={styles.rankPillText}>{medal.label}</Text>
                </View>

                <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={1}>{entry?.display_name ?? '—'}</Text>
                <Text style={[styles.podiumXP, { color: medal.color }]}>{metricValue}</Text>

                <View style={[styles.podiumBase, { height: medal.podiumHeight, backgroundColor: medal.color + '22', borderTopColor: medal.color + '55' }]}>
                    <Text style={[styles.podiumBaseNumber, { color: medal.color }]}>{medal.rank}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

function LeaderboardRow({
    item,
    isMe,
    metric,
    onPress,
}: {
    item: LeaderboardEntry;
    isMe: boolean;
    metric: LeaderboardMetric;
    onPress: (entry: LeaderboardEntry) => void;
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const rankColor = item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : item.rank === 3 ? '#CD7F32' : colors.textSecondary;

    return (
        <Pressable style={[styles.listRow, isMe && styles.listRowMe]} onPress={() => onPress(item)}>
            <Text style={[styles.listRank, { color: rankColor }]}>{String(item.rank).padStart(2, '0')}</Text>
            
            <View style={styles.listAvatarWrap}>
                <LayeredAvatar accessories={normalizeAccessories(item.equipped_accessories)} size={38} scale={1.45} translateY={3} />
            </View>

            <Text style={[styles.listName, isMe && { color: colors.favor }]} numberOfLines={1}>{item.display_name ?? 'Anonymous'}</Text>

            <View style={styles.xpChip}>
                <Text style={styles.xpChipText}>{metric === 'xp' ? fmtXP(item.total_xp) : String(item.completed_quests)}</Text>
                <Text style={styles.xpChipUnit}>{metric === 'xp' ? 'XP' : 'QUEST'}</Text>
            </View>
        </Pressable>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen({ onTabPress, navigation }: Props) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const insets = useSafeAreaInsets();

    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRankData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [metric, setMetric] = useState<LeaderboardMetric>('xp');
    
    // Profile Modal State
    const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<ProfilePreview | null>(null);

    // Animations
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;
    // Screen-local motion values
    const screenMotion = useRef(createMotionValues(3)).current; // header, podium, listHeader
    const rowMotionValues = useRef(new Map<string, Animated.Value>()).current;

    function ensureAnimatedValue(map: Map<string, Animated.Value>, key: string, initialValue = 0) {
        const existing = map.get(key);
        if (existing) return existing;
        const next = new Animated.Value(initialValue);
        map.set(key, next);
        return next;
    }

    // Sort logic wrapped in useMemo to prevent unnecessary calculations & ReferenceErrors
    const finalEntries = useMemo(() => {
        const metricSorted = [...entries].sort((a, b) => {
            if (metric === 'xp') {
                return b.total_xp - a.total_xp;
            }
            if (b.completed_quests !== a.completed_quests) {
                return b.completed_quests - a.completed_quests;
            }
            return b.total_xp - a.total_xp;
        });
        return metricSorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    }, [entries, metric]);

    const top3 = useMemo(() => finalEntries.slice(0, 3), [finalEntries]);
    const rest = useMemo(() => finalEntries.slice(3), [finalEntries]);

    const podiumOrder = useMemo(() => [
        { entry: top3[1] ?? null, medal: MEDALS[1], anim: anim2 },
        { entry: top3[0] ?? null, medal: MEDALS[0], anim: anim1 },
        { entry: top3[2] ?? null, medal: MEDALS[2], anim: anim3 },
    ], [top3, anim1, anim2, anim3]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            // Fetch All-Time View
            const { data: allTimeData, error: viewError } = await supabase
                .from('leaderboard')
                .select('id, display_name, total_xp, completed_quests, equipped_accessories, rank')
                .order('rank', { ascending: true })
                .limit(100);

            if (viewError) {
                // FALLBACK: If the leaderboard view doesn't exist, fetch from profiles so the screen isn't empty
                console.warn('Leaderboard view error, falling back to profiles:', viewError);
                const { data: fallbackData } = await supabase
                    .from('profiles')
                    .select('id, display_name, total_xp, equipped_accessories')
                    .order('total_xp', { ascending: false })
                    .limit(100);

                if (fallbackData) {
                    const mappedFallback = fallbackData.map((entry: any, idx: number) => ({
                        ...entry,
                        completed_quests: 0, // Cannot fetch without the view
                        level: calculateLevelFromXP(entry.total_xp),
                        rank: idx + 1,
                    }));
                    setEntries(mappedFallback);
                }
            } else if (allTimeData) {
                const mappedAllTime = allTimeData.map((entry: any) => ({
                    ...entry,
                    completed_quests: Number(entry.completed_quests),
                    level: calculateLevelFromXP(entry.total_xp),
                }));
                setEntries(mappedAllTime);
            }

            // Fetch Current User Rank
            if (user) {
                const { data: rankData, error: rpcError } = await supabase.rpc('get_user_leaderboard_rank', { user_id: user.id });
                if (rankData) setUserRank(rankData as UserRankData);
                if (rpcError) console.warn('RPC rank error:', rpcError);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Animate podium on load/tab switch
    useEffect(() => {
        if (!loading && finalEntries.length > 0) {
            anim1.setValue(0);
            anim2.setValue(0);
            anim3.setValue(0);
            screenMotion.forEach(m => m.setValue(0));
            
            Animated.stagger(120, [
                Animated.spring(anim2, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim1, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim3, { toValue: 1, useNativeDriver: true, damping: 14 }),
            ]).start();
            // Entrance for header/podium/list header
            createStaggeredEntrance(screenMotion, 420, 90).start();

            // Per-row staggered reveal
            const rowAnims = finalEntries.map((r, i) => {
                const v = ensureAnimatedValue(rowMotionValues, r.id, 0);
                v.setValue(0);
                return Animated.timing(v, { toValue: 1, duration: 320, delay: i * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true });
            });
            Animated.stagger(40, rowAnims).start();
        }
    }, [loading, metric, finalEntries, anim1, anim2, anim3, screenMotion, rowMotionValues]);

    const fetchAndSetProfilePreview = async (targetUserId: string) => {
        const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, display_name, equipped_accessories, major, graduation_year, bio, total_xp, equipped_badges')
            .eq('id', targetUserId)
            .maybeSingle();

        if (error || !profileData) return;

        const { data: leaderboardData } = await supabase
            .from('leaderboard')
            .select('total_xp')
            .eq('id', targetUserId)
            .maybeSingle();

        const totalXP = Number(leaderboardData?.total_xp ?? profileData.total_xp ?? 0);
        const levelData = calculateLevelProgressFromXP(totalXP);

        const { count: higherXPCount } = await supabase
            .from('leaderboard')
            .select('id', { count: 'exact', head: true })
            .gt('total_xp', totalXP);
        const rank = (higherXPCount ?? 0) + 1;

        const { data: mainQuests } = await supabase
            .from('quests')
            .select('id, status')
            .or(`user_id.eq.${targetUserId},accepted_by.eq.${targetUserId}`);
        const { data: partData } = await supabase
            .from('quest_participants')
            .select('quest_id')
            .eq('user_id', targetUserId)
            .in('status', ['accepted', 'completed', 'failed', 'resolved']);

        const partQuestIds = partData?.map((p) => p.quest_id) || [];
        let extraQuests: { id: string; status: string }[] = [];
        if (partQuestIds.length > 0) {
            const existingIds = mainQuests?.map((q) => q.id) || [];
            const missingIds = partQuestIds.filter((id) => !existingIds.includes(id));
            if (missingIds.length > 0) {
                const { data: extra } = await supabase.from('quests').select('id, status').in('id', missingIds);
                if (extra) extraQuests = extra;
            }
        }

        const allQuests = [...(mainQuests || []), ...extraQuests];
        const seen = new Set<string>();
        let completedQuests = 0;
        allQuests.forEach((q) => {
            if (seen.has(q.id)) return;
            seen.add(q.id);
            if (q.status === 'completed' || q.status === 'resolved') completedQuests++;
        });

        setSelectedProfile({
            id: profileData.id,
            displayName: profileData.display_name || 'Anonymous',
            accessories: normalizeAccessories(profileData.equipped_accessories),
            major: profileData.major,
            graduationYear: profileData.graduation_year,
            bio: profileData.bio,
            rank,
            totalXP,
            completedQuests,
            badges: Array.isArray(profileData.equipped_badges) ? profileData.equipped_badges : [],
            reputation: getReputationTitle(levelData.currentLevel),
            level: levelData.currentLevel,
        });
    };

    const openProfilePreview = async (entry: LeaderboardEntry) => {
        const initialLevelData = calculateLevelProgressFromXP(entry.total_xp);

        setSelectedProfile({
            id: entry.id,
            displayName: entry.display_name ?? 'Anonymous',
            accessories: normalizeAccessories(entry.equipped_accessories),
            major: null,
            graduationYear: null,
            bio: null,
            level: initialLevelData.currentLevel,
            totalXP: entry.total_xp,
            completedQuests: entry.completed_quests,
            rank: entry.rank,
            badges: [],
            reputation: getReputationTitle(initialLevelData.currentLevel),
        });
        setProfilePreviewVisible(true);

        await fetchAndSetProfilePreview(entry.id);
    };

    const profileSubtitle = selectedProfile
        ? `${selectedProfile.major || 'Undeclared'}${selectedProfile.graduationYear ? ` · Class of '${selectedProfile.graduationYear.slice(-2)}` : ''}`
        : '';
    const levelData = calculateLevelProgressFromXP(selectedProfile?.totalXP ?? 0);
    const nextLevel = Math.min(levelData.currentLevel + 1, 10);
    const selectedBadges = selectedProfile?.badges ?? [];

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <Animated.View style={createFadeSlideStyle(screenMotion[0], 12)}>
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => navigation?.goBack?.()} hitSlop={10}>
                            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                            <Text style={styles.backText}>Profile</Text>
                        </Pressable>
                        <View style={styles.headerTitleContainer} pointerEvents="none">
                            <Text style={styles.headerTitle}>RANKINGS</Text>
                        </View>
                    </View>
                </Animated.View>

                <FlatList
                    data={rest}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: (userRank && typeof userRank.rank === 'number' && typeof userRank.total_xp === 'number') ? 80 + insets.bottom : 16 + insets.bottom }}
                    ListHeaderComponent={
                        <>
                            <View style={styles.filterRow}>
                                <View style={styles.segment}>
                                    <Pressable style={[styles.segmentBtn, metric === 'xp' && styles.segmentBtnActive]} onPress={() => setMetric('xp')}>
                                        <Text style={[styles.segmentBtnText, metric === 'xp' && styles.segmentBtnTextActive]}>EXP</Text>
                                    </Pressable>
                                    <Pressable style={[styles.segmentBtn, metric === 'quest' && styles.segmentBtnActive]} onPress={() => setMetric('quest')}>
                                        <Text style={[styles.segmentBtnText, metric === 'quest' && styles.segmentBtnTextActive]}>QUEST</Text>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Podium */}
                            {loading ? (
                                <LoadingDots />
                            ) : finalEntries.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🏆</Text>
                                    <Text style={styles.emptyText}>No rankings yet.</Text>
                                </View>
                            ) : (
                                <Animated.View style={createFadeSlideStyle(screenMotion[1], 14)}>
                                    <View style={styles.podiumContainer}>
                                        {podiumOrder.map(({ entry, medal, anim }) => (
                                            <PodiumCard
                                                key={medal.rank}
                                                entry={entry}
                                                medal={medal}
                                                animValue={anim}
                                                metric={metric}
                                                onPress={openProfilePreview}
                                            />
                                        ))}
                                    </View>
                                </Animated.View>
                            )}

                            {/* List header */}
                            {!loading && rest.length > 0 && (
                                <Animated.View style={createFadeSlideStyle(screenMotion[2], 12)}>
                                    <View style={styles.listHeaderRow}>
                                        <Text style={styles.listHeaderText}>RANK</Text>
                                        <Text style={[styles.listHeaderText, { flex: 1, marginLeft: 50 }]}>PLAYER</Text>
                                        <Text style={styles.listHeaderText}>{metric === 'xp' ? 'XP' : 'QUEST'}</Text>
                                    </View>
                                </Animated.View>
                            )}
                        </>
                    }
                    renderItem={({ item, index }) => {
                        const motion = ensureAnimatedValue(rowMotionValues, item.id, 0);
                        return (
                            <Animated.View key={item.id} style={createFadeSlideStyle(motion, 20)}>
                                <LeaderboardRow
                                    item={item}
                                    isMe={item.id === currentUserId}
                                    metric={metric}
                                    onPress={openProfilePreview}
                                />
                            </Animated.View>
                        );
                    }}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>

            {/* Sticky User Row */}
            {userRank && typeof userRank.rank === 'number' && typeof userRank.total_xp === 'number' && (
                <View style={[styles.stickyWrap, { paddingBottom: insets.bottom }]}>
                    <LinearGradient colors={[withOpacity(colors.favor, 0.12), withOpacity(colors.favor, 0.04)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stickyGradient}>
                        <View style={styles.stickyInner}>
                            <Text style={styles.stickyRank}>#{String(userRank.rank).padStart(2, '0')}</Text>
                            <View style={styles.stickyAvatarWrap}>
                                <LayeredAvatar accessories={normalizeAccessories(userRank.equipped_accessories)} size={38} scale={1.45} translateY={3} />
                                <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
                            </View>
                            <Text style={styles.stickyName} numberOfLines={1}>{userRank.display_name ?? 'Anonymous'}</Text>
                            <View style={styles.stickyXpCluster}>
                                <Text style={styles.stickyXpValue}>{fmtXP(userRank.total_xp)}</Text>
                                <Text style={styles.stickyXpUnit}>XP</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            )}


            {/* Profile Modal */}
            <Modal visible={profilePreviewVisible} animationType="slide" transparent onRequestClose={() => setProfilePreviewVisible(false)}>
                <Pressable style={styles.previewBackdrop} onPress={() => setProfilePreviewVisible(false)}>
                    <Pressable style={styles.previewCard} onPress={() => {}}>
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>Profile</Text>
                            <Pressable onPress={() => setProfilePreviewVisible(false)} hitSlop={10}>
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
                                <Text style={styles.previewBio}>{selectedProfile?.bio || 'Tell your campus a little about yourself...'}</Text>
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
                        {selectedBadges.length > 0 && (
                            <View style={styles.previewSection}>
                                <View style={styles.previewSectionHeaderRow}>
                                    <Text style={styles.previewSectionTitle}>Badges</Text>
                                </View>
                                <View style={styles.previewBadgeRow}>
                                    {selectedBadges.map((badgeId) => {
                                        const badge = getBadgeById(badgeId);
                                        if (!badge) return null;
                                        return (
                                            <View key={badge.id} style={styles.previewBadgeSlot}>
                                                <Image source={badge.icon} style={styles.previewBadgeImage} resizeMode="contain" />
                                                <Text style={styles.previewBadgeLabel}>{badge.name}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                        <View style={styles.previewSection}>
                            <View style={styles.previewSectionHeaderRow}>
                                <Text style={styles.previewSectionTitle}>Reputation</Text>
                                <View style={styles.previewRankChip}>
                                    <Text style={styles.previewRankChipText}>{selectedProfile?.reputation || getReputationTitle(levelData.currentLevel)}</Text>
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
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 20, paddingBottom: 12, height: 64, borderBottomWidth: 1, borderBottomColor: COLORS.border, position: 'relative' },
    headerTitleContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 12, alignItems: 'center', justifyContent: 'center' },
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    backText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary },
    headerTitle: { fontFamily: FONTS.display, fontSize: 14, color: COLORS.textPrimary, letterSpacing: 2 },
    podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12, paddingTop: 24, paddingBottom: 0, gap: 6 },
    podiumCard: { borderRadius: 18, borderWidth: 1, alignItems: 'center', overflow: 'hidden', paddingTop: 10 },
    podiumPressable: { alignItems: 'center' },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
    segment: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.surface, overflow: 'hidden', flex: 1 },
    segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9 },
    segmentBtnActive: { backgroundColor: withOpacity(COLORS.favor, 0.14) },
    segmentBtnText: { fontFamily: FONTS.display, fontSize: 8, letterSpacing: 1, color: COLORS.textSecondary },
    segmentBtnTextActive: { color: COLORS.favor },
    crown: { fontFamily: FONTS.display, marginBottom: 4 },
    podiumAvatarWrap: { borderWidth: 2.5, borderRadius: 99, overflow: 'hidden', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8, marginBottom: 8, backgroundColor: COLORS.surface2 },
    rankPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginBottom: 6 },
    rankPillText: { fontFamily: FONTS.display, fontSize: 7, color: '#1A1A1F', letterSpacing: 1 },
    podiumName: { fontFamily: FONTS.body, fontWeight: '700', fontSize: 12, marginBottom: 2, paddingHorizontal: 8, textAlign: 'center' },
    podiumXP: { fontFamily: FONTS.display, fontSize: 7, marginBottom: 8, letterSpacing: 0.5 },
    podiumBase: { width: '100%', borderTopWidth: 1, alignItems: 'center', justifyContent: 'center' },
    podiumBaseNumber: { fontFamily: FONTS.display, fontSize: 22, marginTop: 6 },
    listHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginTop: 4 },
    listHeaderText: { fontFamily: FONTS.display, fontSize: 7, color: COLORS.textSecondary, letterSpacing: 1.2 },
    listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
    listRowMe: { backgroundColor: withOpacity(COLORS.favor, 0.06) },
    listRank: { fontFamily: FONTS.display, fontSize: 10, width: 28, textAlign: 'right' },
    listAvatarWrap: { borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    listName: { flex: 1, fontFamily: FONTS.body, fontWeight: '700', fontSize: 14, color: COLORS.textPrimary },
    xpChip: { flexDirection: 'row', alignItems: 'baseline', gap: 3, backgroundColor: withOpacity(COLORS.xp, 0.12), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: withOpacity(COLORS.xp, 0.25) },
    xpChipText: { fontFamily: FONTS.display, fontSize: 10, color: COLORS.xp },
    xpChipUnit: { fontFamily: FONTS.display, fontSize: 7, color: withOpacity(COLORS.xp, 0.6) },
    separator: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
    stickyWrap: { borderTopWidth: 1, borderTopColor: COLORS.border },
    stickyGradient: { paddingHorizontal: 20, paddingVertical: 10 },
    stickyInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stickyRank: { fontFamily: FONTS.display, fontSize: 10, color: COLORS.favor, width: 38 },
    stickyAvatarWrap: { position: 'relative' },
    youBadge: { position: 'absolute', bottom: -4, left: '50%', transform: [{ translateX: -14 }], backgroundColor: COLORS.favor, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    youBadgeText: { fontFamily: FONTS.display, fontSize: 5, color: '#1A1A1F', letterSpacing: 0.5 },
    stickyName: { flex: 1, fontFamily: FONTS.body, fontWeight: '700', fontSize: 14, color: COLORS.favor },
    stickyXpCluster: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    stickyXpValue: { fontFamily: FONTS.display, fontSize: 12, color: COLORS.xp },
    stickyXpUnit: { fontFamily: FONTS.display, fontSize: 8, color: withOpacity(COLORS.xp, 0.6) },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyIcon: { fontSize: 48, marginBottom: 8 },
    emptyText: { fontFamily: FONTS.display, fontSize: 11, color: COLORS.textPrimary, letterSpacing: 1 },
    previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 16 },
    previewCard: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 14, gap: 12, marginBottom: 86 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewTitle: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
    previewIdentityRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    previewAvatarFrame: { borderWidth: 1.5, borderColor: withOpacity(COLORS.favor, 0.4), borderRadius: 40, padding: 2 },
    previewIdentityText: { flex: 1, gap: 4 },
    previewName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
    previewSubtitle: { color: COLORS.textSecondary, fontSize: 12 },
    previewBio: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
    previewStatsRow: { flexDirection: 'row', gap: 8 },
    previewStatCard: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: withOpacity(COLORS.favor, 0.25), backgroundColor: withOpacity(COLORS.favor, 0.06), paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 2 },
    previewStatValue: { color: COLORS.favor, fontSize: 10, fontWeight: '700' },
    previewStatLabel: { color: COLORS.textSecondary, fontSize: 10, textAlign: 'center' },
    previewSection: { gap: 10 },
    previewSectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewSectionTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
    previewBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4 },
    previewBadgeSlot: { flex: 1, height: 90, borderRadius: 12, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
    previewBadgeImage: { width: 40, height: 40, marginBottom: 5 },
    previewBadgeLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center' },
    previewRankChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: withOpacity(COLORS.favor, 0.08), borderWidth: 1, borderColor: withOpacity(COLORS.favor, 0.2) },
    previewRankChipText: { color: COLORS.favor, fontSize: 12, fontWeight: '600' },
    previewKarmaLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewKarmaTitleCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previewKarmaIcon: { width: 16, height: 16 },
    previewKarmaTitle: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
    previewKarmaValueText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
    previewProgressTrack: { height: 10, borderRadius: 5, backgroundColor: COLORS.surface2, overflow: 'hidden' },
    previewProgressFill: { height: '100%', borderRadius: 5, backgroundColor: COLORS.xp },
    previewLevelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    previewLevelRangeText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700' },
});