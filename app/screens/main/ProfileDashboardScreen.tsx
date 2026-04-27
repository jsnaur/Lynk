import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav, { MainTab } from '../../components/BottomNav';
import ProfileSkeleton from '../../components/cards/ProfileSkeleton';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';
import { useTheme } from '../../contexts/ThemeContext';

// Profile Assets
import VerifiedIcon from "../../../assets/ProfileAssets/Verified_Icon.svg";
import QuestIcon from "../../../assets/ProfileAssets/Quest_Icon.svg";

import BadgeSelectorModal from './BadgeSelectorModal';
import EditProfileModal from './EditProfileModal';

const ASSETS = {
    badgeHat: require("../../../assets/ProfileAssets/BadgeHat.png"),
    badgeMedal: require("../../../assets/ProfileAssets/BadgeMedal.png"),
    badgeShield: require("../../../assets/ProfileAssets/BadgeShield.png"),
    experience: require("../../../assets/ProfileAssets/Experience_Pixel.png"),
    token: require("../../../assets/ProfileAssets/Token_Pixel.png"),
};

type ProfileDashboardScreenProps = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any;
};

type ProfileState = {
    badgeSelectorVisible: boolean;
    editProfileVisible?: boolean;
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

function LayeredAvatar({
    accessories, size, scale = 1.45, translateY = 3
}: { accessories?: Partial<Record<AvatarSlot, string>>; size: number; scale?: number; translateY?: number; }) {
    const { colors } = useTheme();
    const safeAccessories = normalizeAccessories(accessories);

    return (
        <View style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface2, position: 'relative' }}>
            {ALL_SLOTS_Z_ORDER.map((slot) => {
                const accessoryId = safeAccessories[slot];
                if (!accessoryId) return null;
                const accessory = getAccessoryById(accessoryId);
                if (!accessory) return null;
                const Sprite = accessory.Sprite;

                return (
                    <View key={slot} pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, transform: [{ scale }, { translateY }] }}>
                        <Sprite width="100%" height="100%" />
                    </View>
                );
            })}
        </View>
    );
}

const XP_THRESHOLDS = [0, 200, 400, 600, 800, 1000, 1500, 2500, 3000, 50000];

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
    const progressPercent = Math.min(1, xpInCurrentLevel / xpNeededForNextLevel);

    return { currentLevel, xpInCurrentLevel, xpNeededForNextLevel, progressPercent };
}

function BadgeSlot({ image, label }: { image: any; label?: string }) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    return (
        <View style={styles.badgeSlot}>
            <Image source={image} style={styles.badgeImage} resizeMode="contain" />
            {label && <Text style={styles.badgeLabelText} numberOfLines={1}>{label}</Text>}
        </View>
    );
}

function LeaderboardCard({ onPress }: { onPress: () => void }) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    return (
        <Pressable style={({ pressed }) => [styles.leaderboardCard, pressed && { opacity: 0.75 }]} onPress={onPress}>
            <LinearGradient colors={['rgba(255,215,0,0.13)', 'rgba(192,84,252,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.leaderboardLeft}>
                <View style={styles.leaderboardIconWrap}>
                    <Ionicons name="trophy" size={20} color={colors.token} />
                </View>
                <View>
                    <Text style={styles.leaderboardTitle}>HALL OF FAME</Text>
                    <Text style={styles.leaderboardSubtitle}>Global Rankings</Text>
                </View>
            </View>
            <View style={styles.leaderboardRight}>
                <Text style={styles.leaderboardCta}>VIEW</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.token} />
            </View>
        </Pressable>
    );
}

