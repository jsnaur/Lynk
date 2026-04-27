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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { darkColors, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';

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

const XP_THRESHOLDS = [0, 1000, 3000, 6000, 10000, 15000, 22000, 31000, 42000, 55000];

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

const PROFILE_BADGE_ASSETS = {
    badgeHat: require("../../../assets/ProfileAssets/BadgeHat.png"),
    badgeMedal: require("../../../assets/ProfileAssets/BadgeMedal.png"),
    badgeShield: require("../../../assets/ProfileAssets/BadgeShield.png"),
    experience: require("../../../assets/ProfileAssets/Experience_Pixel.png"),
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
        if (!loading && entries.length > 0) {
            anim1.setValue(0);
            anim2.setValue(0);
            anim3.setValue(0);
            Animated.stagger(120, [
                Animated.spring(anim2, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim1, { toValue: 1, useNativeDriver: true, damping: 14 }),
                Animated.spring(anim3, { toValue: 1, useNativeDriver: true, damping: 14 }),
            ]).start();
        }
    }, [loading, metric, entries, anim1, anim2, anim3]);

    // Sort logic handled natively in React to avoid excess DB calls
    const metricSorted = [...entries].sort((a, b) => {
        if (metric === 'xp') {
            return b.total_xp - a.total_xp;
        }
        if (b.completed_quests !== a.completed_quests) {
            return b.completed_quests - a.completed_quests;
        }
        return b.total_xp - a.total_xp;
    });

    const finalEntries = metricSorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    const top3 = finalEntries.slice(0, 3);
    const rest = finalEntries.slice(3);

    const podiumOrder = [
        { entry: top3[1] ?? null, medal: MEDALS[1], anim: anim2 },
        { entry: top3[0] ?? null, medal: MEDALS[0], anim: anim1 },
        { entry: top3[2] ?? null, medal: MEDALS[2], anim: anim3 },
    ];

    const openProfilePreview = async (entry: LeaderboardEntry) => {
        setSelectedProfile({
            id: entry.id,
            displayName: entry.display_name ?? 'Anonymous',
            accessories: normalizeAccessories(entry.equipped_accessories),
            major: null,
            graduationYear: null,
            bio: null,
            level: entry.level,
            totalXP: entry.total_xp,
            completedQuests: entry.completed_quests,
            rank: entry.rank,
            badges: getBadgeSet(entry.total_xp, entry.completed_quests),
            reputation: getReputationLabel(entry.total_xp),
        });
        setProfilePreviewVisible(true);

        const { data: profileData } = await supabase
            .from('profiles')
            .select('major, graduation_year, bio')
            .eq('id', entry.id)
            .maybeSingle();

        if (profileData) {
            setSelectedProfile((prev) => prev ? {
                ...prev,
                major: profileData.major,
                graduationYear: profileData.graduation_year,
                bio: profileData.bio,
            } : null);
        }
    };

    const profileSubtitle = selectedProfile
        ? `${selectedProfile.major || 'Undeclared'}${selectedProfile.graduationYear ? ` · Class of '${selectedProfile.graduationYear.slice(-2)}` : ''}`
        : '';
    const levelData = calculateLevelProgressFromXP(selectedProfile?.totalXP ?? 0);
    const nextLevel = Math.min(levelData.currentLevel + 1, 10);
    const selectedBadges = selectedProfile?.badges ?? ['Guardian'];

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => navigation?.goBack?.()} hitSlop={10}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
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
                            )}

                            {/* List header */}
                            {!loading && rest.length > 0 && (
                                <View style={styles.listHeaderRow}>
                                    <Text style={styles.listHeaderText}>RANK</Text>
                                    <Text style={[styles.listHeaderText, { flex: 1, marginLeft: 50 }]}>PLAYER</Text>
                                    <Text style={styles.listHeaderText}>{metric === 'xp' ? 'XP' : 'QUEST'}</Text>
                                </View>
                            )}
                        </>
                    }
                    renderItem={({ item }) => (
                        <LeaderboardRow
                            item={item}
                            isMe={item.id === currentUserId}
                            metric={metric}
                            onPress={openProfilePreview}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>

            {/* Sticky User Row */}
            {userRank && (
                <View style={styles.stickyWrap}>
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