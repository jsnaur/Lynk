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

export type NotificationType =
    | 'Quest_Accepted'
    | 'Quest_Completed'
    | 'XP_Milestone'
    | 'Token_Earned'
    | 'Rating_Received_Positive'
    | 'Rating_Received_Negative'
    | 'New_Comment';

export type NotificationState = 'Unread' | 'Read';

export interface NotificationRowProps {
    type?: NotificationType;
    state?: NotificationState;
    timestamp?: string;
    title?: string;
    description?: string;
    onPress?: () => void;
    style?: ViewStyle;
}

const getNotificationIcon = (
    type: NotificationType
): { name: string; color: string } => {
    switch (type) {
        case 'Token_Earned':
            return { name: 'cash', color: COLORS.token };
        case 'XP_Milestone':
            return { name: 'trending-up', color: COLORS.xp };
        case 'Quest_Completed':
            return { name: 'flag', color: COLORS.item };
        case 'Rating_Received_Positive':
            return { name: 'thumbs-up', color: COLORS.favor };
        case 'Rating_Received_Negative':
            return { name: 'thumbs-down', color: COLORS.study };
        case 'New_Comment':
            return { name: 'chatbubble', color: COLORS.favor };
        case 'Quest_Accepted':
        default:
            return { name: 'checkmark-circle', color: COLORS.favor };
    }
};

const getBackgroundColor = (
    type: NotificationType,
    state: NotificationState
): string => {
    if (state === 'Read') return 'transparent';

    switch (type) {
        case 'Token_Earned':
            return withOpacity(COLORS.token, 0.12);
        case 'XP_Milestone':
            return withOpacity(COLORS.xp, 0.12);
        case 'Quest_Completed':
            return withOpacity(COLORS.item, 0.12);
        case 'Rating_Received_Negative':
            return withOpacity(COLORS.study, 0.12);
        case 'Quest_Accepted':
        case 'Rating_Received_Positive':
        case 'New_Comment':
        default:
            return withOpacity(COLORS.favor, 0.12);
    }
};

const getTitleText = (type: NotificationType): string => {
    switch (type) {
        case 'Token_Earned':
            return '+[#] Tokens earned';
        case 'XP_Milestone':
            return "Level up! You're now Level [#]";
        case 'Quest_Completed':
            return '[Name] marked your quest as completed';
        case 'Rating_Received_Positive':
            return 'You received a positive rating';
        case 'Rating_Received_Negative':
            return 'You received a rating';
        case 'New_Comment':
            return '[Name] commented on your quest';
        case 'Quest_Accepted':
        default:
            return '[Name] accepted your quest';
    }
};

const getDescriptionText = (type: NotificationType): string => {
    switch (type) {
        case 'Token_Earned':
            return 'From completing "[Quest title]"';
        case 'XP_Milestone':
            return 'Keep completing quests to reach Level [#]';
        case 'Quest_Completed':
            return '[Quest title] + prompt to rate them';
        case 'Rating_Received_Positive':
        case 'Rating_Received_Negative':
            return '[Name] rated your help on "[Quest title]"';
        case 'New_Comment':
            return '"Sample comment or sample reply"';
        case 'Quest_Accepted':
        default:
            return 'Brief description of the quest title';
    }
};

const shouldShowTimestamp = (type: NotificationType, state: NotificationState): boolean => {
    if (state === 'Read') return true;
    return ['Quest_Completed', 'XP_Milestone', 'Token_Earned'].includes(type);
};

export default function NotificationRow({
    type = 'Quest_Accepted',
    state = 'Unread',
    timestamp = 'Time ago',
    title,
    description,
    onPress,
    style,
}: NotificationRowProps) {
    const icon = getNotificationIcon(type);
    const backgroundColor = getBackgroundColor(type, state);
    const displayTitle = title || getTitleText(type);
    const displayDescription = description || getDescriptionText(type);
    const showTimestamp = shouldShowTimestamp(type, state);

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.container,
                { backgroundColor },
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
                    numberOfLines={2}
                >
                    {displayTitle}
                </Text>
                <Text
                    style={styles.description}
                    numberOfLines={2}
                >
                    {displayDescription}
                </Text>
                {showTimestamp && (
                    <Text style={styles.timestamp}>
                        {timestamp}
                    </Text>
                )}
            </View>

            {/* Unread Indicator */}
            {state === 'Unread' &&
                ['Quest_Accepted', 'Quest_Completed', 'XP_Milestone', 'Token_Earned'].includes(
                    type
                ) && <View style={styles.unreadDot} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentBlock: {
        flex: 1,
        gap: 3,
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
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '400',
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.favor,
        marginLeft: 4,
    },
});