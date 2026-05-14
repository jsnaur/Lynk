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
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav, { MainTab } from '../../components/BottomNav';
import ProfileSkeleton from '../../components/cards/ProfileSkeleton';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';
import { useTheme, screenHeaderTheme } from '../../contexts/ThemeContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import ScreenHeader from '../../components/navigation/ScreenHeader';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

// Profile Assets
import VerifiedIcon from "../../../assets/ProfileAssets/Verified_Icon.svg";
const QuestIcon = require("../../../assets/ProfileAssets/Scroll_Icon.png");

import BadgeSelectorModal from './BadgeSelectorModal';
import { getBadgeById } from '../../constants/badges';
import EditProfileModal from './EditProfileModal';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';

const ASSETS = {
    experience: require("../../../assets/ProfileAssets/Star_Icon.png"),
    trophy: require("../../../assets/ProfileAssets/Trophy_Icon.png"),
    token: require("../../../assets/ProfileAssets/Coin_Icon.png"),
};

type ProfileDashboardScreenProps = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any;
};

type ProfileState = {
    badgeSelectorVisible: boolean;
    editProfileVisible?: boolean;
    equippedBadgeIds: string[];
};

const EQUIPPED_BADGE_SLOTS = 3;

// --- MODULE LEVEL CACHE ---
let CACHED_PROFILE: any = null;
let CACHED_TOTAL_XP = 0;
let CACHED_ACTIVE_QUEST_COUNT = 0;
let CACHED_COMPLETED_QUEST_COUNT = 0;
let HAS_FETCHED_INITIALLY_PROFILE = false;

export function invalidateProfileCache() {
    CACHED_PROFILE = null;
    CACHED_TOTAL_XP = 0;
    CACHED_ACTIVE_QUEST_COUNT = 0;
    CACHED_COMPLETED_QUEST_COUNT = 0;
    HAS_FETCHED_INITIALLY_PROFILE = false;
}

type LevelUpAlertBodyProps = {
    level: number;
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

function EmptyBadgeSlot({ index, onPress }: { index: number; onPress?: () => void }) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    return (
        <Pressable style={[styles.badgeSlot, styles.badgeSlotEmpty]} onPress={onPress}>
            <Text style={styles.badgeSlotEmptyText}>{index + 1}</Text>
        </Pressable>
    );
}

function LeaderboardCard({ onPress }: { onPress: () => void }) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    return (
        <Pressable style={({ pressed }) => [styles.leaderboardCard, pressed && { opacity: 0.75 }]} onPress={onPress}>
            <LinearGradient colors={[colors.token, colors.xp]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.leaderboardGradientBorder}>
                <View style={styles.leaderboardInner}>
                    <View style={styles.leaderboardLeft}>
                        <Image source={ASSETS.trophy} style={styles.leaderboardIcon} />
                        <View style={styles.leaderboardTextCluster}>
                            <Text style={styles.leaderboardTitle}>Hall of Fame</Text>
                            <Text style={styles.leaderboardSubtitle}>Global Rankings</Text>
                        </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                        <Text style={styles.leaderboardCta}>VIEW</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.token} />
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

function LevelUpAlertBody({ level }: LevelUpAlertBodyProps) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

    return (
        <View style={styles.levelUpAlertBody}>
            <Image source={ASSETS.experience} style={styles.levelUpAlertIcon} resizeMode="contain" />
            <Text style={styles.levelUpAlertTitleText}>Congratulations!</Text>
            <Text style={styles.levelUpAlertDescriptionText}>You reached Level {level}. Keep it up!</Text>
        </View>
    );
}

