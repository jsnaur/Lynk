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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import BottomNav, { MainTab } from '../../components/BottomNav';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useTokenBalance } from '../../contexts/TokenContext';

// Profile Assets - SVGs
import VerifiedIcon from "../../../assets/ProfileAssets/Verified_Icon.svg";
import SettingsIcon from "../../../assets/ProfileAssets/Settings_Icon.svg";
import QuestIcon from "../../../assets/ProfileAssets/Quest_Icon.svg";

import BadgeSelectorModal from './BadgeSelectorModal';
import EditProfileModal from './EditProfileModal';

const ASSETS = {
    accessory: require("../../../assets/ProfileAssets/Accessory_Face.png"),
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
                position: 'relative',
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

// XP Thresholds
const XP_THRESHOLDS = [
    0, 1000, 3000, 6000, 10000, 15000, 22000, 31000, 42000, 55000,
];

function calculateLevelFromXP(totalXP: number) {
    let currentLevel = 1;
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
        if (totalXP >= XP_THRESHOLDS[i]) {
            currentLevel = i + 1;
        } else {
            break;
        }
    }

    const currentThreshold = XP_THRESHOLDS[currentLevel - 1] || 0;
    const nextThreshold = XP_THRESHOLDS[currentLevel] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 5000;
    
    const xpInCurrentLevel = totalXP - currentThreshold;
    const xpNeededForNextLevel = nextThreshold - currentThreshold;
    const progressPercent = Math.min(1, xpInCurrentLevel / xpNeededForNextLevel);

    return {
        currentLevel,
        xpInCurrentLevel,
        xpNeededForNextLevel,
        progressPercent,
    };
}

// Integrated robust container to guarantee rendering
function BadgeSlot({ image, label }: { image: any; label?: string }) {
    return (
        <View style={styles.badgeSlot}>
            <Image source={image} style={styles.badgeImage} resizeMode="contain" />
            {label && <Text style={styles.badgeLabelText} numberOfLines={1}>{label}</Text>}
        </View>
    );
}

