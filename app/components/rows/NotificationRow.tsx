import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

// 1. Updated types to strictly match the Supabase Trigger output
export type NotificationType =
    | 'quest_applied'
    | 'applicant_accepted'
    | 'quest_started'
    | 'quest_completed'
    | 'high_bounty_quest'
    | 'new_comment';

export type NotificationState = 'Unread' | 'Read';

export interface NotificationRowProps {
    type?: string; // Kept as string to prevent crashes on unknown DB types
    state?: NotificationState;
    timestamp?: string;
    title?: string;
    description?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: ViewStyle;
}

const getNotificationIcon = (
    type: string
): { name: string; color: string } => {
    switch (type) {
        case 'high_bounty_quest':
        case 'quest_completed':
            return { name: 'cash', color: COLORS.token };
        case 'quest_started':
            return { name: 'play-circle', color: COLORS.xp };
        case 'quest_applied':
            return { name: 'person-add', color: COLORS.item };
        case 'applicant_accepted':
            return { name: 'checkmark-circle', color: COLORS.favor };
        case 'new_comment':
            return { name: 'chatbubble', color: COLORS.favor };
        default:
            return { name: 'notifications', color: COLORS.textSecondary };
    }
};

const getBackgroundColor = (
    type: string,
    state: NotificationState
): string => {
    if (state === 'Read') return 'transparent';

    switch (type) {
        case 'high_bounty_quest':
        case 'quest_completed':
            return withOpacity(COLORS.token, 0.12);
        case 'quest_started':
            return withOpacity(COLORS.xp, 0.12);
        case 'quest_applied':
            return withOpacity(COLORS.item, 0.12);
        case 'applicant_accepted':
        case 'new_comment':
            return withOpacity(COLORS.favor, 0.12);
        default:
            return withOpacity(COLORS.surface2, 0.5);
    }
};

export default function NotificationRow({
    type = 'unknown',
    state = 'Unread',
    timestamp = 'Just now',
    title = 'New Notification',
    description = 'You have a new update.',
    onPress,
    onLongPress,
    style,
}: NotificationRowProps) {
    const icon = getNotificationIcon(type);
    const backgroundColor = getBackgroundColor(type, state);

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={300}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: pressed ? withOpacity(COLORS.surface2, 0.5) : backgroundColor },
                style,
            ]}
        >
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: withOpacity(COLORS.bg, 0.2) }]}>
                <Ionicons
                    name={icon.name as any}
                    size={20}
                    color={icon.color}
                />
            </View>

            {/* Content Block */}
            <View style={styles.contentBlock}>
                <Text
                    style={styles.title}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text
                    style={styles.description}
                    numberOfLines={2}
                >
                    {description}
                </Text>
                <Text style={styles.timestamp}>
                    {timestamp}
                </Text>
            </View>

            {/* Unread Indicator */}
            {state === 'Unread' && <View style={styles.unreadDot} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentBlock: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        fontFamily: FONTS.body,
    },
    description: {
        fontSize: 13,
        fontWeight: '400',
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        lineHeight: 18,
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '400',
        color: '#666677',
        fontFamily: FONTS.body,
        marginTop: 2,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.favor,
        marginLeft: 4,
    },
});