export default function ProfileDashboardScreen({ onTabPress, navigation }: ProfileDashboardScreenProps) {
    const { theme, colors } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    const { alert } = useCustomAlert();
    const { balance, refreshBalance } = useTokenBalance();
    
    const [profile, setProfile] = useState<any>(CACHED_PROFILE);
    const [initialLoading, setInitialLoading] = useState<boolean>(!HAS_FETCHED_INITIALLY_PROFILE);
    const [totalXP, setTotalXP] = useState<number>(CACHED_TOTAL_XP);
    const [levelUpAlertLevel, setLevelUpAlertLevel] = useState<number | null>(null);
    const [state, setState] = useState<ProfileState>({ badgeSelectorVisible: false, editProfileVisible: false, equippedBadgeIds: [] });
    const [activeQuestCount, setActiveQuestCount] = useState<number>(CACHED_ACTIVE_QUEST_COUNT);
    const [completedQuestCount, setCompletedQuestCount] = useState<number>(CACHED_COMPLETED_QUEST_COUNT);

    const openSettings = () => {
        void appSoundManager.play(AppSoundCategory.ModalOpen, { debounceMs: 0 });
        void appSoundManager.play(AppSoundCategory.ButtonPress, { debounceMs: 0 });
        navigation?.navigate('Settings');
    };

    const openEditProfile = () => {
        void appSoundManager.play(AppSoundCategory.PostExpand, { debounceMs: 0 });
        setState((prev) => ({ ...prev, editProfileVisible: true }));
    };

    const openBadgeSelector = () => {
        void appSoundManager.play(AppSoundCategory.ButtonPress, { debounceMs: 0 });
        void appSoundManager.play(AppSoundCategory.ModalOpen, { debounceMs: 0 });
        setState((prev) => ({ ...prev, badgeSelectorVisible: true }));
    };

    const openLeaderboard = () => {
        void appSoundManager.play(AppSoundCategory.NavSwitch, { debounceMs: 0 });
        void appSoundManager.play(AppSoundCategory.TabSwitch, { debounceMs: 0 });
        navigation?.navigate('Leaderboard');
    };

    const openShop = () => {
        void appSoundManager.play(AppSoundCategory.NavSwitch, { debounceMs: 0 });
        void appSoundManager.play(AppSoundCategory.TabSwitch, { debounceMs: 0 });
        if (onTabPress) onTabPress('Shop');
        else navigation?.navigate('Main', { screen: 'Shop' });
    };

    const openQuest = () => {
        void appSoundManager.play(AppSoundCategory.NavSwitch, { debounceMs: 0 });
        void appSoundManager.play(AppSoundCategory.TabSwitch, { debounceMs: 0 });
        if (onTabPress) onTabPress('Quests');
        else navigation?.navigate('Main', { screen: 'Quest' });
    };

    const hasHydratedInitialLevelRef = useRef<boolean>(false);
    const prevLevelRef = useRef<number>(1);
    const lastAlertedLevelRef = useRef<number>(0);

    const fetchProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setProfile(data);
                    CACHED_PROFILE = data;
                    const xpFromProfile = data.total_xp || 0;
                    setTotalXP(xpFromProfile);
                    CACHED_TOTAL_XP = xpFromProfile;
                    HAS_FETCHED_INITIALLY_PROFILE = true;

                    if (!hasHydratedInitialLevelRef.current) {
                        prevLevelRef.current = calculateLevelFromXP(xpFromProfile).currentLevel;
                        hasHydratedInitialLevelRef.current = true;
                    }
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
            CACHED_ACTIVE_QUEST_COUNT = activeCount;
            CACHED_COMPLETED_QUEST_COUNT = completedCount;
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
        if (!hasHydratedInitialLevelRef.current) {
            return;
        }

        const newLevel = calculateLevelFromXP(totalXP).currentLevel;
        if (newLevel > prevLevelRef.current) {
            setLevelUpAlertLevel(newLevel);
        }
        prevLevelRef.current = newLevel;
    }, [totalXP]);

    useEffect(() => {
        if (!levelUpAlertLevel) {
            return;
        }

        // Guard against repeated re-renders/re-subscriptions reopening the same alert.
        if (lastAlertedLevelRef.current === levelUpAlertLevel) {
            return;
        }
        lastAlertedLevelRef.current = levelUpAlertLevel;

        try {
            void appSoundManager.play(AppSoundCategory.LevelUp, { force: true, debounceMs: 0 });
        } catch (e) {}

        alert(
            'Level Up!',
            undefined,
            [
                {
                    text: "Let's Go!",
                    onPress: () => {
                        setLevelUpAlertLevel(null);
                    },
                },
            ],
            <LevelUpAlertBody level={levelUpAlertLevel} />,
        );
    }, [alert, levelUpAlertLevel]);

    useEffect(() => {
        let channel: any;
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            channel = supabase.channel('profile_dashboard_changes')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
                    if (payload.new) {
                        setProfile((prev: any) => {
                            const next = { ...prev, ...payload.new };
                            CACHED_PROFILE = next;
                            return next;
                        });
                        if (payload.new.total_xp !== undefined) {
                            setTotalXP(payload.new.total_xp);
                            CACHED_TOTAL_XP = payload.new.total_xp;
                        }
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
                <ScreenHeader
                    title="Profile"
                    right={
                        <Pressable style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]} hitSlop={10} onPress={openSettings}>
                            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} style={styles.settingsIcon} />
                        </Pressable>
                    }
                />

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
                                <Pressable onPress={openEditProfile}>
                                    <Text style={styles.editProfileText}>Edit Profile</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.badgesBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Badges</Text>
                            {state.equippedBadgeIds.length > 0 && (
                                <Pressable style={styles.setLink} onPress={openBadgeSelector}>
                                    <Text style={styles.setLinkText}>Edit</Text>
                                    <Ionicons name="chevron-forward" size={14} color={colors.favor} />
                                </Pressable>
                            )}
                        </View>
                        {state.equippedBadgeIds.length === 0 ? (
                            <Pressable style={styles.badgeEmptyStrip} onPress={openBadgeSelector}>
                                <Ionicons name="ribbon-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.badgeEmptyStripText}>Choose up to 3 badges to show off</Text>
                                <Ionicons name="chevron-forward" size={14} color={colors.favor} />
                            </Pressable>
                        ) : (
                            <View style={styles.badgeRow}>
                                {Array.from({ length: EQUIPPED_BADGE_SLOTS }).map((_, index) => {
                                    const badgeId = state.equippedBadgeIds[index];
                                    const badge = badgeId ? getBadgeById(badgeId) : undefined;
                                    if (!badge) {
                                        return <EmptyBadgeSlot key={index} index={index} onPress={openBadgeSelector} />;
                                    }
                                    return <BadgeSlot key={badge.id} image={badge.icon} label={badge.name} />;
                                })}
                            </View>
                        )}
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

                        <LeaderboardCard onPress={openLeaderboard} />

                        <Pressable style={styles.tokenCard} onPress={openShop}>
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

                        <Pressable style={styles.questCard} onPress={openQuest}>
                            <View style={styles.questLeftCluster}>
                                <Image source={QuestIcon} style={styles.questIcon} />
                                <View>
                                    <Text style={styles.questTitle}>My Quests</Text>
                                    <Text style={styles.questSubtitle}>{activeQuestCount} active · {completedQuestCount} completed</Text>
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

            {state.badgeSelectorVisible && (
                <BadgeSelectorModal
                    initialSelected={state.equippedBadgeIds}
                    onClose={() => setState((prev) => ({ ...prev, badgeSelectorVisible: false }))}
                    onDone={(ids) => setState((prev) => ({ ...prev, equippedBadgeIds: ids, badgeSelectorVisible: false }))}
                />
            )}
            {state.editProfileVisible && (
                <EditProfileModal
                    initialData={{ displayName: displayName === 'Anonymous' ? '' : displayName, bio: profile?.bio || '', major: profile?.major || 'Undeclared', graduationYear: gradYearDisplay }}
                    onClose={() => setState((prev) => ({ ...prev, editProfileVisible: false }))}
                    onSave={async (data: any) => {
                        setProfile((prev: any) => ({ ...prev, display_name: data.displayName, bio: data.bio, major: data.major, graduation_year: data.graduationYear }));
                        setState((prev) => ({ ...prev, editProfileVisible: false }));
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) await supabase.from('profiles').update({ display_name: data.displayName, bio: data.bio, major: data.major, graduation_year: data.graduationYear }).eq('id', user.id);
                            invalidateProfileCache();
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
    header: { paddingHorizontal: screenHeaderTheme.layout.horizontalPadding, paddingTop: screenHeaderTheme.layout.topPadding, paddingBottom: screenHeaderTheme.layout.bottomPadding, height: screenHeaderTheme.layout.height, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    headerTitle: { ...screenHeaderTheme.text.title, color: colors.textPrimary },
    settingsButton: { height: 25, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    settingsIcon: { width: 24, height: 24 },
    scrollContent: { paddingBottom: 112 },
    identityBlock: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
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
    badgesBlock: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.xl, gap: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    blockHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    blockTitle: { ...TYPOGRAPHY.pixelHeading, color: colors.textPrimary },
    setLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    setLinkText: { fontSize: 14, fontWeight: '400', color: colors.favor },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4 },
    badgeSlot: { flex: 1, height: 104, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, paddingVertical: 12 },
    badgeSlotEmpty: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
    badgeSlotEmptyText: { fontSize: 16, fontWeight: '400', color: colors.border },
    badgeEmptyStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
    badgeEmptyStripText: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    badgeImage: { width: 50, height: 50, marginBottom: 6 },
    badgeLabelText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
    reputationBlock: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.xl, gap: 14 },
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
   
    //Leaderboard Card
    leaderboardCard: { height: 64, borderRadius: 14, overflow: 'hidden' },
    leaderboardGradientBorder: { flex: 1, padding: 1, borderRadius: 14 },
    leaderboardInner: { flex: 1, height: '100%', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: withOpacity(colors.surface, 0.96), borderRadius: 14 },
    leaderboardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    leaderboardIcon: { width: 24, height: 24, resizeMode: 'contain' },
    leaderboardTextCluster: { gap: 2 },
    leaderboardTitle: { ...TYPOGRAPHY.pixelLabel, color: colors.textPrimary },
    leaderboardSubtitle: { fontSize: 11, color: colors.textSecondary },
    leaderboardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    leaderboardCta: { fontSize: 13, fontWeight: '600', color: colors.token },
   
    // Token Card
    tokenCard: { height: 64, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.token, backgroundColor: withOpacity(colors.token, 0.12), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tokenLeftCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tokenIcon: { width: 26, height: 26, resizeMode: 'contain' },
    tokenTitle: { ...TYPOGRAPHY.pixelLabel, color: colors.textPrimary },
    tokenSubtitle: { fontSize: 11, color: colors.textSecondary },
    tokenRightCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tokenValue: { fontSize: 22, fontWeight: '700', color: colors.token },
    tokenUnit: { fontSize: 13, color: colors.textSecondary },
   
    // Quest Card
    questCard: { height: 64, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.xp, backgroundColor: withOpacity(colors.xp, 0.12), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    questLeftCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    questIcon: { width: 26, height: 26, resizeMode: 'contain' },
    questTitle: { ...TYPOGRAPHY.pixelLabel, color: colors.textPrimary },
    questSubtitle: { fontSize: 11, color: colors.textSecondary },

    // Level-up alert (mirrors badge-unlock body styling)
    levelUpAlertBody: {
        alignItems: 'center',
        paddingVertical: 8,
        width: '100%',
    },
    levelUpAlertIcon: {
        width: 110,
        height: 110,
        marginBottom: 14,
    },
    levelUpAlertTitleText: {
        fontSize: 13,
        fontFamily: FONTS.display,
        marginBottom: 8,
        textAlign: 'center',
        color: colors.textPrimary,
    },
    levelUpAlertDescriptionText: {
        fontSize: 13,
        fontFamily: 'DMSans-Regular',
        textAlign: 'center',
        lineHeight: 19,
        color: colors.textSecondary,
    },
});