export default function ProfileDashboardScreen({ onTabPress, navigation }: ProfileDashboardScreenProps) {
    const { theme, colors } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    const { balance, refreshBalance } = useTokenBalance();
    
    const [profile, setProfile] = useState<any>(null);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [totalXP, setTotalXP] = useState<number>(0);
    const [state, setState] = useState<ProfileState>({ badgeSelectorVisible: false, editProfileVisible: false });
    const [activeQuestCount, setActiveQuestCount] = useState<number>(0);
    const [completedQuestCount, setCompletedQuestCount] = useState<number>(0);

    const fetchProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setProfile(data);
                    setTotalXP(data.total_xp || 0);
                }
            }
        } finally {
            setInitialLoading(false);
        }
    }, []);

    const fetchQuestCounts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: mainQuests } = await supabase.from('quests').select('id, status').or(`user_id.eq.${user.id},accepted_by.eq.${user.id}`);
            const { data: partData } = await supabase.from('quest_participants').select('quest_id').eq('user_id', user.id).in('status', ['accepted', 'completed', 'failed', 'resolved']);

            const partQuestIds = partData?.map((p) => p.quest_id) || [];
            let extraQuests: any[] = [];

            if (partQuestIds.length > 0) {
                const existingIds = mainQuests?.map((q) => q.id) || [];
                const missingIds = partQuestIds.filter((id) => !existingIds.includes(id));
                if (missingIds.length > 0) {
                    const { data: extra } = await supabase.from('quests').select('id, status').in('id', missingIds);
                    if (extra) extraQuests = extra;
                }
            }

            const allData = [...(mainQuests || []), ...extraQuests];
            let activeCount = 0;
            let completedCount = 0;
            const seenIds = new Set();

            allData.forEach((q) => {
                if (seenIds.has(q.id)) return;
                seenIds.add(q.id);
                if (q.status === 'completed' || q.status === 'resolved') completedCount++;
                else activeCount++;
            });

            setActiveQuestCount(activeCount);
            setCompletedQuestCount(completedCount);
        } catch (error) {
            console.error('Error fetching quest counts:', error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation?.addListener('focus', () => {
            const route = navigation?.getState?.()?.routes?.[navigation?.getState?.()?.index];
            if (route?.params?.openEditProfile) {
                setState(prev => ({ ...prev, editProfileVisible: true }));
                navigation.setParams({ openEditProfile: false });
            }
            void fetchProfile();
            void refreshBalance();
            void fetchQuestCounts();
        });
        void fetchProfile();
        void fetchQuestCounts();
        return unsubscribe;
    }, [fetchProfile, refreshBalance, fetchQuestCounts, navigation]);

    useEffect(() => {
        let channel: any;
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            channel = supabase.channel('profile_dashboard_changes')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
                    if (payload.new) {
                        setProfile((prev: any) => ({ ...prev, ...payload.new }));
                        if (payload.new.total_xp !== undefined) setTotalXP(payload.new.total_xp);
                    }
                }).subscribe();
        };
        setupRealtime();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    const levelData = calculateLevelFromXP(totalXP);
    const currentLevel = levelData.currentLevel;
    const nextLevel = Math.min(currentLevel + 1, 10);
    const karmaProgress = levelData.progressPercent;
    
    const profileAccessories = normalizeAccessories(profile?.equipped_accessories);
    const gradYearDisplay = profile?.graduation_year || profile?.graduationYear || '2027';
    const shortYear = gradYearDisplay.slice(-2);
    const majorDisplay = profile?.major || 'Undeclared';
    const displayName = profile?.display_name || profile?.displayName || 'Anonymous';
    const bioDisplay = profile?.bio || 'Tell your campus a little about yourself...';

    return (
        <View style={styles.root}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Pressable style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]} hitSlop={10} onPress={() => navigation?.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} style={styles.settingsIcon} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {initialLoading ? (
                        <ProfileSkeleton />
                    ) : (
                        <>
                    <View style={styles.identityBlock}>
                        <View style={styles.identityRow}>
                            <View style={styles.avatarColumn}>
                                <View style={styles.avatarFrame}>
                                    {!profile ? (
                                        <View style={styles.loadingAvatarIconWrap}>
                                            <Ionicons name="person" size={42} color={colors.textPrimary} />
                                        </View>
                                    ) : (
                                        <LayeredAvatar accessories={profileAccessories} size={95} scale={1} translateY={0} />
                                    )}
                                </View>
                            </View>

                            <View style={styles.identityTextColumn}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>{displayName}</Text>
                                    <VerifiedIcon width={18} height={18} />
                                </View>
                                <Text style={styles.subtitle}>{majorDisplay} · Class of '{shortYear}</Text>
                                <Text style={styles.bioText}>{bioDisplay}</Text>
                                <Pressable onPress={() => setState({ ...state, editProfileVisible: true })}>
                                    <Text style={styles.editProfileText}>Edit Profile</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.badgesBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Badges</Text>
                            <Pressable style={styles.setLink} onPress={() => setState({ ...state, badgeSelectorVisible: true })}>
                                <Text style={styles.setLinkText}>Set</Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.favor} />
                            </Pressable>
                        </View>
                        <View style={styles.badgeRow}>
                            <BadgeSlot image={ASSETS.badgeShield} label="Guardian" />
                            <BadgeSlot image={ASSETS.badgeMedal} label="Achiever" />
                            <BadgeSlot image={ASSETS.badgeHat} label="Scholar" />
                        </View>
                    </View>

                    <View style={styles.reputationBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Reputation</Text>
                            <View style={styles.rankChip}>
                                <Text style={styles.rankChipText}>Campus Helper</Text>
                            </View>
                        </View>

                        <View style={styles.karmaLabelRow}>
                            <View style={styles.karmaTitleCluster}>
                                <Image source={ASSETS.experience} style={styles.karmaIcon} />
                                <Text style={styles.karmaTitle}>EXPERIENCE</Text>
                            </View>
                            <Text style={styles.karmaValueText}>{levelData.xpInCurrentLevel} / {levelData.xpNeededForNextLevel}</Text>
                        </View>

                        <View style={styles.progressTrack}>
                            <LinearGradient colors={[colors.xp, colors.favor]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.progressFill, { width: `${karmaProgress * 100}%` }]} />
                        </View>

                        <View style={styles.levelRow}>
                            <Text style={styles.levelRangeText}>LVL {currentLevel}</Text>
                            <Text style={styles.levelRangeText}>LVL {nextLevel}</Text>
                        </View>

                        <LeaderboardCard onPress={() => navigation?.navigate('Leaderboard')} />

                        <Pressable style={styles.tokenCard} onPress={() => { if (onTabPress) onTabPress('Shop'); else navigation?.navigate('Main', { screen: 'Shop' }); }}>
                            <View style={styles.tokenLeftCluster}>
                                <Image source={ASSETS.token} style={styles.tokenIcon} />
                                <View>
                                    <Text style={styles.tokenTitle}>Token Balance</Text>
                                    <Text style={styles.tokenSubtitle}>Spend in the Shop</Text>
                                </View>
                            </View>
                            <View style={styles.tokenRightCluster}>
                                <Text style={styles.tokenValue}>{balance}</Text>
                                <Text style={styles.tokenUnit}>TKN</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.token} />
                            </View>
                        </Pressable>

                        <Pressable style={styles.questsShortcut} onPress={() => { if (onTabPress) onTabPress('Quests'); else navigation?.navigate('Main', { screen: 'Quest' }); }}>
                            <View style={styles.questsLeftCluster}>
                                <QuestIcon width={26} height={26} />
                                <View>
                                    <Text style={styles.questsTitle}>My Quests</Text>
                                    <Text style={styles.questsSubtitle}>{activeQuestCount} active · {completedQuestCount} completed</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.token} />
                        </Pressable>
                    </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            <BottomNav activeTab="Profile" onTabPress={onTabPress} />

            {state.badgeSelectorVisible && <BadgeSelectorModal onClose={() => setState({ ...state, badgeSelectorVisible: false })} onDone={() => setState({ ...state, badgeSelectorVisible: false })} />}
            {state.editProfileVisible && (
                <EditProfileModal
                    initialData={{ displayName: displayName === 'Anonymous' ? '' : displayName, bio: profile?.bio || '', major: profile?.major || 'Undeclared', graduationYear: gradYearDisplay }}
                    onClose={() => setState({ ...state, editProfileVisible: false })}
                    onSave={async (data: any) => {
                        setProfile((prev: any) => ({ ...prev, display_name: data.displayName, bio: data.bio, major: data.major, graduation_year: data.graduationYear }));
                        setState({ ...state, editProfileVisible: false });
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) await supabase.from('profiles').update({ display_name: data.displayName, bio: data.bio, major: data.major, graduation_year: data.graduationYear }).eq('id', user.id);
                            await fetchProfile();
                        } catch (e) { console.error("Error updating profile", e); }
                    }}
                />
            )}
        </View>
    );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 12, height: 64, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontFamily: FONTS.display, color: colors.textPrimary, letterSpacing: 0.2 },
    settingsButton: { height: 25, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    settingsIcon: { width: 24, height: 24 },
    scrollContent: { paddingBottom: 112 },
    identityBlock: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    identityRow: { flexDirection: 'row', gap: 18 },
    avatarColumn: { alignItems: 'center', gap: 8 },
    avatarFrame: { width: 100, height: 100, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.border, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
    loadingAvatarIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    identityTextColumn: { flex: 1, gap: 8, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nameText: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    subtitle: { fontSize: 13, color: colors.textSecondary },
    bioText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    editProfileText: { fontSize: 12, color: colors.favor },
    badgesBlock: { paddingHorizontal: 24, paddingVertical: 20, gap: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    blockHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    blockTitle: { fontSize: 12, fontFamily: FONTS.display, color: colors.textPrimary },
    setLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    setLinkText: { fontSize: 14, fontWeight: '400', color: colors.favor },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4 },
    badgeSlot: { flex: 1, height: 104, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, paddingVertical: 12 },
    badgeImage: { width: 50, height: 50, marginBottom: 6 },
    badgeLabelText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
    reputationBlock: { paddingHorizontal: 24, paddingVertical: 20, gap: 14 },
    rankChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(0,245,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,245,255,0.2)' },
    rankChipText: { fontSize: 12, fontWeight: '600', color: colors.favor },
    karmaLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    karmaTitleCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    karmaIcon: { width: 18, height: 18 },
    karmaTitle: { fontSize: 9, fontFamily: FONTS.display, color: colors.textPrimary },
    karmaValueText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    progressTrack: { height: 10, borderRadius: 5, backgroundColor: colors.surface2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 },
    levelRangeText: { fontSize: 8, fontWeight: '700', color: colors.textSecondary, fontFamily: 'monospace' },
    leaderboardCard: { height: 64, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.30)', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
    leaderboardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    leaderboardIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', alignItems: 'center', justifyContent: 'center' },
    leaderboardTitle: { fontSize: 10, fontFamily: FONTS.display, color: colors.textPrimary },
    leaderboardSubtitle: { fontSize: 11, color: colors.textSecondary },
    leaderboardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    leaderboardCta: { fontSize: 13, fontWeight: '600', color: colors.token },
    tokenCard: { height: 64, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tokenLeftCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tokenIcon: { width: 26, height: 26 },
    tokenTitle: { fontSize: 10, fontFamily: FONTS.display, color: colors.textPrimary },
    tokenSubtitle: { fontSize: 11, color: colors.textSecondary },
    tokenRightCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tokenValue: { fontSize: 22, fontWeight: '700', color: colors.token },
    tokenUnit: { fontSize: 13, color: colors.textSecondary },
    questsShortcut: { height: 64, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    questsLeftCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    questsTitle: { fontSize: 10, fontFamily: FONTS.display, color: colors.textPrimary },
    questsSubtitle: { fontSize: 11, color: colors.textSecondary },
});