export default function ProfileDashboardScreen({ onTabPress, navigation }: ProfileDashboardScreenProps) {
    const { balance } = useTokenBalance();
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState<boolean>(true);
    const [totalXP, setTotalXP] = useState<number>(0); 
    const [state, setState] = useState<ProfileState>({ 
        badgeSelectorVisible: false,
        editProfileVisible: false,
    });

    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile(data);
                    setTotalXP(data.total_xp || 0);
                }
            }
        } finally {
            setProfileLoading(false);
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
        });

        void fetchProfile();

        return unsubscribe;
    }, [fetchProfile, navigation]);

    useEffect(() => {
        let channel: any;
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            channel = supabase.channel('profile_dashboard_changes')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                    (payload) => {
                        if (payload.new) {
                            setProfile((prev: any) => ({ ...prev, ...payload.new }));
                            if (payload.new.total_xp !== undefined) {
                                setTotalXP(payload.new.total_xp);
                            }
                        }
                    }
                )
                .subscribe();
        };

        setupRealtime();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, []);

    const levelData = calculateLevelFromXP(totalXP);
    const currentLevel = levelData.currentLevel;
    const nextLevel = Math.min(currentLevel + 1, 10);
    const karmaProgress = levelData.progressPercent;
    const xpInLevel = levelData.xpInCurrentLevel;
    const xpForNextLevel = levelData.xpNeededForNextLevel;

    const profileAccessories = normalizeAccessories(profile?.equipped_accessories);

    const gradYearDisplay = profile?.graduation_year || profile?.graduationYear || '2027';
    const shortYear = gradYearDisplay.slice(-2);
    const majorDisplay = profile?.major || 'Undeclared';
    const displayName = profile?.display_name || profile?.displayName || 'Anonymous';
    const bioDisplay = profile?.bio || 'Tell your campus a little about yourself...';

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Pressable 
                        style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
                        hitSlop={10}
                        onPress={() => navigation?.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} style={styles.settingsIcon} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.identityBlock}>
                        <View style={styles.identityRow}>
                            <View style={styles.avatarColumn}>
                                <View style={styles.avatarFrame}>
                                    {profileLoading ? (
                                        <View style={styles.loadingAvatarIconWrap}>
                                            <Ionicons name="person" size={42} color={COLORS.textPrimary} />
                                        </View>
                                    ) : (
                                        <LayeredAvatar accessories={profileAccessories} size={72} scale={1.5} translateY={4} />
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
                                <Pressable
                                    onPress={() => setState({ ...state, editProfileVisible: true })}
                                >
                                    <Text style={styles.editProfileText}>Edit Profile</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.badgesBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Badges</Text>
                            <Pressable 
                                style={styles.setLink}
                                onPress={() => setState({ ...state, badgeSelectorVisible: true })}
                            >
                                <Text style={styles.setLinkText}>Set</Text>
                                <Ionicons name="chevron-forward" size={14} color={COLORS.favor} />
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
                            <Text style={styles.karmaValueText}>{xpInLevel} / {xpForNextLevel}</Text>
                        </View>

                        <View style={styles.progressTrack}>
                            <LinearGradient
                                colors={[COLORS.xp, COLORS.favor]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[styles.progressFill, { width: `${karmaProgress * 100}%` }]}
                            />
                        </View>

                        <View style={styles.levelRow}>
                            <Text style={styles.levelRangeText}>LVL {currentLevel}</Text>
                            <Text style={styles.levelRangeText}>LVL {nextLevel}</Text>
                        </View>

                        <Pressable 
                            style={styles.tokenCard}
                            onPress={() => {
                                if (onTabPress) onTabPress('Shop');
                                else navigation?.navigate('Main', { screen: 'Shop' });
                            }}
                        >
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
                                <Ionicons name="chevron-forward" size={16} color={COLORS.token} />
                            </View>
                        </Pressable>

                        <Pressable 
                            style={styles.questsShortcut}
                            onPress={() => {
                                if (onTabPress) onTabPress('Quests');
                                else navigation?.navigate('Main', { screen: 'Quest' });
                            }}
                        >
                            <View style={styles.questsLeftCluster}>
                                <QuestIcon width={26} height={26} />
                                <View>
                                    <Text style={styles.questsTitle}>My Quests</Text>
                                    <Text style={styles.questsSubtitle}>3 active · 2 completed</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <BottomNav activeTab="Profile" onTabPress={onTabPress} />

            {state.badgeSelectorVisible && (
                <BadgeSelectorModal
                    onClose={() => setState({ ...state, badgeSelectorVisible: false })}
                    onDone={(badges) => {
                        setState({ ...state, badgeSelectorVisible: false });
                    }}
                />
            )}

            {state.editProfileVisible && (
                <EditProfileModal
                    initialData={{
                        displayName: displayName === 'Anonymous' ? '' : displayName,
                        bio: profile?.bio || '',
                        major: profile?.major || 'Undeclared',
                        graduationYear: gradYearDisplay,
                    }}
                    onClose={() => setState({ ...state, editProfileVisible: false })}
                    onSave={async (data: any) => {
                        // 1. OPTIMISTIC UPDATE: Instantly change the UI
                        setProfile((prev: any) => ({
                            ...prev,
                            display_name: data.displayName,
                            bio: data.bio,
                            major: data.major,
                            graduation_year: data.graduationYear
                        }));

                        // 2. Close the modal instantly
                        setState({ ...state, editProfileVisible: false });

                        // 3. Save to Supabase
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                const { error } = await supabase
                                    .from('profiles')
                                    .update({
                                        display_name: data.displayName,
                                        bio: data.bio,
                                        major: data.major,
                                        graduation_year: data.graduationYear
                                    })
                                    .eq('id', user.id);
                                    
                                if (error) {
                                    console.error("Supabase Save Error:", error.message);
                                }
                            }
                            
                            await fetchProfile(); 
                        } catch (e) {
                            console.error("Error updating profile", e);
                        } 
                    }}
                />
            )}
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
        paddingHorizontal: 20,
        paddingBottom: 12,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 0.2,
    },
    settingsButton: {
        height: 44,
        width: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        width: 24,
        height: 24,
    },
    scrollContent: {
        paddingBottom: 112,
    },
    identityBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    identityRow: {
        flexDirection: 'row',
        gap: 18,
    },
    avatarColumn: {
        alignItems: 'center',
        gap: 8,
    },
    avatarFrame: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: COLORS.surface2,
        borderWidth: 2,
        borderColor: COLORS.border,
        overflow: 'hidden',
        position: 'relative',
    },
    loadingAvatarIconWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    identityTextColumn: {
        flex: 1,
        gap: 8,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    nameText: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    verifiedBadge: {
        width: 18,
        height: 18,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    bioText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    editProfileText: {
        fontSize: 12,
        color: COLORS.favor,
    },
    badgesBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    blockHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blockTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    setLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    setLinkText: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.favor,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: -4, 
    },
    badgeSlot: {
        flex: 1,
        height: 104,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        paddingVertical: 12,
    },
    badgeImage: {
        width: 50,
        height: 50,
        marginBottom: 6,
    },
    badgeLabelText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    reputationBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 14,
    },
    rankChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(0,245,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0,245,255,0.2)',
    },
    rankChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.favor,
    },
    karmaLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    karmaTitleCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    karmaIcon: {
        width: 18,
        height: 18,
    },
    karmaTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    karmaValueText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.surface2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    levelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    levelRangeText: {
        fontSize: 8,
        fontWeight: '700',
        color: COLORS.textSecondary,
        fontFamily: 'monospace',
    },
    tokenCard: {
        height: 64,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tokenLeftCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tokenIcon: {
        width: 26,
        height: 26,
    },
    tokenTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    tokenSubtitle: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    tokenRightCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tokenValue: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.token,
    },
    tokenUnit: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    questsShortcut: {
        height: 64,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    questsLeftCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    questIcon: {
        width: 26,
        height: 26,
    },
    questsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    questsSubtitle: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
});