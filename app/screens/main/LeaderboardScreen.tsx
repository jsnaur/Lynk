import { StatusBar } from 'expo-status-bar';
import {
    Animated,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeaderboardEntry = {
    id: string;
    display_name: string | null;
    total_xp: number;
    equipped_accessories: Record<string, string> | null;
    rank: number;
};

type UserRankData = {
    rank: number;
    total_xp: number;
    display_name: string | null;
    equipped_accessories: Record<string, string> | null;
};

type Props = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any;
};

// ─── Avatar helpers (mirrored from ProfileDashboardScreen) ────────────────────

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

// ─── Medal config ─────────────────────────────────────────────────────────────

const MEDALS = [
    {
        rank: 1,
        label: '1ST',
        color: '#FFD700',
        glow: 'rgba(255,215,0,0.35)',
        bg: 'rgba(255,215,0,0.10)',
        border: 'rgba(255,215,0,0.45)',
        avatarSize: 76,
        crownSize: 22,
        podiumHeight: 110,
        crown: '♛',
    },
    {
        rank: 2,
        label: '2ND',
        color: '#C0C0C0',
        glow: 'rgba(192,192,192,0.28)',
        bg: 'rgba(192,192,192,0.08)',
        border: 'rgba(192,192,192,0.35)',
        avatarSize: 60,
        crownSize: 18,
        podiumHeight: 82,
        crown: '♛',
    },
    {
        rank: 3,
        label: '3RD',
        color: '#CD7F32',
        glow: 'rgba(205,127,50,0.28)',
        bg: 'rgba(205,127,50,0.08)',
        border: 'rgba(205,127,50,0.35)',
        avatarSize: 60,
        crownSize: 18,
        podiumHeight: 68,
        crown: '♛',
    },
];

// ─── Loading Dots ─────────────────────────────────────────────────────────────

function LoadingDots() {
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
        <View style={loadingStyles.wrap}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View key={i} style={[loadingStyles.dot, { transform: [{ translateY: dot }] }]} />
            ))}
        </View>
    );
}

const loadingStyles = StyleSheet.create({
    wrap: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.favor },
});

// ─── XP formatter ─────────────────────────────────────────────────────────────

