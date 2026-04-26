import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import BottomNav, { MainTab } from '../../components/BottomNav';
import PostCard from '../../components/cards/PostCard';
import PostCardSkeleton from '../../components/cards/PostCardSkeleton';
import { FEED_FILTERS, FeedCategory, FeedQuest } from '../../constants/categories';
import { supabase } from '../../lib/supabase';
import { getPersonalizedFeed } from '../../services/FeedAlgorithmService';
import NotificationSheet from './NotificationSheet';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { useTheme } from '../../contexts/ThemeContext';

type HomeFeedScreenProps = {
    onTabPress?: (tab: MainTab) => void;
    navigation?: any; 
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

function getAccessoryById(accessoryId?: string | null) {
    if (!accessoryId) return undefined;
    return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

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

// --- MODULE LEVEL CACHE ---
let CACHED_QUESTS: any[] = [];
let CACHED_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {};
let HAS_FETCHED_INITIALLY = false;

export default function HomeFeedScreen({ onTabPress, navigation }: HomeFeedScreenProps) {
    const { theme, colors } = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);

    const FILTER_ACTIVE_COLORS: Record<FeedCategory, string> = useMemo(() => ({
        favor: colors.favor,
        study: colors.study,
        item: colors.item,
    }), [colors]);

    const [activeFilter, setActiveFilter] = useState<FeedCategory | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);
    
    const [initialLoading, setInitialLoading] = useState(!HAS_FETCHED_INITIALLY);
    const [quests, setQuests] = useState<any[]>(CACHED_QUESTS); 
    const [currentUserAccessories, setCurrentUserAccessories] = useState<Partial<Record<AvatarSlot, string>>>(CACHED_ACCESSORIES);
    
    const [isNotifOpen, setIsNotifOpen] = useState(false); 
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const notifChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const fetchProfile = async (forceRefresh = false) => {
        if (HAS_FETCHED_INITIALLY && !forceRefresh) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('equipped_accessories')
                .eq('id', user.id)
                .single();
            if (data?.equipped_accessories) {
                CACHED_ACCESSORIES = data.equipped_accessories as Partial<Record<AvatarSlot, string>>;
                setCurrentUserAccessories(CACHED_ACCESSORIES);
            }
        }
    };

    const fetchUnreadNotifCount = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                setUnreadNotifCount(0);
                return;
            }

            const { count, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            setUnreadNotifCount(count ?? 0);
        } catch (e: any) {
            console.error('fetchUnreadNotifCount error:', e?.message ?? e);
        }
    };

    const fetchQuests = async (forceRefresh = false) => {
        if (HAS_FETCHED_INITIALLY && !forceRefresh) {
            setInitialLoading(false);
            return;
        }

        try {
            let lat = 10.2975;
            let lon = 123.8803;

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const servicesEnabled = await Location.hasServicesEnabledAsync();
                    if (servicesEnabled) {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        lat = loc.coords.latitude;
                        lon = loc.coords.longitude;
                    }
                }
            } catch (err: any) {
                console.log("Silent fallback to CIT location due to:", err.message);
            }

            const formatQuests = (rawQuests: any[]) => {
                return rawQuests.map((q: any) => ({
                    id: q.id,
                    category: q.category.toLowerCase() as FeedCategory,
                    ago: timeAgo(q.created_at),
                    title: q.title,
                    preview: q.description,
                    posterName: q.poster_name || 'Anonymous',
                    posterAccessories: q.equipped_accessories || {},
                    xp: 50 + (q.bonus_xp || 0), 
                    token: q.token_bounty,
                }));
            };

            const aiSortedQuests = await getPersonalizedFeed(
                lat, 
                lon, 
                undefined, 
                (fastQuests) => {
                    const formatted = formatQuests(fastQuests);
                    CACHED_QUESTS = formatted;
                    HAS_FETCHED_INITIALLY = true;
                    setQuests(formatted);
                    setInitialLoading(false);
                    setRefreshing(false); 
                }
            );

            const finalFormatted = formatQuests(aiSortedQuests);
            CACHED_QUESTS = finalFormatted;
            HAS_FETCHED_INITIALLY = true;
            setQuests(finalFormatted);
            setInitialLoading(false);
            setRefreshing(false);

        } catch (error) {
            console.error('Error fetching quests:', error);
            setInitialLoading(false);
            setRefreshing(false);
        }
    };

    const ensureNotificationsSubscription = useCallback(async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) return;

            if (notifChannelRef.current) return;

            const channel = supabase
                .channel(`notifications:recipient_id=eq.${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `recipient_id=eq.${user.id}`,
                    },
                    async () => {
                        await fetchUnreadNotifCount();
                    },
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        fetchUnreadNotifCount();
                    }
                });

            notifChannelRef.current = channel;
        } catch (e: any) {
            console.error('ensureNotificationsSubscription error:', e?.message ?? e);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchQuests();
        fetchUnreadNotifCount();
        ensureNotificationsSubscription();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation?.addListener?.('focus', () => {
            fetchUnreadNotifCount();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        return () => {
            const channel = notifChannelRef.current;
            if (channel) {
                supabase.removeChannel(channel);
                notifChannelRef.current = null;
            }
        };
    }, []);

    const onProfilePress = useCallback(() => {
        onTabPress?.('Profile');
    }, [onTabPress]);

    const handleBottomNavPress = useCallback((tab: MainTab) => {
        if (tab === 'Feed') {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            setRefreshing(true);
            fetchProfile(true);
            fetchQuests(true);
        } else {
            onTabPress?.(tab);
        }
    }, [onTabPress]);

    const filteredQuests = useMemo(() => {
        if (activeFilter === 'all') {
            return quests;
        }
        return quests.filter((quest) => quest.category === activeFilter);
    }, [activeFilter, quests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile(true);
        fetchQuests(true);
    }, []);

    return (
        <View style={styles.root}>
            {/* Adapts status bar icons based on active theme */}
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        style={styles.profileButton}
                        onPress={onProfilePress}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                        accessibilityRole="button"
                    >
                        <View style={styles.avatarChip}>
                            {(!currentUserAccessories || Object.keys(currentUserAccessories).length === 0) ? (
                                <Ionicons name="person" size={22} color={colors.textPrimary} />
                            ) : (
                                <View style={styles.avatarPreview}>
                                    {ALL_SLOTS_Z_ORDER.map(slot => {
                                        const accId = currentUserAccessories[slot];
                                        if (!accId) return null;
                                        const item = getAccessoryById(accId);
                                        if (!item) return null;
                                        const Sprite = item.Sprite;
                                        return (
                                            <View key={slot} style={styles.avatarLayer} pointerEvents="none">
                                                <Sprite width="100%" height="100%" />
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </Pressable>

                    <Text style={styles.logo}>LYNK</Text>

                    <Pressable
                        style={styles.notificationWrapper}
                        onPress={() => setIsNotifOpen(true)}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                        accessibilityRole="button"
                    >
                        <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
                        
                        {unreadNotifCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                                </Text>
                            </View>
                        )}
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

                {initialLoading ? (
                    <ScrollView contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
                        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
                            <PostCardSkeleton key={`post-skeleton-${index}`} />
                        ))}
                    </ScrollView>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredQuests}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.feedContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={onRefresh} 
                                tintColor={colors.favor} 
                                colors={[colors.favor]}  
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateTitle}>No quests found</Text>
                                <Text style={styles.emptyStateSubtitle}>
                                    Try changing your filters or check back later.
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <PostCard
                                quest={item as any}
                                onPress={() => navigation?.navigate?.('QuestDetail', { quest: item })}
                            />
                        )}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={true}
                    />
                )}
            </SafeAreaView>

            <BottomNav activeTab="Feed" onTabPress={handleBottomNavPress} />
            
            {isNotifOpen && (
                <NotificationSheet 
                    visible={isNotifOpen} 
                    onClose={() => {
                        setIsNotifOpen(false);
                        fetchUnreadNotifCount();
                    }} 
                    onUnreadCountHint={(count) => setUnreadNotifCount(count)}
                    onNotificationPress={async (item) => {
                        try {
                            setIsNotifOpen(false);
                            fetchUnreadNotifCount();

                            if (!item.reference_id) return;

                            const validClickableTypes = [
                                'quest_applied', 
                                'applicant_accepted', 
                                'quest_started', 
                                'quest_completed', 
                                'high_bounty_quest', 
                                'new_comment'
                            ];

                            if (validClickableTypes.includes(item.type)) {
                                const { data, error } = await supabase
                                    .from('quests')
                                    .select(`
                                        id,
                                        user_id,
                                        category,
                                        title,
                                        description,
                                        created_at,
                                        bonus_xp,
                                        token_bounty,
                                        accepted_by,
                                        status,
                                        max_participants,
                                        is_auto_accept,
                                        profiles!quests_user_id_fkey(display_name, equipped_accessories)
                                    `)
                                    .eq('id', item.reference_id)
                                    .single();

                                if (error || !data) {
                                    console.error('Failed to load quest for notification:', error?.message);
                                    return;
                                }

                                const poster = Array.isArray((data as any).profiles)
                                    ? (data as any).profiles[0]
                                    : (data as any).profiles;

                                const questForNav: any = {
                                    id: data.id,
                                    category: String(data.category).toLowerCase() as FeedCategory,
                                    title: data.title,
                                    preview: data.description,
                                    posterName: poster?.display_name || 'Anonymous',
                                    posterAccessories: poster?.equipped_accessories || {},
                                    ago: timeAgo(data.created_at),
                                    xp: 50 + (data.bonus_xp || 0),
                                    token: data.token_bounty || 0,
                                    user_id: data.user_id,
                                    description: data.description,
                                    bonus_xp: data.bonus_xp || 0,
                                    token_bounty: data.token_bounty || 0,
                                    accepted_by: data.accepted_by ?? undefined,
                                    status: data.status,
                                    max_participants: data.max_participants,
                                    is_auto_accept: data.is_auto_accept,
                                };

                                navigation?.navigate?.('QuestDetail', { quest: questForNav });
                            }
                        } catch (e: any) {
                            console.error('Notification press handler error:', e?.message ?? e);
                        }
                    }}
                />
            )}
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    safeArea: { flex: 1 },
    header: { borderBottomWidth: 1, borderBottomColor: colors.border, height: 76, position: 'relative', paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    avatarChip: { width: 36, height: 36, borderRadius: 18, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarPreview: { width: 32, height: 32, borderRadius: 16, position: 'relative', overflow: 'hidden' },
    avatarLayer: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 2 }, { translateY: 1 }] },
    profileButton: { borderRadius: 24, position: 'relative', zIndex: 3, elevation: 3 },
    logo: { color: colors.textPrimary, fontSize: 27, letterSpacing: 3, lineHeight: 30, position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' },
    filterBar: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    filterChip: { flex: 1, minHeight: 36, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    filterChipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    feedContent: { padding: 16, gap: 12, paddingBottom: 112 },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
    emptyStateTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
    emptyStateSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    notificationWrapper: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.error, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.bg, paddingHorizontal: 4, zIndex: 2 },
    notificationBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
});