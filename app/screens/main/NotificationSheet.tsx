import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

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
};

export default function NotificationSheet({
    visible,
    onClose,
    onNotificationPress,
    onUnreadCountHint,
}: NotificationSheetProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
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
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }
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

        // 3. Callback to handle navigation (e.g., go to Quest Detail)
        onNotificationPress?.(item);
    };

    const handleDeleteOne = async (item: Notification) => {
        if (!currentUserId) return;

        // optimistic remove
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
        if (!currentUserId) return;

        Alert.alert(
            'Clear notifications',
            'This will remove all notifications from your inbox.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
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

    const renderItem = ({ item }: { item: Notification }) => (
        <Pressable
            style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
            onPress={() => handlePress(item)}
            onLongPress={() => handleDeleteOne(item)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.is_read ? 'notifications-outline' : 'notifications'}
                    size={20}
                    color={!item.is_read ? COLORS.favor : COLORS.textSecondary}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.unreadDot} />}
            <Pressable
                onPress={() => handleDeleteOne(item)}
                hitSlop={10}
                style={styles.deleteButton}
                accessibilityRole="button"
                accessibilityLabel="Delete notification"
            >
                <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
            </Pressable>
        </Pressable>
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
                            <Pressable onPress={onClose} hitSlop={10}>
                                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                            </Pressable>
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={COLORS.favor} />
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>
                                        {errorText ? errorText : 'No notifications yet.'}
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

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    bubbleContainer: {
        position: 'absolute',
        top: 85,
        right: 16,
        width: width * 0.85,
        maxWidth: 340,
        maxHeight: 400,
        // Using transformOrigin to anchor the scale to the top-right
        // @ts-ignore
        transformOrigin: 'top right',
    },
    triangle: {
        width: 0, height: 0,
        borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: COLORS.surface,
        alignSelf: 'flex-end',
        marginRight: 8,
    },
    contentBox: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    clearButton: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, backgroundColor: COLORS.surface2 },
    clearText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    listContent: { paddingBottom: 10 },
    notificationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
    unreadItem: { backgroundColor: 'rgba(239, 68, 68, 0.03)' },
    iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    textContainer: { flex: 1 },
    notificationTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    notificationDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    timeText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.favor, alignSelf: 'center' },
    deleteButton: { marginLeft: 10, padding: 4, borderRadius: 10 },
    emptyState: { padding: 30, alignItems: 'center' },
    emptyText: { color: COLORS.textSecondary },
});