function fmtXP(xp: number): string {
    if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
    if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
    return String(xp);
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({
    entry,
    medal,
    animValue,
}: {
    entry: LeaderboardEntry | null;
    medal: (typeof MEDALS)[0];
    animValue: Animated.Value;
}) {
    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [40, 0],
    });
    const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

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
            {/* Crown */}
            <Text style={[styles.crown, { color: medal.color, fontSize: medal.crownSize }]}>
                {medal.crown}
            </Text>

            {/* Avatar */}
            <View
                style={[
                    styles.podiumAvatarWrap,
                    {
                        width: medal.avatarSize + 8,
                        height: medal.avatarSize + 8,
                        borderRadius: (medal.avatarSize + 8) / 2,
                        borderColor: medal.color,
                        shadowColor: medal.color,
                    },
                ]}
            >
                <LayeredAvatar
                    accessories={normalizeAccessories(entry?.equipped_accessories)}
                    size={medal.avatarSize}
                    scale={1.5}
                    translateY={4}
                />
            </View>

            {/* Rank label pill */}
            <View style={[styles.rankPill, { backgroundColor: medal.color }]}>
                <Text style={styles.rankPillText}>{medal.label}</Text>
            </View>

            {/* Name */}
            <Text style={[styles.podiumName, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {entry?.display_name ?? '—'}
            </Text>

            {/* XP */}
            <Text style={[styles.podiumXP, { color: medal.color }]}>
                {entry ? fmtXP(entry.total_xp) : '—'} XP
            </Text>

            {/* Podium base */}
            <View
                style={[
                    styles.podiumBase,
                    { height: medal.podiumHeight, backgroundColor: medal.color + '22', borderTopColor: medal.color + '55' },
                ]}
            >
                <Text style={[styles.podiumBaseNumber, { color: medal.color }]}>{medal.rank}</Text>
            </View>
        </Animated.View>
    );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function LeaderboardRow({ item, isMe }: { item: LeaderboardEntry; isMe: boolean }) {
    const rankColor =
        item.rank === 1
            ? '#FFD700'
            : item.rank === 2
            ? '#C0C0C0'
            : item.rank === 3
            ? '#CD7F32'
            : COLORS.textSecondary;

    return (
        <View style={[styles.listRow, isMe && styles.listRowMe]}>
            {/* Rank */}
            <Text style={[styles.listRank, { color: rankColor }]}>
                {String(item.rank).padStart(2, '0')}
            </Text>

            {/* Avatar */}
            <View style={styles.listAvatarWrap}>
                <LayeredAvatar
                    accessories={normalizeAccessories(item.equipped_accessories)}
                    size={38}
                    scale={1.45}
                    translateY={3}
                />
            </View>

            {/* Name */}
            <Text style={[styles.listName, isMe && { color: COLORS.favor }]} numberOfLines={1}>
                {item.display_name ?? 'Anonymous'}
            </Text>

            {/* XP */}
            <View style={styles.xpChip}>
                <Text style={styles.xpChipText}>{fmtXP(item.total_xp)}</Text>
                <Text style={styles.xpChipUnit}>XP</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen({ onTabPress, navigation }: Props) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRankData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Per-podium card animations
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            // 1. Top 100 from the leaderboard view
            const { data: lb } = await supabase
                .from('leaderboard')
                .select('id, display_name, total_xp, equipped_accessories, rank')
                .order('rank', { ascending: true })
                .limit(100);

            if (lb) setEntries(lb as LeaderboardEntry[]);

            // 2. Current user's rank via RPC
            if (user) {
                const { data: rankData } = await supabase.rpc('get_user_leaderboard_rank', {
                    user_id: user.id,
                });
                if (rankData) setUserRank(rankData as UserRankData);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Staggered podium entrance animations once data loads
    useEffect(() => {
        if (!loading && entries.length > 0) {
            Animated.stagger(120, [
                Animated.spring(anim2, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim1, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim3, { toValue: 1, useNativeDriver: true, damping: 14 }),
            ]).start();
        }
    }, [loading]);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    // Map podium order: 2nd | 1st | 3rd (classic podium layout)
    const podiumOrder = [
        { entry: top3[1] ?? null, medal: MEDALS[1], anim: anim2 },
        { entry: top3[0] ?? null, medal: MEDALS[0], anim: anim1 },
        { entry: top3[2] ?? null, medal: MEDALS[2], anim: anim3 },
    ];

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation?.goBack?.()}
                        hitSlop={10}
                    >
                        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.backText}>Profile</Text>
                    </Pressable>

                    <View style={styles.headerTitleContainer} pointerEvents="none">
                        <Text style={styles.headerTitle}>RANKINGS</Text>
                    </View>
                </View>

                <FlatList
                    data={rest}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    ListHeaderComponent={
                        <>
                            {/* Podium */}
                            {loading ? (
                                <LoadingDots />
                            ) : entries.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🏆</Text>
                                    <Text style={styles.emptyText}>No rankings yet.</Text>
                                    <Text style={styles.emptySubtext}>Be the first to earn XP!</Text>
                                </View>
                            ) : (
                                <View style={styles.podiumContainer}>
                                    {podiumOrder.map(({ entry, medal, anim }) => (
                                        <PodiumCard
                                            key={medal.rank}
                                            entry={entry}
                                            medal={medal}
                                            animValue={anim}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* List header */}
                            {!loading && rest.length > 0 && (
                                <View style={styles.listHeaderRow}>
                                    <Text style={styles.listHeaderText}>RANK</Text>
                                    <Text style={[styles.listHeaderText, { flex: 1, marginLeft: 50 }]}>
                                        PLAYER
                                    </Text>
                                    <Text style={styles.listHeaderText}>XP</Text>
                                </View>
                            )}
                        </>
                    }
                    renderItem={({ item }) => (
                        <LeaderboardRow item={item} isMe={item.id === currentUserId} />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>

            {/* Sticky user row */}
            {userRank && (
                <View style={styles.stickyWrap}>
                    <LinearGradient
                        colors={['rgba(0,245,255,0.12)', 'rgba(0,245,255,0.04)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.stickyGradient}
                    >
                        <View style={styles.stickyInner}>
                            {/* Rank */}
                            <Text style={styles.stickyRank}>
                                #{String(userRank.rank).padStart(2, '0')}
                            </Text>

                            {/* Avatar */}
                            <View style={styles.stickyAvatarWrap}>
                                <LayeredAvatar
                                    accessories={normalizeAccessories(userRank.equipped_accessories)}
                                    size={38}
                                    scale={1.45}
                                    translateY={3}
                                />
                                {/* "YOU" badge */}
                                <View style={styles.youBadge}>
                                    <Text style={styles.youBadgeText}>YOU</Text>
                                </View>
                            </View>

                            {/* Name */}
                            <Text style={styles.stickyName} numberOfLines={1}>
                                {userRank.display_name ?? 'Anonymous'}
                            </Text>

                            {/* XP */}
                            <View style={styles.stickyXpCluster}>
                                <Text style={styles.stickyXpValue}>{fmtXP(userRank.total_xp)}</Text>
                                <Text style={styles.stickyXpUnit}>XP</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            )}

            <BottomNav activeTab="Profile" onTabPress={onTabPress} />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    safeArea: {
        flex: 1,
    },

    // ── Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 12,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        position: 'relative',
    },
    headerTitleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    backText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    headerTitle: {
        fontFamily: FONTS.display,
        fontSize: 14,
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },

    // ── Podium
    podiumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingTop: 24,
        paddingBottom: 0,
        gap: 6,
    },
    podiumCard: {
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: 10,
    },
    crown: {
        fontFamily: FONTS.display,
        marginBottom: 4,
    },
    podiumAvatarWrap: {
        borderWidth: 2.5,
        borderRadius: 99,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
        marginBottom: 8,
    },
    rankPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        marginBottom: 6,
    },
    rankPillText: {
        fontFamily: FONTS.display,
        fontSize: 7,
        color: '#1A1A1F',
        letterSpacing: 1,
    },
    podiumName: {
        fontFamily: FONTS.body,
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 2,
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    podiumXP: {
        fontFamily: FONTS.display,
        fontSize: 7,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    podiumBase: {
        width: '100%',
        borderTopWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    podiumBaseNumber: {
        fontFamily: FONTS.display,
        fontSize: 22,
        marginTop: 6,
    },

    // ── List header row
    listHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginTop: 4,
    },
    listHeaderText: {
        fontFamily: FONTS.display,
        fontSize: 7,
        color: COLORS.textSecondary,
        letterSpacing: 1.2,
    },

    // ── List rows
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 12,
    },
    listRowMe: {
        backgroundColor: withOpacity(COLORS.favor, 0.06),
    },
    listRank: {
        fontFamily: FONTS.display,
        fontSize: 10,
        width: 28,
        textAlign: 'right',
    },
    listAvatarWrap: {
        borderRadius: 19,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    listName: {
        flex: 1,
        fontFamily: FONTS.body,
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    xpChip: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
        backgroundColor: withOpacity(COLORS.xp, 0.12),
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: withOpacity(COLORS.xp, 0.25),
    },
    xpChipText: {
        fontFamily: FONTS.display,
        fontSize: 10,
        color: COLORS.xp,
    },
    xpChipUnit: {
        fontFamily: FONTS.display,
        fontSize: 7,
        color: withOpacity(COLORS.xp, 0.6),
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 20,
    },

    // ── Sticky user row
    stickyWrap: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    stickyGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    stickyInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stickyRank: {
        fontFamily: FONTS.display,
        fontSize: 10,
        color: COLORS.favor,
        width: 38,
    },
    stickyAvatarWrap: {
        position: 'relative',
    },
    youBadge: {
        position: 'absolute',
        bottom: -4,
        left: '50%',
        transform: [{ translateX: -14 }],
        backgroundColor: COLORS.favor,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    youBadgeText: {
        fontFamily: FONTS.display,
        fontSize: 5,
        color: '#1A1A1F',
        letterSpacing: 0.5,
    },
    stickyName: {
        flex: 1,
        fontFamily: FONTS.body,
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.favor,
    },
    stickyXpCluster: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    stickyXpValue: {
        fontFamily: FONTS.display,
        fontSize: 12,
        color: COLORS.xp,
    },
    stickyXpUnit: {
        fontFamily: FONTS.display,
        fontSize: 8,
        color: withOpacity(COLORS.xp, 0.6),
    },

    // ── Empty / Loading
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 8,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: FONTS.display,
        fontSize: 11,
        color: COLORS.textPrimary,
        letterSpacing: 1,
    },
    emptySubtext: {
        fontFamily: FONTS.body,
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});