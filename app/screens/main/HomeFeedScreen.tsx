import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
    Image,
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
import { FEED_FILTERS, FEED_QUESTS, FeedCategory } from '../../constants/categories';
import { FEED_COLORS } from '../../constants/colors';

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

const ASSETS = {
    avatar: 'https://www.figma.com/api/mcp/asset/6715062c-bca9-48f9-ba13-f6c2c3c9eae8',
    karma: 'https://www.figma.com/api/mcp/asset/02102752-bb60-4ddb-ad7d-c37658b24ba3',
};

export default function HomeFeedScreen({ onTabPress, navigation }: HomeFeedScreenProps) {
    const [activeFilter, setActiveFilter] = useState<FeedCategory | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const onProfilePress = useCallback(() => {
        onTabPress?.('Profile');
    }, [onTabPress]);

    const filteredQuests = useMemo(() => {
        if (activeFilter === 'all') {
            return FEED_QUESTS;
        }
        return FEED_QUESTS.filter((quest) => quest.category === activeFilter);
    }, [activeFilter]);

    // Simulates a network fetch when the user pulls down the feed
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            // In the future, re-fetch FEED_QUESTS from Supabase here
            setRefreshing(false);
        }, 1500);
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
                            <Image source={{ uri: ASSETS.avatar }} style={styles.avatar} />
                        </View>
                    </Pressable>

                    <Text style={styles.logo}>LYNK</Text>

                    <View style={styles.karmaChip}>
                        <Image source={{ uri: ASSETS.karma }} style={styles.karmaIcon} />
                        <Text style={styles.karmaText}>1,240</Text>
                    </View>
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
                    {filteredQuests.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateTitle}>No quests found</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Try changing your filters or check back later.
                            </Text>
                        </View>
                    ) : (
                        filteredQuests.map((quest) => (
                            <PostCard key={quest.id} quest={quest} />
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