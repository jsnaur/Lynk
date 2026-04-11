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
import { useEffect, useState } from 'react';
import BottomNav, { MainTab } from '../../components/BottomNav';
import { FEED_COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

// Local Avatars
import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";

// Profile Assets - SVGs
import VerifiedIcon from "../../../assets/ProfileAssets/Verified_Icon.svg";
import SettingsIcon from "../../../assets/ProfileAssets/Settings_Icon.svg";
import QuestIcon from "../../../assets/ProfileAssets/Quest_Icon.svg";

// Profile Assets - PNGs
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

const avatarAssets = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6
];

type QuestRowProps = {
    title: string;
    count: string;
};

// XP Thresholds: cumulative XP required to reach each level (capped at Level 10)
const XP_THRESHOLDS = [
    0,       // Level 1
    1000,    // Level 2
    3000,    // Level 3
    6000,    // Level 4
    10000,   // Level 5
    15000,   // Level 6
    22000,   // Level 7
    31000,   // Level 8
    42000,   // Level 9
    55000,   // Level 10
];

function calculateLevelFromXP(totalXP: number): {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progressPercent: number;
} {
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

function BadgeSlot({ image }: { image: any }) {
    return (
        <View style={styles.badgeSlot}>
            <Image source={image} style={styles.badgeImage} />
        </View>
    );
}

export default function ProfileDashboardScreen({ onTabPress, navigation }: ProfileDashboardScreenProps) {
    const [profile, setProfile] = useState<any>(null);
    const [totalXP, setTotalXP] = useState<number>(0); // Default starting XP (Level 1)

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile(data);
                    // Fetch total_xp from profile or default to 0
                    setTotalXP(data.total_xp || 0);
                }
            }
        };
        fetchProfile();
    }, []);

    // Calculate level and progress from total XP
    const levelData = calculateLevelFromXP(totalXP);
    const currentLevel = levelData.currentLevel;
    const nextLevel = Math.min(currentLevel + 1, 10); // Cap at level 10
    const karmaProgress = levelData.progressPercent;
    const xpInLevel = levelData.xpInCurrentLevel;
    const xpForNextLevel = levelData.xpNeededForNextLevel;

    const SelectedAvatar = profile?.avatar_index !== undefined && profile.avatar_index !== null 
        ? avatarAssets[profile.avatar_index] 
        : avatarAssets[0];

    const shortYear = profile?.graduation_year ? profile.graduation_year.slice(-2) : '27';
    const majorDisplay = profile?.major || 'Undeclared';
    const displayName = profile?.display_name || 'Anonymous';

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
                        <Ionicons name="settings-outline" size={24} color={FEED_COLORS.textPrimary} style={styles.settingsIcon} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Identity Hero Block */}
                    <View style={styles.identityBlock}>
                        <View style={styles.identityRow}>
                            <View style={styles.avatarColumn}>
                                <View style={styles.avatarFrame}>
                                    <SelectedAvatar width={72} height={72} style={styles.avatarSvg} />
                                    <Image source={ASSETS.accessory} style={styles.avatarLayer} />
                                </View>
                            </View>

                            <View style={styles.identityTextColumn}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>{displayName}</Text>
                                    <VerifiedIcon width={18} height={18} />
                                </View>
                                <Text style={styles.subtitle}>{majorDisplay} · Class of '{shortYear}</Text>
                                <Text style={styles.bioText}>This is my bio. Sample text.</Text>
                                <Pressable>
                                    <Text style={styles.editProfileText}>Edit Profile</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Badges Section */}
                    <View style={styles.badgesBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Badges</Text>
                            <Pressable style={styles.setLink}>
                                <Text style={styles.setLinkText}>Set</Text>
                                <Ionicons name="chevron-forward" size={14} color={FEED_COLORS.favor} />
                            </Pressable>
                        </View>
                        <View style={styles.badgeRow}>
                            <BadgeSlot image={ASSETS.badgeShield} />
                            <BadgeSlot image={ASSETS.badgeMedal} />
                            <BadgeSlot image={ASSETS.badgeHat} />
                        </View>
                    </View>

                    {/* Reputation Block */}
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
                                colors={[FEED_COLORS.xp, FEED_COLORS.favor]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={[styles.progressFill, { width: `${karmaProgress * 100}%` }]}
                            />
                        </View>

                        <View style={styles.levelRow}>
                            <Text style={styles.levelRangeText}>LVL {currentLevel}</Text>
                            <Text style={styles.levelRangeText}>LVL {nextLevel}</Text>
                        </View>

                        <Pressable style={styles.tokenCard}>
                            <View style={styles.tokenLeftCluster}>
                                <Image source={ASSETS.token} style={styles.tokenIcon} />
                                <View>
                                    <Text style={styles.tokenTitle}>Token Balance</Text>
                                    <Text style={styles.tokenSubtitle}>Spend in the Shop</Text>
                                </View>
                            </View>

                            <View style={styles.tokenRightCluster}>
                                <Text style={styles.tokenValue}>52</Text>
                                <Text style={styles.tokenUnit}>TKN</Text>
                                <Ionicons name="chevron-forward" size={16} color={FEED_COLORS.token} />
                            </View>
                        </Pressable>

                        {/* My Quests Row */}
                        <Pressable style={styles.questsShortcut}>
                            <View style={styles.questsLeftCluster}>
                                <QuestIcon width={26} height={26} />
                                <View>
                                    <Text style={styles.questsTitle}>My Quests</Text>
                                    <Text style={styles.questsSubtitle}>3 active · 2 completed</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={FEED_COLORS.border} />
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <BottomNav activeTab="Profile" onTabPress={onTabPress} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: FEED_COLORS.bg,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
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
        borderBottomColor: FEED_COLORS.border,
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
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 2,
        borderColor: FEED_COLORS.border,
        overflow: 'hidden',
        position: 'relative',
    },
    avatarSvg: {
        position: 'absolute',
        top: 14,
        left: 14,
    },
    avatarLayer: {
        position: 'absolute',
        left: 14,
        top: 14,
        width: 72,
        height: 72,
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
        color: FEED_COLORS.textPrimary,
    },
    verifiedBadge: {
        width: 18,
        height: 18,
    },
    subtitle: {
        fontSize: 13,
        color: FEED_COLORS.textSecondary,
    },
    bioText: {
        fontSize: 13,
        color: FEED_COLORS.textPrimary,
        fontWeight: '500',
    },
    editProfileText: {
        fontSize: 12,
        color: FEED_COLORS.favor,
    },
    badgesBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    blockHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blockTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
    },
    setLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    setLinkText: {
        fontSize: 14,
        fontWeight: '400',
        color: FEED_COLORS.favor,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
    },
    badgeSlot: {
        flex: 1,
        height: 112,
        borderRadius: 14,
        backgroundColor: FEED_COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    badgeImage: {
        width: 72,
        height: 72,
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
        color: FEED_COLORS.favor,
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
        color: FEED_COLORS.textPrimary,
    },
    karmaValueText: {
        fontSize: 13,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: FEED_COLORS.surface2,
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
        color: FEED_COLORS.textSecondary,
        fontFamily: 'monospace',
    },
    tokenCard: {
        height: 64,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
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
        color: FEED_COLORS.textPrimary,
    },
    tokenSubtitle: {
        fontSize: 11,
        color: FEED_COLORS.textSecondary,
    },
    tokenRightCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tokenValue: {
        fontSize: 22,
        fontWeight: '700',
        color: FEED_COLORS.token,
    },
    tokenUnit: {
        fontSize: 13,
        color: FEED_COLORS.textSecondary,
    },
    questsShortcut: {
        height: 64,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
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
        color: FEED_COLORS.textPrimary,
    },
    questsSubtitle: {
        fontSize: 11,
        color: FEED_COLORS.textSecondary,
    },
    logOutContainer: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 12,
    },
    logOutButton: {
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,77,77,0.3)',
        borderWidth: 1,
        borderColor: FEED_COLORS.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logOutButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: FEED_COLORS.error,
    },
});