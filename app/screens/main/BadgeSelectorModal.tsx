import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Image,
    Animated,
    Easing,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';
import { BADGES, BadgeCategory, getBadgeById } from '../../constants/badges';
import { createFadeSlideStyle, createMotionValues, createStaggeredEntrance } from '../../navigation/navigationMotion';

type ThemeColors = Record<keyof typeof darkColors, string>;

type BadgeState = 'default' | 'selected' | 'disabled' | 'locked';

interface Badge {
    id: string;
    label: string;
    category: BadgeCategory;
    state: BadgeState;
}

type BadgeSelectorModalProps = {
    onClose?: () => void;
    onDone?: (selectedBadges: string[]) => void;
    maxBadges?: number;
    initialSelected?: string[];
    initialLocked?: string[];
};

const buildBadgeData = (initialSelected: string[] = [], initialLocked: string[] = []): Badge[] =>
    BADGES.map((b) => ({
        id: b.id,
        label: b.name,
        category: b.category,
        state: initialLocked.includes(b.id)
            ? 'locked'
            : initialSelected.includes(b.id)
                ? 'selected'
                : 'default',
    }));

const getBadgeImage = (id: string) => getBadgeById(id)?.icon;

function BadgeItem({ badge, onPress, onLongPress }: { badge: Badge; onPress?: (id: string) => void; onLongPress?: (id: string) => void }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const isDefault = badge.state === 'default';
    const isSelected = badge.state === 'selected';
    const isDisabled = badge.state === 'disabled';
    const isLocked = badge.state === 'locked';

    const containerBg = isSelected
        ? withOpacity(colors.favor, 0.1)
        : isDefault
          ? colors.surface2
          : colors.surface;

    const borderColor = isSelected
        ? colors.favor
        : colors.border;

    const borderWidth = isSelected ? 2 : 1;
    const labelColor = isSelected
        ? colors.favor
        : isDisabled
          ? colors.border
          : colors.textSecondary;

    const badgeImage = getBadgeImage(badge.id);

    return (
        <Pressable
            style={styles.badgeWrapper}
            onPress={() => {
                if (isDisabled || isLocked) return;
                onPress?.(badge.id);
            }}
            onLongPress={() => onLongPress?.(badge.id)}
            delayLongPress={300}
            disabled={isDisabled}
        >
            <View
                style={[
                    styles.badgeContainer,
                    {
                        backgroundColor: containerBg,
                        borderColor: borderColor,
                        borderWidth: borderWidth,
                        opacity: isDisabled || isLocked ? 0.5 : 1,
                    },
                ]}
            >
                <Image source={badgeImage} style={styles.badgeImage} resizeMode="contain" />
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={colors.bg} />
                    </View>
                )}
                {isLocked && (
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color={colors.bg} />
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

export default function BadgeSelectorModal({ onClose, onDone, maxBadges = 3, initialSelected, initialLocked }: BadgeSelectorModalProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [badges, setBadges] = useState(() => buildBadgeData(initialSelected, initialLocked));
    const [tooltipText, setTooltipText] = useState<string | null>(null);
    const tooltipTimer = useRef<number | null>(null);
    const tooltipAnim = useRef(new Animated.Value(0)).current;

    // Motion values
    const screenMotion = useRef(createMotionValues(4)).current; // header, preview, grids, footer
    const badgeMotionValues = useRef(new Map<string, Animated.Value>()).current;
    const previewPulse = useRef(new Animated.Value(0)).current;

    function ensureAnimatedValue(map: Map<string, Animated.Value>, key: string, initialValue = 0) {
        const existing = map.get(key);
        if (existing) return existing;
        const next = new Animated.Value(initialValue);
        map.set(key, next);
        return next;
    }

    useEffect(() => {
        return () => {
            if (tooltipTimer.current) {
                clearTimeout(tooltipTimer.current);
            }
        };
    }, []);
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

    // Screen entrance
    useEffect(() => {
        createStaggeredEntrance(screenMotion, 360, 75).start();
    }, [screenMotion]);

    // Animate badge items when list updates
    useEffect(() => {
        const allBadges = [...questBadges, ...reputationBadges, ...specialBadges];
        const animations = allBadges.map((b, i) => {
            const motion = ensureAnimatedValue(badgeMotionValues, b.id, 0);
            motion.stopAnimation();
            motion.setValue(0);
            return Animated.timing(motion, { toValue: 1, duration: 320, delay: i * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true });
        });
        Animated.parallel(animations).start();
    }, [badges]);

    // Preview pulse when selection count changes
    useEffect(() => {
        previewPulse.stopAnimation();
        previewPulse.setValue(0);
        Animated.sequence([
            Animated.timing(previewPulse, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(previewPulse, { toValue: 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, [selectedCount]);

    const handleBadgePress = (badgeId: string) => {
        setBadges((prev) =>
            prev.map((badge) => {
                if (badge.id === badgeId) {
                        if (badge.state === 'selected') return { ...badge, state: 'default' };
                        else if (selectedCount < maxBadges && badge.state !== 'locked' && badge.state !== 'disabled') {
                            try { void appSoundManager.play(AppSoundCategory.BadgeEquip, { force: true }); } catch (e) {}
                            return { ...badge, state: 'selected' };
                        }
                }
                return badge;
            })
        );
    };

    const hideTooltipImmediate = () => {
        if (tooltipTimer.current) {
            clearTimeout(tooltipTimer.current);
            tooltipTimer.current = null;
        }
        Animated.timing(tooltipAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setTooltipText(null));
    };

    const showTooltipFor = (badgeId: string) => {
        const def = getBadgeById(badgeId);
        if (!def) return;
        if (tooltipTimer.current) {
            clearTimeout(tooltipTimer.current);
            tooltipTimer.current = null;
        }
        setTooltipText(def.description || def.name);
        // animate in
        Animated.spring(tooltipAnim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
        // hide after 2.5s with animation
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore setTimeout returns number in RN
        tooltipTimer.current = setTimeout(() => {
            Animated.timing(tooltipAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setTooltipText(null));
            tooltipTimer.current = null;
        }, 2500) as unknown as number;
    };

    const handleDone = () => {
        const selectedBadges = badges.filter((b) => b.state === 'selected').map((b) => b.id);
        try {
            void appSoundManager.playProgressDing(0);
        } catch (e) {}
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
                    <Animated.View style={createFadeSlideStyle(screenMotion[0], 10)}>
                        <View style={styles.modalHandle}>
                        <View style={styles.handleBar} />
                        </View>
                    </Animated.View>
                    <Animated.View style={createFadeSlideStyle(screenMotion[0], 10)}>
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
                    </Animated.View>
                </View>

                <Animated.View style={[createFadeSlideStyle(screenMotion[1], 12), { transform: [{ scale: previewPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }] }]}>
                    <View style={styles.previewSection}>
                    {Array.from({ length: maxBadges }).map((_, index) => {
                        const badge = selectedBadges[index];
                        const isFilled = !!badge;
                        const isEmpty = !badge;
                        const badgeImage = isFilled ? getBadgeImage(badge.id) : null;

                        return (
                            <Pressable
                                key={index}
                                style={[
                                    styles.badgeSlot,
                                    isFilled && styles.badgeSlotFilled,
                                    isEmpty && styles.badgeSlotEmpty,
                                ]}
                                onPress={() => {
                                    if (!isFilled) return;
                                    // Do not allow unequip if badge is locked
                                    if (badge && badge.state === 'locked') return;
                                    const idToRemove = badge.id;
                                    setBadges((prev) => prev.map((b) => (b.id === idToRemove ? { ...b, state: 'default' } : b)));
                                    try {
                                        void appSoundManager.play(AppSoundCategory.BadgeEquip, { force: true });
                                    } catch (e) {}
                                }}
                                onLongPress={() => isFilled && showTooltipFor(badge.id)}
                                delayLongPress={300}
                                disabled={!isFilled}
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
                            </Pressable>
                        );
                    })}
                    </View>
                </Animated.View>

                <ScrollView
                    style={styles.badgeGridContainer}
                    contentContainerStyle={styles.badgeGridContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={createFadeSlideStyle(screenMotion[2], 10)}>
                        <View style={styles.section}>
                        <Text style={styles.sectionTitle}>QUEST MILESTONES</Text>
                        <View style={styles.badgeGrid}>
                            {questBadges.map((badge, idx) => {
                                const motion = ensureAnimatedValue(badgeMotionValues, badge.id, 0);
                                return (
                                    <Animated.View key={badge.id} style={createFadeSlideStyle(motion, 8)}>
                                        <BadgeItem badge={badge} onPress={handleBadgePress} onLongPress={() => showTooltipFor(badge.id)} />
                                    </Animated.View>
                                );
                            })}
                        </View>
                        </View>
                    </Animated.View>

                    <Animated.View style={createFadeSlideStyle(screenMotion[2], 10)}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>REPUTATION</Text>
                            <View style={styles.badgeGrid}>
                                {reputationBadges.map((badge) => {
                                    const motion = ensureAnimatedValue(badgeMotionValues, badge.id, 0);
                                    return (
                                        <Animated.View key={badge.id} style={createFadeSlideStyle(motion, 8)}>
                                            <BadgeItem badge={badge} onPress={handleBadgePress} onLongPress={() => showTooltipFor(badge.id)} />
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View style={createFadeSlideStyle(screenMotion[2], 10)}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SPECIAL</Text>
                            <View style={styles.badgeGrid}>
                                {specialBadges.map((badge) => {
                                    const motion = ensureAnimatedValue(badgeMotionValues, badge.id, 0);
                                    return (
                                        <Animated.View key={badge.id} style={createFadeSlideStyle(motion, 8)}>
                                            <BadgeItem badge={badge} onPress={handleBadgePress} onLongPress={() => showTooltipFor(badge.id)} />
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                    <View style={{ height: 36 }} />
                </ScrollView>

                {tooltipText && (
                    <Animated.View
                        style={[
                            styles.tooltipContainer,
                            {
                                opacity: tooltipAnim,
                                transform: [
                                    {
                                        scale: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
                                    },
                                ],
                            },
                        ]}
                        pointerEvents="none"
                    >
                        <Text style={styles.tooltipText}>{tooltipText}</Text>
                    </Animated.View>
                )}

                {selectedCount === maxBadges && (
                    <View style={styles.toast}>
                        <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
                        <Text style={styles.toastText}>Deselect a badge to swap it</Text>
                    </View>
                )}
            </Animated.View>
        </>
    );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
    lockBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.surface,
    },
    badgeGridContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    badgeGridContent: {
        paddingBottom: 48,
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
    tooltipContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        top: 110,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: COLORS.surface2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        zIndex: 99,
    },
    tooltipText: {
        color: COLORS.textPrimary,
        fontSize: 13,
        textAlign: 'center',
    },
});