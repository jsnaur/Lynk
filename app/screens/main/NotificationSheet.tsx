import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    Dimensions,
    Animated,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import { supabase } from '../../lib/supabase';
import NotificationRow from '../../components/rows/NotificationRow';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';
import { useNotificationPreferences } from '../../contexts/NotificationPreferencesContext';

type ThemeColors = Record<keyof typeof darkColors, string>;

type Notification = {
    id: string;
    created_at: string;
    title: string;
    description: string;
    is_read: boolean;
    type: string;
    reference_id?: string;
};

type NotificationSheetProps = {
    visible: boolean;
    onClose: () => void;
    onNotificationPress?: (notification: Notification) => void;
    onUnreadCountHint?: (unreadCount: number) => void;
    dailyRewardClaimable?: boolean;
    onDailyRewardPress?: () => void;
};

const DAILY_REWARD_NOTIF_ID = 'daily-reward-synthetic';

export default function NotificationSheet({
    visible,
    onClose,
    onNotificationPress,
    onUnreadCountHint,
    dailyRewardClaimable,
    onDailyRewardPress,
}: NotificationSheetProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { isTypeAllowed } = useNotificationPreferences();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { alert } = useCustomAlert();
    const navigation = useNavigation<any>();
    const previousVisibleRef = useRef(false);

    const validClickableTypes = [
        'new_quest',
        'comment',
        'reply',
        'new_comment',
        'new_reply',
        'quest_accepted',
        'applicant_accepted',
        'quest_started',
        'quest_completed',
        'quest_dropped',
        'high_bounty_quest',
    ];

    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const navigateToNotificationDestination = async (item: Notification) => {
        if (!item.reference_id || !validClickableTypes.includes(item.type)) return;

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

        if (!data || error) {
            Alert.alert(
                'Destination not available',
                'This notification destination is no longer available.',
            );
            return;
        }

        const isPoster = data.user_id === currentUserId;
        let isAcceptedParticipant = false;
        if (!isPoster && currentUserId) {
            const { data: participantData } = await supabase
                .from('quest_participants')
                .select('status')
                .eq('quest_id', data.id)
                .eq('user_id', currentUserId)
                .single();
            isAcceptedParticipant = participantData?.status === 'accepted';
        }

        if (data.status !== 'open' && !isPoster && !isAcceptedParticipant) {
            Alert.alert(
                'Quest unavailable',
                'This quest is closed to the public and cannot be opened from notifications.',
            );
            return;
        }

        const poster = Array.isArray((data as any).profiles)
            ? (data as any).profiles[0]
            : (data as any).profiles;

        const questForNav: any = {
            id: data.id,
            category: String(data.category).toLowerCase(),
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

        const shouldScrollToComments = ['comment', 'reply', 'new_comment', 'new_reply'].includes(item.type);

        onClose?.();
        navigation.navigate('QuestDetail', { quest: questForNav, scrollToComments: shouldScrollToComments });
    };

    useEffect(() => {
        if (visible) {
            if (!previousVisibleRef.current) {
                void appSoundManager.play(AppSoundCategory.NavSwitch, { debounceMs: 0 });
            }
            fetchNotifications();
            // Pop-out Animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            if (previousVisibleRef.current) {
                void appSoundManager.play(AppSoundCategory.PostExpand, { debounceMs: 0 });
            }
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }

        previousVisibleRef.current = visible;
    }, [visible]);

    const fetchNotifications = async () => {
        setErrorText(null);
        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (!user) {
                setCurrentUserId(null);
                setNotifications([]);
                setErrorText('You are not logged in.');
                return;
            }
            setCurrentUserId(user.id);

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data ?? []);

            const unread = (data ?? []).reduce((acc, n) => acc + (n?.is_read ? 0 : 1), 0);
            onUnreadCountHint?.(unread);
        } catch (e: any) {
            console.error('fetchNotifications error:', e?.message ?? e);
            setErrorText('Failed to load notifications.');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = async (item: Notification) => {
        if (item.id === DAILY_REWARD_NOTIF_ID) {
            onDailyRewardPress?.();
            return;
        }

        // 1. Optimistic UI update
        setNotifications(prev =>
            prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
        );

        // 2. Update Database
        if (!item.is_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', item.id);
        }

        // 3. Use parent callback if present, otherwise navigate directly
        if (onNotificationPress) {
            await onNotificationPress(item);
            return;
        }

        await navigateToNotificationDestination(item);
    };

    const handleDeleteOne = async (item: Notification) => {
        if (item.id === DAILY_REWARD_NOTIF_ID) return;
        if (!currentUserId) return;

        const prev = notifications;
        setNotifications((cur) => cur.filter((n) => n.id !== item.id));
        onUnreadCountHint?.(
            prev.reduce((acc, n) => acc + (n.id !== item.id && !n.is_read ? 1 : 0), 0),
        );

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', item.id)
            .eq('recipient_id', currentUserId);

        if (error) {
            console.error('delete notification error:', error.message);
            setNotifications(prev);
            onUnreadCountHint?.(prev.reduce((acc, n) => acc + (!n.is_read ? 1 : 0), 0));
            Alert.alert('Error', 'Failed to delete notification.');
        }
    };

    const handleClearAll = async () => {
        if (!currentUserId || notifications.length === 0) return;

        alert(
            'Clear notifications',
            'This will remove all notifications from your inbox.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    onPress: async () => {
                        const prev = notifications;
                        setNotifications([]);
                        onUnreadCountHint?.(0);

                        const { error } = await supabase
                            .from('notifications')
                            .delete()
                            .eq('recipient_id', currentUserId);

                        if (error) {
                            console.error('clear notifications error:', error.message);
                            setNotifications(prev);
                            onUnreadCountHint?.(prev.reduce((acc, n) => acc + (!n.is_read ? 1 : 0), 0));
                            Alert.alert('Error', 'Failed to clear notifications.');
                        }
                    },
                },
            ],
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    const displayNotifications = useMemo<Notification[]>(() => {
        const filtered = notifications.filter(n => isTypeAllowed(n.type));
        if (!dailyRewardClaimable || !isTypeAllowed('daily_reward')) return filtered;
        const synthetic: Notification = {
            id: DAILY_REWARD_NOTIF_ID,
            created_at: new Date().toISOString(),
            title: 'Daily Reward Available',
            description: 'Tap to claim your daily login reward.',
            is_read: false,
            type: 'daily_reward',
        };
        return [synthetic, ...filtered];
    }, [dailyRewardClaimable, notifications, isTypeAllowed]);

    const renderItem = ({ item }: { item: Notification }) => (
        <NotificationRow
            type={item.type}
            state={item.is_read ? 'Read' : 'Unread'}
            title={item.title}
            description={item.description}
            timestamp={timeAgo(item.created_at)}
            onPress={() => handlePress(item)}
            onSwipeLeft={() => handleDeleteOne(item)}
        />
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <Animated.View 
                style={[
                    styles.bubbleContainer, 
                    { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
                ]}
            >
                <View style={styles.triangle} />
                <View style={styles.contentBox}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <View style={styles.headerActions}>
                            <Pressable onPress={handleClearAll} hitSlop={10} style={styles.clearButton}>
                                <Text style={styles.clearText}>Clear</Text>
                            </Pressable>
                            <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: 8 }}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 40 }} color={colors.favor} />
                    ) : (
                        <FlatList
                            data={displayNotifications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="notifications-off-outline" size={40} color={colors.border} />
                                    <Text style={styles.emptyText}>
                                        {errorText ? errorText : "You're all caught up!"}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    bubbleContainer: {
        position: 'absolute',
        top: 85,
        right: 16,
        width: width * 0.88,
        maxWidth: 380,
        height: 480, // Giving it a bit more fixed height for scrollability
        // @ts-ignore
        transformOrigin: 'top right',
    },
    triangle: {
        width: 0, height: 0,
        borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: COLORS.surface,
        alignSelf: 'flex-end',
        marginRight: 12,
    },
    contentBox: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    clearButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: COLORS.surface2 },
    clearText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    listContent: { paddingBottom: 16 },
    emptyState: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});