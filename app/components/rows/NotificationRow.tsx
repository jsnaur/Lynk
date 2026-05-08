import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ViewStyle,
    Animated,
    GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';

// 1. Updated types to strictly match the Supabase Trigger output
export type NotificationType =
    | 'quest_applied'
    | 'applicant_accepted'
    | 'quest_started'
    | 'quest_completed'
    | 'quest_dropped'
    | 'high_bounty_quest'
    | 'new_comment'
    | 'new_reply';

export type NotificationState = 'Unread' | 'Read';

export interface NotificationRowProps {
    type?: string; // Kept as string to prevent crashes on unknown DB types
    state?: NotificationState;
    timestamp?: string;
    title?: string;
    description?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    onSwipeLeft?: () => void;
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
        case 'new_reply':
            return { name: 'chatbubble-ellipses', color: COLORS.study };
        case 'quest_dropped':
            return { name: 'exit', color: COLORS.error };
        case 'daily_reward':
            return { name: 'gift', color: COLORS.xp };
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
        case 'new_reply':
            return withOpacity(COLORS.study, 0.12);
        case 'quest_dropped':
            return withOpacity(COLORS.error, 0.12);
        case 'daily_reward':
            return withOpacity(COLORS.xp, 0.12);
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
    onSwipeLeft,
    style,
}: NotificationRowProps) {
    const icon = getNotificationIcon(type);
    const backgroundColor = getBackgroundColor(type, state);
    const isFirstRenderRef = React.useRef(true);
    const previousStateRef = React.useRef<NotificationState>(state);
    const previousTimestampRef = React.useRef(timestamp);
    const translateX = React.useRef(new Animated.Value(0)).current;
    const touchStartRef = React.useRef({ x: 0, y: 0 });
    const latestDxRef = React.useRef(0);
    const isDraggingRef = React.useRef(false);

    React.useEffect(() => {
        const isUnread = state === 'Unread';
        const becameUnread = previousStateRef.current !== 'Unread' && isUnread;
        const justArrivedUnread =
            isFirstRenderRef.current &&
            isUnread &&
            timestamp.toLowerCase() === 'just now';
        const justNowTimestampUpdated =
            !isFirstRenderRef.current &&
            isUnread &&
            timestamp.toLowerCase() === 'just now' &&
            previousTimestampRef.current !== timestamp;

        if (becameUnread || justArrivedUnread || justNowTimestampUpdated) {
            void appSoundManager.play(AppSoundCategory.GlassBells, {
                volume: 0.92,
                rate: 1.08,
                debounceMs: 300,
            });
        }

        previousStateRef.current = state;
        previousTimestampRef.current = timestamp;
        isFirstRenderRef.current = false;
    }, [state, timestamp]);

    const deleteOpacity = translateX.interpolate({
        inputRange: [-90, -24, 0],
        outputRange: [1, 0.35, 0],
        extrapolate: 'clamp',
    });

    const resetPosition = React.useCallback(() => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
        }).start();
    }, [translateX]);

    const triggerSwipeDelete = React.useCallback(() => {
        Animated.timing(translateX, {
            toValue: -140,
            duration: 160,
            useNativeDriver: true,
        }).start(() => {
            onSwipeLeft?.();
            translateX.setValue(0);
        });
    }, [onSwipeLeft, translateX]);

    const handleTouchStart = React.useCallback((event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        touchStartRef.current = { x: pageX, y: pageY };
        latestDxRef.current = 0;
        isDraggingRef.current = false;
    }, []);

    const handleTouchMove = React.useCallback((event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        const dx = pageX - touchStartRef.current.x;
        const dy = pageY - touchStartRef.current.y;
        latestDxRef.current = dx;

        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
            isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
            translateX.setValue(Math.min(0, Math.max(dx, -120)));
        }
    }, [translateX]);

    const handleTouchEnd = React.useCallback(() => {
        const dx = latestDxRef.current;
        const didDrag = isDraggingRef.current;
        isDraggingRef.current = false;

        if (didDrag) {
            if (dx <= -90) {
                triggerSwipeDelete();
            } else {
                resetPosition();
            }
            return;
        }

        onPress?.();
    }, [onPress]);

    return (
        <View style={styles.swipeContainer}>
            <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
                <Ionicons name="trash-outline" size={18} color={COLORS.textPrimary} />
                <Text style={styles.deleteText}>Clear</Text>
            </Animated.View>
            <Animated.View
                style={{ transform: [{ translateX }] }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={resetPosition}
            >
                <Pressable
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
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeContainer: {
        overflow: 'hidden',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 90,
        backgroundColor: withOpacity(COLORS.error, 0.9),
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    deleteText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
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