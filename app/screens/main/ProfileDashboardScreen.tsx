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

type ProfileDashboardScreenProps = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any;
};

const ASSETS = {
    accessory: 'https://www.figma.com/api/mcp/asset/896aa530-68d4-4277-823f-edaae0d25958',
    verified: 'https://www.figma.com/api/mcp/asset/8dda60a4-f071-4d2e-bbe5-0932df03db77',
    karma: 'https://www.figma.com/api/mcp/asset/2c747f0b-508a-41c2-a932-193d4ffc47a8',
    token: 'https://www.figma.com/api/mcp/asset/28cb6206-7d98-4074-8184-9534b6107164',
};

const avatarAssets = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6
];

const ACTIVE_QUESTS = [
    { id: 'aq-1', title: 'Help Feed Cats', role: 'You posted', status: 'Awaiting approval', stripe: FEED_COLORS.favor, roleColor: FEED_COLORS.textSecondary, statusColor: FEED_COLORS.textSecondary },
    { id: 'aq-2', title: 'Need Tutor for Calculus', role: 'You accepted', status: 'In progress', stripe: FEED_COLORS.study, roleColor: FEED_COLORS.favor, statusColor: FEED_COLORS.xp },
    { id: 'aq-3', title: 'Borrow Sci-Cal', role: 'You posted', status: 'Pending resolution', stripe: FEED_COLORS.item, roleColor: FEED_COLORS.textSecondary, statusColor: FEED_COLORS.item },
] as const;

type QuestRowProps = {
    title: string;
    role: string;
    status: string;
    stripe: string;
    roleColor: string;
    statusColor: string;
};

function StatChip({ value, label }: { value: string; label: string }) {
    return (
        <View style={styles.statChip}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function QuestRow({ title, role, status, stripe, roleColor, statusColor }: QuestRowProps) {
    return (
        <Pressable style={styles.questRow}>
            <View style={[styles.questStripe, { backgroundColor: stripe }]} />
            <View style={styles.questTextWrap}>
                <Text style={styles.questTitle} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.questMetaRow}>
                    <Text style={[styles.questMetaText, { color: roleColor }]}>{role}</Text>
                    <View style={styles.separatorDot} />
                    <Text style={[styles.questMetaText, { color: statusColor }]}>{status}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={FEED_COLORS.border} />
        </Pressable>
    );
}

export default function ProfileDashboardScreen({ onTabPress, navigation }: ProfileDashboardScreenProps) {
    const [profile, setProfile] = useState<any>(null);

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
                }
            }
        };
        fetchProfile();
    }, []);

    const karmaValue = 1240;
    const karmaGoal = 2000;
    const karmaProgress = Math.min(1, karmaValue / karmaGoal);

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
                        <Ionicons name="settings-sharp" size={20} color={FEED_COLORS.textSecondary} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.identityBlock}>
                        <View style={styles.identityRow}>
                            <View style={styles.avatarColumn}>
                                <View style={styles.avatarFrame}>
                                    <SelectedAvatar width={72} height={72} style={styles.avatarSvg} />
                                    <Image source={{ uri: ASSETS.accessory }} style={styles.avatarLayer} />
                                    <View style={styles.levelBadge}>
                                        <Text style={styles.levelBadgeText}>7</Text>
                                    </View>
                                </View>
                                <Pressable>
                                    <Text style={styles.changeText}>Change</Text>
                                </Pressable>
                            </View>

                            <View style={styles.identityTextColumn}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>{displayName}</Text>
                                    <Image source={{ uri: ASSETS.verified }} style={styles.verifiedBadge} />
                                </View>
                                <Text style={styles.subtitle}>{majorDisplay} - Class of '{shortYear}</Text>

                                <View style={styles.statsRow}>
                                    <StatChip value="24" label="Renown" />
                                    <View style={styles.statDivider} />
                                    <StatChip value="11" label="Quests" />
                                    <View style={styles.statDivider} />
                                    <StatChip value="31" label="Kudos" />
                                </View>
                            </View>
                        </View>

                        <Pressable style={styles.editButton}>
                            <Ionicons name="create-outline" size={14} color={FEED_COLORS.textSecondary} />
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </Pressable>
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
                                <Image source={{ uri: ASSETS.karma }} style={styles.karmaIcon} />
                                <Text style={styles.karmaTitle}>KARMA</Text>
                            </View>
                            <Text style={styles.karmaValueText}>1,240 / 2,000</Text>
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
                            <Text style={styles.levelRangeText}>LVL 7</Text>
                            <Text style={styles.levelRangeText}>LVL 8</Text>
                        </View>

                        <Pressable style={styles.tokenCard}>
                            <View style={styles.tokenLeftCluster}>
                                <Image source={{ uri: ASSETS.token }} style={styles.tokenIcon} />
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
                    </View>

                    <View style={styles.activeQuestsBlock}>
                        <View style={styles.blockHeaderRow}>
                            <Text style={styles.blockTitle}>Active Quests</Text>
                            <View style={styles.activeCountBadge}>
                                <Text style={styles.activeCountText}>3</Text>
                            </View>
                        </View>

                        {ACTIVE_QUESTS.map((quest) => (
                            <QuestRow
                                key={quest.id}
                                title={quest.title}
                                role={quest.role}
                                status={quest.status}
                                stripe={quest.stripe}
                                roleColor={quest.roleColor}
                                statusColor={quest.statusColor}
                            />
                        ))}
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
        fontSize: 34,
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
    scrollContent: {
        paddingBottom: 112,
    },
    identityBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 20,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    identityRow: {
        flexDirection: 'row',
        gap: 16,
    },
    avatarColumn: {
        alignItems: 'center',
        gap: 8,
    },
    avatarFrame: {
        width: 96,
        height: 96,
        borderRadius: 20,
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 2,
        borderColor: FEED_COLORS.border,
        overflow: 'hidden',
        position: 'relative',
    },
    avatarSvg: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    avatarLayer: {
        position: 'absolute',
        left: 12,
        top: 12,
        width: 72,
        height: 72,
    },
    levelBadge: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: FEED_COLORS.favor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: FEED_COLORS.bg,
    },
    levelBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: FEED_COLORS.bg,
    },
    changeText: {
        fontSize: 12,
        color: FEED_COLORS.favor,
        fontWeight: '500',
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
        fontSize: 32,
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
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 6,
    },
    statChip: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 8,
    },
    statValue: {
        fontSize: 30,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
    },
    statLabel: {
        fontSize: 11,
        color: FEED_COLORS.textSecondary,
    },
    statDivider: {
        height: 28,
        width: 1,
        backgroundColor: FEED_COLORS.border,
    },
    editButton: {
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: FEED_COLORS.textSecondary,
    },
    reputationBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    blockHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blockTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
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
    },
    levelRangeText: {
        fontSize: 9,
        fontWeight: '600',
        color: FEED_COLORS.textSecondary,
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
        fontSize: 34,
        fontWeight: '700',
        color: FEED_COLORS.token,
    },
    tokenUnit: {
        fontSize: 13,
        color: FEED_COLORS.textSecondary,
    },
    activeQuestsBlock: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    activeCountBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(57,255,20,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(57,255,20,0.25)',
    },
    activeCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: FEED_COLORS.item,
    },
    questRow: {
        height: 78,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    questStripe: {
        width: 3,
        height: 52,
        borderRadius: 2,
    },
    questTextWrap: {
        flex: 1,
        paddingVertical: 8,
        gap: 3,
    },
    questTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
    },
    questMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    questMetaText: {
        fontSize: 11,
    },
    separatorDot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: FEED_COLORS.textSecondary,
    },
});