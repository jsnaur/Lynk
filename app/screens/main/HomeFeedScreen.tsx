import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav, { MainTab } from '../../components/BottomNav';
import PostCard from '../../components/cards/PostCard';
import PostCardSkeleton from '../../components/cards/PostCardSkeleton';
import SelectedAvatarContent from '../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg';
import TokenPixelIcon from '../../../assets/ShopAssets/Token_Pixel_Icon.svg';
import { FEED_FILTERS, FeedCategory, FeedQuest } from '../../constants/categories';
import { FEED_COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

type HomeFeedScreenProps = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any; // Added to support React Navigation from feature-login
};

const FILTER_ACTIVE_COLORS: Record<FeedCategory, string> = {
    favor: FEED_COLORS.favor,
    study: FEED_COLORS.study,
    item: FEED_COLORS.item,
};

function withAlpha(hexColor: string, alpha: number) {
    const hex = hexColor.replace('#', '');
    const safeHex =
        hex.length === 3
            ? hex
                    .split('')
                    .map((char) => char + char)
                    .join('')
            : hex;

    const r = Number.parseInt(safeHex.slice(0, 2), 16);
    const g = Number.parseInt(safeHex.slice(2, 4), 16);
    const b = Number.parseInt(safeHex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Utility to format timestamp nicely
function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
}

const SKELETON_CARD_COUNT = 4;

export default function HomeFeedScreen({ onTabPress, navigation }: HomeFeedScreenProps) {
    const [activeFilter, setActiveFilter] = useState<FeedCategory | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [quests, setQuests] = useState<FeedQuest[]>([]);

    const fetchQuests = async () => {
        try {
            const { data, error } = await supabase
                .from('quests')
                .select('*, profiles!quests_user_id_fkey(display_name, first_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedQuests: FeedQuest[] = data.map((q: any) => ({
                id: q.id,
                category: q.category.toLowerCase() as FeedCategory,
                ago: timeAgo(q.created_at),
                title: q.title,
                preview: q.description,
                posterName: q.profiles?.display_name || q.profiles?.first_name || 'Anonymous',
                xp: 50 + q.bonus_xp, // Assuming BASE_XP is 50
                token: q.token_bounty,
            }));
            
            setQuests(formattedQuests);
        } catch (error) {
            console.error('Error fetching quests:', error);
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    };

    // Load quests on mount
    useEffect(() => {
        fetchQuests();
    }, []);

    // Refresh listener for active screen transitions (optional based on navigator setup)
    useEffect(() => {
        const unsubscribe = navigation?.addListener?.('focus', () => {
            fetchQuests();
        });
        return unsubscribe;
    }, [navigation]);

    const onProfilePress = useCallback(() => {
        onTabPress?.('Profile');
    }, [onTabPress]);

    const filteredQuests = useMemo(() => {
        if (activeFilter === 'all') {
            return quests;
        }
        return quests.filter((quest) => quest.category === activeFilter);
    }, [activeFilter, quests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchQuests();
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        style={styles.profileButton}
                        onPress={onProfilePress}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                        accessibilityRole="button"
                        accessibilityLabel="Open profile"
                    >
                        <View style={styles.avatarChip}>
                            <SelectedAvatarContent width={32} height={32} />
                        </View>
                    </Pressable>

                    <Text style={styles.logo}>LYNK</Text>

                    <Pressable
                        style={({ pressed }) => [styles.karmaChip, pressed && styles.karmaChipPressed]}
                        onPress={() => onTabPress?.('Shop')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Open shop"
                    >
                        <TokenPixelIcon width={16} height={16} />
                        <Text style={styles.karmaText}>1,240</Text>
                    </Pressable>
                </View>

                <View style={styles.filterBar}>
                    {FEED_FILTERS.map((filter) => {
                        const selected = activeFilter === filter.key;
                        const activeColor = FILTER_ACTIVE_COLORS[filter.key];

                        return (
                            <Pressable
                                key={filter.key}
                                style={[
                                    styles.filterChip,
                                    selected && {
                                        borderColor: activeColor,
                                        borderWidth: 1.5,
                                        backgroundColor: withAlpha(activeColor, 0.12),
                                    },
                                ]}
                                onPress={() =>
                                    setActiveFilter((current) =>
                                        current === filter.key ? 'all' : filter.key,
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        selected && { color: activeColor, fontWeight: '600' },
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <ScrollView
                    contentContainerStyle={styles.feedContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={FEED_COLORS.favor} // iOS spinner color
                            colors={[FEED_COLORS.favor]}  // Android spinner color
                        />
                    }
                >
                    {initialLoading ? (
                        Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                            <PostCardSkeleton key={`post-skeleton-${index}`} />
                        ))
                    ) : filteredQuests.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateTitle}>No quests found</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Try changing your filters or check back later.
                            </Text>
                        </View>
                    ) : (
                        filteredQuests.map((quest) => (
                            <PostCard
                                key={quest.id}
                                quest={quest}
                                onPress={() => navigation?.navigate?.('QuestDetail', { quest })}
                            />
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>

            <BottomNav activeTab="Feed" onTabPress={onTabPress} />
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
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
        height: 76,
        position: 'relative',
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    avatarChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: FEED_COLORS.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    profileButton: {
        borderRadius: 24,
        position: 'relative',
        zIndex: 3,
        elevation: 3,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    logo: {
        color: FEED_COLORS.textPrimary,
        fontSize: 30,
        letterSpacing: 4,
        lineHeight: 32,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 12,
        textAlign: 'center',
    },
    karmaChip: {
        minWidth: 96,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    karmaChipPressed: {
        opacity: 0.85,
    },
    karmaIcon: {
        width: 16,
        height: 16,
    },
    karmaText: {
        fontSize: 13,
        color: FEED_COLORS.token,
        fontWeight: '500',
    },
    filterBar: {
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    filterChip: {
        flex: 1,
        minHeight: 36,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipText: {
        fontSize: 13,
        color: FEED_COLORS.textSecondary,
        fontWeight: '500',
    },
    feedContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 112,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: FEED_COLORS.textSecondary,
        textAlign: 'center',
    },
});