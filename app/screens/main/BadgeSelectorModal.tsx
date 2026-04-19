import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Image,
    Animated,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

// Badge Assets
const BADGE_ASSETS = {
    shield: require('../../../assets/ProfileAssets/BadgeShield.png'),
    medal: require('../../../assets/ProfileAssets/BadgeMedal.png'),
    hat: require('../../../assets/ProfileAssets/BadgeHat.png'),
};

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
    { id: 'quest-7', label: 'Achiever', category: 'quest', state: 'default' },
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
    { id: 'rep-7', label: 'Achiever', category: 'reputation', state: 'default' },
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
    { id: 'special-7', label: 'Achiever', category: 'special', state: 'default' },
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

const getBadgeImage = (id: string) => {
    const num = parseInt(id.replace(/\D/g, '')) || 0;
    const badgeImages = [BADGE_ASSETS.shield, BADGE_ASSETS.medal, BADGE_ASSETS.hat];
    return badgeImages[num % badgeImages.length];
};

function BadgeItem({ badge, onPress }: { badge: Badge; onPress?: (id: string) => void }) {
    const isDefault = badge.state === 'default';
    const isSelected = badge.state === 'selected';
    const isDisabled = badge.state === 'disabled';

    const containerBg = isSelected
        ? 'rgba(0, 245, 255, 0.1)'
        : isDefault
          ? COLORS.surface2
          : COLORS.surface;

    const borderColor = isSelected
        ? COLORS.favor
        : COLORS.border;

    const borderWidth = isSelected ? 2 : 1;
    const labelColor = isSelected
        ? COLORS.favor
        : isDisabled
          ? COLORS.border
          : COLORS.textSecondary;

    const badgeImage = getBadgeImage(badge.id);

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
                        opacity: isDisabled ? 0.5 : 1,
                    },
                ]}
            >
                <Image source={badgeImage} style={styles.badgeImage} resizeMode="contain" />
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={COLORS.bg} />
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

export default function BadgeSelectorModal({ onClose, onDone, maxBadges = 3 }: BadgeSelectorModalProps) {
    const [badges, setBadges] = useState(BADGE_DATA);
    const panY = useRef(new Animated.Value(0)).current;
    const selectedCount = badges.filter((b) => b.state === 'selected').length;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy > 0) panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dy > 100) onClose?.();
                else Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
            },
        })
    ).current;

    const handleBadgePress = (badgeId: string) => {
        setBadges((prev) =>
            prev.map((badge) => {
                if (badge.id === badgeId) {
                    if (badge.state === 'selected') return { ...badge, state: 'default' };
                    else if (selectedCount < maxBadges) return { ...badge, state: 'selected' };
                }
                return badge;
            })
        );
    };

    const handleDone = () => {
        const selectedBadges = badges.filter((b) => b.state === 'selected').map((b) => b.id);
        onDone?.(selectedBadges);
        onClose?.();
    };

    const questBadges = badges.filter((b) => b.category === 'quest');
    const reputationBadges = badges.filter((b) => b.category === 'reputation');
    const specialBadges = badges.filter((b) => b.category === 'special');
    const selectedBadges = badges.filter((b) => b.state === 'selected').slice(0, maxBadges);

    return (
        <>
            <Pressable style={styles.overlay} onPress={onClose} />
            <Animated.View style={[styles.container, { transform: [{ translateY: panY }] }]}>
                <View style={styles.dragArea} {...panResponder.panHandlers}>
                    <View style={styles.modalHandle}>
                        <View style={styles.handleBar} />
                    </View>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerTitle}>Choose Badges</Text>
                            <Text style={styles.headerSubtitle}>
                                {selectedCount} of {maxBadges} selected
                            </Text>
                        </View>
                        <Pressable style={styles.doneButton} onPress={handleDone}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.previewSection}>
                    {Array.from({ length: maxBadges }).map((_, index) => {
                        const badge = selectedBadges[index];
                        const isFilled = !!badge;
                        const isEmpty = !badge;
                        const badgeImage = isFilled ? getBadgeImage(badge.id) : null;

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.badgeSlot,
                                    isFilled && styles.badgeSlotFilled,
                                    isEmpty && styles.badgeSlotEmpty,
                                ]}
                            >
                                {isFilled && badgeImage && (
                                    <Image source={badgeImage} style={styles.selectedBadgeImage} resizeMode="contain" />
                                )}
                                {isEmpty && <Text style={styles.badgeSlotEmptyText}>{index + 1}</Text>}
                                {!isEmpty && (
                                    <View style={styles.slotDot}>
                                        <View style={styles.slotDotInner} />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                <ScrollView style={styles.badgeGridContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>QUEST MILESTONES</Text>
                        <View style={styles.badgeGrid}>
                            {questBadges.map((badge) => <BadgeItem key={badge.id} badge={badge} onPress={handleBadgePress} />)}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>REPUTATION</Text>
                        <View style={styles.badgeGrid}>
                            {reputationBadges.map((badge) => <BadgeItem key={badge.id} badge={badge} onPress={handleBadgePress} />)}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SPECIAL</Text>
                        <View style={styles.badgeGrid}>
                            {specialBadges.map((badge) => <BadgeItem key={badge.id} badge={badge} onPress={handleBadgePress} />)}
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                {selectedCount === maxBadges && (
                    <View style={styles.toast}>
                        <Ionicons name="information-circle" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.toastText}>Deselect a badge to swap it</Text>
                    </View>
                )}
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '85%',
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        zIndex: 2,
    },
    dragArea: {
        width: '100%',
    },
    modalHandle: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingBottom: 8,
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    doneButton: {
        backgroundColor: COLORS.favor,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    doneButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.bg,
    },
    previewSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    badgeSlot: {
        width: 90,
        height: 90,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    badgeSlotFilled: {
        backgroundColor: COLORS.surface2,
        borderColor: COLORS.favor,
        borderWidth: 2,
    },
    badgeSlotEmpty: {
        backgroundColor: COLORS.bg,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    badgeSlotEmptyText: {
        fontSize: 16,
        fontWeight: '400',
        color: COLORS.border,
    },
    selectedBadgeImage: {
        width: 56,
        height: 56,
    },
    slotDot: {
        position: 'absolute',
        bottom: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.favor,
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    badgeWrapper: {
        width: '33.33%', // 3 columns exactly
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 8, // Creates the gap uniformly
    },
    badgeContainer: {
        width: 72, 
        height: 72,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    badgeImage: {
        width: 44,
        height: 44,
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.favor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.bg,
    },
    badgeLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: COLORS.textSecondary,
        textAlign: 'center',
        maxWidth: '100%',
    },
    badgeLabelSelected: {
        fontWeight: '500',
        color: COLORS.favor,
    },
    toast: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        color: COLORS.textSecondary,
    },
});