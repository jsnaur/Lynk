import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    SectionList,
    SectionListData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationRow, { NotificationState, NotificationType } from '../../components/rows/NotificationRow';
import { FEED_COLORS } from '../../constants/colors';

export interface Notification {
    id: string;
    type: NotificationType;
    state: NotificationState;
    timestamp: string;
    title?: string;
    description?: string;
    date: 'today' | 'earlier';
}

export interface NotificationSheetProps {
    notifications?: Notification[];
    onClose?: () => void;
    onMarkAllRead?: () => void;
    onNotificationPress?: (notification: Notification) => void;
    isEmpty?: boolean;
}

interface GroupedNotifications {
    today: Notification[];
    earlier: Notification[];
}

const groupNotifications = (notifications: Notification[]): GroupedNotifications => {
    return {
        today: notifications.filter((n) => n.date === 'today'),
        earlier: notifications.filter((n) => n.date === 'earlier'),
    };
};

export default function NotificationSheet({
    notifications = [],
    onClose,
    onMarkAllRead,
    onNotificationPress,
    isEmpty = notifications.length === 0,
}: NotificationSheetProps) {
    const unreadCount = useMemo(
        () => notifications.filter((n) => n.state === 'Unread').length,
        [notifications]
    );

    const grouped = useMemo(
        () => groupNotifications(notifications),
        [notifications]
    );

    if (isEmpty) {
        return (
            <View style={styles.container}>
                {/* Modal Handle */}
                <View style={styles.modalHandle}>
                    <View style={styles.handleBar} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>

                {/* Empty State */}
                <View style={styles.emptyStateContainer}>
                    <Ionicons
                        name="notifications-off"
                        size={40}
                        color={FEED_COLORS.border}
                    />
                    <Text style={styles.emptyTitle}>All caught up</Text>
                    <Text style={styles.emptyDescription}>
                        Notifications from quest activity will appear here
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Modal Handle */}
            <View style={styles.modalHandle}>
                <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadChip}>
                            <Text style={styles.unreadChipText}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Pressable onPress={onMarkAllRead}>
                    <Text style={styles.markAllReadButton}>Mark all read</Text>
                </Pressable>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Today Section */}
                {grouped.today.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionLabelContainer}>
                            <Text style={styles.sectionLabel}>TODAY</Text>
                        </View>
                        <View style={styles.sectionList}>
                            {grouped.today.map((notification) => (
                                <NotificationRow
                                    key={notification.id}
                                    type={notification.type}
                                    state={notification.state}
                                    timestamp={notification.timestamp}
                                    title={notification.title}
                                    description={notification.description}
                                    onPress={() => onNotificationPress?.(notification)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Earlier Section */}
                {grouped.earlier.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionLabelContainer}>
                            <Text style={styles.sectionLabel}>EARLIER</Text>
                        </View>
                        <View style={styles.sectionList}>
                            {grouped.earlier.map((notification) => (
                                <NotificationRow
                                    key={notification.id}
                                    type={notification.type}
                                    state={notification.state}
                                    timestamp={notification.timestamp}
                                    title={notification.title}
                                    description={notification.description}
                                    onPress={() => onNotificationPress?.(notification)}
                                />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: FEED_COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    modalHandle: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: FEED_COLORS.border,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
    },
    unreadChip: {
        backgroundColor: FEED_COLORS.error,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    unreadChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
    },
    markAllReadButton: {
        fontSize: 13,
        fontWeight: '400',
        color: FEED_COLORS.favor,
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        marginBottom: 0,
    },
    sectionLabelContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: FEED_COLORS.border,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '400',
        color: FEED_COLORS.textPrimary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    sectionList: {
        borderTopWidth: 1,
        borderTopColor: FEED_COLORS.border,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: FEED_COLORS.textPrimary,
    },
    emptyDescription: {
        fontSize: 13,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
        textAlign: 'center',
    },
});
