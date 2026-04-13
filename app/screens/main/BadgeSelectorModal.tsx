import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Image,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type BadgeState = 'default' | 'selected' | 'disabled';

interface Badge {
    id: string;
    label: string;
    category: 'quest' | 'reputation' | 'special';
    state: BadgeState;
}

type BadgeSelectorModalProps = {
    onClose?: () => void;
    onDone?: (selectedBadges: string[]) => void;
    maxBadges?: number;
};

const BADGE_DATA: Badge[] = [
    // Quest Milestones
    { id: 'quest-1', label: 'First Quest', category: 'quest', state: 'selected' },
    { id: 'quest-2', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-3', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-4', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-5', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-6', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-7', label: 'Achiever', category: 'quest', state: 'selected' },
    { id: 'quest-8', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-9', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-10', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-11', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-12', label: 'Sample Quest', category: 'quest', state: 'default' },
    { id: 'quest-13', label: 'Sample Quest', category: 'quest', state: 'disabled' },
    { id: 'quest-14', label: 'Sample Quest', category: 'quest', state: 'disabled' },
    { id: 'quest-15', label: 'Sample Quest', category: 'quest', state: 'disabled' },
    { id: 'quest-16', label: 'Sample Quest', category: 'quest', state: 'disabled' },

    // Reputation
    { id: 'rep-1', label: 'First Quest', category: 'reputation', state: 'selected' },
    { id: 'rep-2', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-3', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-4', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-5', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-6', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-7', label: 'Achiever', category: 'reputation', state: 'selected' },
    { id: 'rep-8', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-9', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-10', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-11', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-12', label: 'Sample Quest', category: 'reputation', state: 'default' },
    { id: 'rep-13', label: 'Sample Quest', category: 'reputation', state: 'disabled' },
    { id: 'rep-14', label: 'Sample Quest', category: 'reputation', state: 'disabled' },
    { id: 'rep-15', label: 'Sample Quest', category: 'reputation', state: 'disabled' },
    { id: 'rep-16', label: 'Sample Quest', category: 'reputation', state: 'disabled' },

    // Special
    { id: 'special-1', label: 'First Quest', category: 'special', state: 'selected' },
    { id: 'special-2', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-3', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-4', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-5', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-6', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-7', label: 'Achiever', category: 'special', state: 'selected' },
    { id: 'special-8', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-9', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-10', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-11', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-12', label: 'Sample Quest', category: 'special', state: 'default' },
    { id: 'special-13', label: 'Sample Quest', category: 'special', state: 'disabled' },
    { id: 'special-14', label: 'Sample Quest', category: 'special', state: 'disabled' },
    { id: 'special-15', label: 'Sample Quest', category: 'special', state: 'disabled' },
    { id: 'special-16', label: 'Sample Quest', category: 'special', state: 'disabled' },
];

interface BadgeItemProps {
    badge: Badge;
    onPress?: (badgeId: string) => void;
}

function BadgeItem({ badge, onPress }: BadgeItemProps) {
    const isDefault = badge.state === 'default';
    const isSelected = badge.state === 'selected';
    const isDisabled = badge.state === 'disabled';

    const containerBg = isSelected
        ? 'rgba(0, 245, 255, 0.1)'
        : isDefault
          ? FEED_COLORS.surface2
          : FEED_COLORS.surface;

    const borderColor = isSelected
        ? FEED_COLORS.favor
        : isDefault
          ? FEED_COLORS.border
          : FEED_COLORS.border;

    const borderWidth = isSelected ? 2 : 1;
    const labelColor = isSelected
        ? FEED_COLORS.favor
        : isDisabled
          ? FEED_COLORS.border
          : FEED_COLORS.textSecondary;

    return (
        <Pressable
            style={styles.badgeWrapper}
            onPress={() => !isDisabled && onPress?.(badge.id)}
            disabled={isDisabled}
        >
            <View
                style={[
                    styles.badgeContainer,
                    {
                        backgroundColor: containerBg,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                    },
                ]}
            >
                <Ionicons
                    name="ribbon"
                    size={32}
                    color={isDisabled ? 'rgba(138, 138, 154, 0.3)' : '#FFD700'}
                    style={{ opacity: isDisabled ? 0.3 : 1 }}
                />
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons
                            name="checkmark"
                            size={10}
                            color={FEED_COLORS.bg}
                        />
                    </View>
                )}
            </View>
            <Text
                style={[
                    styles.badgeLabel,
                    { color: labelColor },
                    isSelected && styles.badgeLabelSelected,
                ]}
                numberOfLines={1}
            >
                {badge.label}
            </Text>
        </Pressable>
    );
}

export default function BadgeSelectorModal({
    onClose,
    onDone,
    maxBadges = 3,
}: BadgeSelectorModalProps) {
    const [badges, setBadges] = useState(BADGE_DATA);
    const selectedCount = badges.filter((b) => b.state === 'selected').length;

    const handleBadgePress = (badgeId: string) => {
        setBadges((prevBadges) =>
            prevBadges.map((badge) => {
                if (badge.id === badgeId) {
                    if (badge.state === 'selected') {
                        return { ...badge, state: 'default' };
                    } else if (selectedCount < maxBadges) {
                        return { ...badge, state: 'selected' };
                    }
                }
                return badge;
            })
        );
    };

    const handleDone = () => {
        const selectedBadges = badges
            .filter((b) => b.state === 'selected')
            .map((b) => b.id);
        onDone?.(selectedBadges);
    };

    const questBadges = badges.filter((b) => b.category === 'quest');
    const reputationBadges = badges.filter((b) => b.category === 'reputation');
    const specialBadges = badges.filter((b) => b.category === 'special');

    const selectedBadges = badges
        .filter((b) => b.state === 'selected')
        .slice(0, 3);

    return (
        <View style={styles.container}>
            {/* Modal Handle */}
            <View style={styles.modalHandle}>
                <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Choose Badges</Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedCount} of {maxBadges} selected
                    </Text>
                </View>
                <Pressable
                    style={styles.doneButton}
                    onPress={handleDone}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
            </View>

            {/* Selected Badges Preview */}
            <View style={styles.previewSection}>
                {Array.from({ length: maxBadges }).map((_, index) => {
                    const badge = selectedBadges[index];
                    const isFilled = !!badge;
                    const isEmpty = !badge;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.badgeSlot,
                                isFilled && styles.badgeSlotFilled,
                                isEmpty && styles.badgeSlotEmpty,
                            ]}
                        >
                            {isFilled && badge?.label === 'Achiever' && (
                                <Ionicons
                                    name="star"
                                    size={32}
                                    color="#FFD700"
                                />
                            )}
                            {isFilled && badge?.label !== 'Achiever' && (
                                <Ionicons
                                    name="ribbon"
                                    size={32}
                                    color="#FFD700"
                                />
                            )}
                            {isEmpty && (
                                <Text style={styles.badgeSlotEmptyText}>
                                    {index + 1}
                                </Text>
                            )}
                            {!isEmpty && (
                                <View style={styles.slotDot}>
                                    <View style={styles.slotDotInner} />
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Badge Grid Sections */}
            <ScrollView
                style={styles.badgeGridContainer}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
            >
                {/* Quest Milestones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUEST MILESTONES</Text>
                    <View style={styles.badgeGrid}>
                        {questBadges.map((badge) => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                onPress={handleBadgePress}
                            />
                        ))}
                    </View>
                </View>

                {/* Reputation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>REPUTATION</Text>
                    <View style={styles.badgeGrid}>
                        {reputationBadges.map((badge) => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                onPress={handleBadgePress}
                            />
                        ))}
                    </View>
                </View>

                {/* Special */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SPECIAL</Text>
                    <View style={styles.badgeGrid}>
                        {specialBadges.map((badge) => (
                            <BadgeItem
                                key={badge.id}
                                badge={badge}
                                onPress={handleBadgePress}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Toast Message */}
            {selectedCount === maxBadges && (
                <View style={styles.toast}>
                    <Ionicons
                        name="information-circle"
                        size={14}
                        color={FEED_COLORS.textSecondary}
                    />
                    <Text style={styles.toastText}>Deselect a badge to swap it</Text>
                </View>
            )}
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
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
    },
    doneButton: {
        backgroundColor: FEED_COLORS.favor,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    doneButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: FEED_COLORS.bg,
    },
    previewSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: FEED_COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    badgeSlot: {
        width: 64,
        height: 64,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: FEED_COLORS.border,
    },
    badgeSlotFilled: {
        backgroundColor: FEED_COLORS.surface2,
        borderColor: FEED_COLORS.favor,
        borderWidth: 1.5,
    },
    badgeSlotEmpty: {
        backgroundColor: FEED_COLORS.bg,
        borderColor: FEED_COLORS.border,
        borderStyle: 'dashed',
    },
    badgeSlotEmptyText: {
        fontSize: 16,
        fontWeight: '400',
        color: FEED_COLORS.border,
    },
    slotDot: {
        position: 'absolute',
        bottom: 4.5,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: FEED_COLORS.favor,
    },
    slotDotInner: {
        flex: 1,
    },
    badgeGridContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: FEED_COLORS.textSecondary,
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    badgeWrapper: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 10,
    },
    badgeContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        position: 'relative',
    },
    checkBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 12,
        backgroundColor: FEED_COLORS.favor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: FEED_COLORS.bg,
    },
    badgeLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
        textAlign: 'center',
    },
    badgeLabelSelected: {
        fontWeight: '500',
        color: FEED_COLORS.favor,
    },
    toast: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toastText: {
        fontSize: 13,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
    },
});
