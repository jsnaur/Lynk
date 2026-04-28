import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { useTheme } from '../../contexts/ThemeContext';
import { reportContent } from '../../services/ModerationService';

type PostCardProps = {
    quest: FeedQuest;
    onPress?: () => void;
};

function getAccessoryById(accessoryId?: string | null) {
    if (!accessoryId) return undefined;
    return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

const DEFAULT_POSTER_ACCESSORIES: Partial<Record<AvatarSlot, string>> = {
    Body: 'body-masc-a',
    HairBase: 'hairb-flat-m',
    HairFringe: 'hairf-chill-m',
    Eyes: 'eyes-default',
    Mouth: 'mouth-neutral',
    Top: 'top-cit-m',
    Bottom: 'bot-cit-m',
};

function hasPosterAccessories(
    value: FeedQuest['posterAccessories'],
): value is Partial<Record<AvatarSlot, string>> {
    return value != null && typeof value === 'object' && Object.keys(value).length > 0;
}

export default function PostCard({ quest, onPress }: PostCardProps) {
    const { colors, theme } = useTheme();
    const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);
    const isHidden = quest.visibility === 'hidden';
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);

    const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = useMemo(() => ({
        favor: { label: 'FAVOR', color: colors.favor },
        study: { label: 'STUDY', color: colors.study },
        item: { label: 'ITEM', color: colors.item },
    }), [colors]);

    const categoryMeta = CATEGORY_META[quest.category];
    
    const posterAccessories = hasPosterAccessories(quest.posterAccessories)
        ? quest.posterAccessories
        : DEFAULT_POSTER_ACCESSORIES;

    const openReportModal = () => {
        setReportReason('');
        setIsReportModalVisible(true);
    };

    const closeReportModal = () => {
        if (reporting) return;
        setIsReportModalVisible(false);
    };

    const setPresetReason = (reason: string) => {
        setReportReason(reason);
    };

    const submitReport = async () => {
        const reason = reportReason.trim();
        if (!reason) {
            Alert.alert('Report requires a reason', 'Please pick or enter a reason before submitting.');
            return;
        }

        setReporting(true);
        try {
            const result = await reportContent(quest.id, 'quest', reason);
            if (!result.success) {
                Alert.alert('Report failed', result.error || 'Unable to submit report right now.');
                return;
            }

            setIsReportModalVisible(false);
            setReportReason('');
            Alert.alert('Report submitted', 'Thanks for helping keep the community safe.');
        } finally {
            setReporting(false);
        }
    };

    return (
        <>
        <Pressable style={styles.card} onPress={onPress}>
            <View style={[styles.stripe, { backgroundColor: categoryMeta.color }]} />

            <View style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: withOpacity(categoryMeta.color, 0.15) }]}>
                        <View style={[styles.categoryDot, { backgroundColor: categoryMeta.color }]} />
                        <Text style={[styles.categoryLabel, { color: categoryMeta.color }]}>
                            {categoryMeta.label}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Text style={styles.ago}>{quest.ago}</Text>
                        <Pressable
                            hitSlop={8}
                            style={styles.ellipsisButton}
                            onPress={(event) => {
                                event.stopPropagation?.();
                                openReportModal();
                            }}
                        >
                            <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                </View>

                {isHidden ? (
                    <View style={styles.hiddenState}>
                        <MaterialCommunityIcons name="shield-alert-outline" size={18} color={colors.error} />
                        <Text style={styles.hiddenMessage}>
                            This content was removed by the Auto-Moderator for violating community guidelines.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.title}>{quest.title}</Text>
                        <Text numberOfLines={3} style={styles.preview}>
                            {quest.preview}
                        </Text>
                    </>
                )}

                <View style={styles.footerRow}>
                    <View style={styles.posterWrap}>
                        <View style={styles.avatarContainer}>
                            {ALL_SLOTS_Z_ORDER.map(slot => {
                                const accId = posterAccessories[slot];
                                if (!accId) return null;
                                const item = getAccessoryById(accId);
                                if (!item) return null;
                                const Sprite = item.Sprite;
                                return (
                                    <View key={slot} style={styles.avatarLayer} pointerEvents="none">
                                        <Sprite width="100%" height="100%" />
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={styles.posterName}>{quest.posterName}</Text>
                    </View>

                    <View style={styles.rewardWrap}>
                        <View style={[styles.rewardPill, { backgroundColor: withOpacity(colors.xp, 0.15) }]}>
                            <MaterialCommunityIcons name="star-four-points" size={14} color={colors.xp} />
                            <Text style={[styles.rewardValue, { color: colors.xp }]}>{quest.xp}</Text>
                        </View>

                        <View style={[styles.rewardPill, { backgroundColor: withOpacity(colors.token, 0.15) }]}>
                            <MaterialCommunityIcons name="lightning-bolt-circle" size={14} color={colors.token} />
                            <Text style={[styles.rewardValue, { color: colors.token }]}>{quest.token}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
        <Modal
            transparent
            animationType="fade"
            visible={isReportModalVisible}
            onRequestClose={closeReportModal}
        >
            <Pressable style={styles.modalBackdrop} onPress={closeReportModal}>
                <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation?.()}>
                    <Text style={styles.modalTitle}>Report Content</Text>
                    <Text style={styles.modalSubtitle}>Tell us why this post should be reviewed.</Text>

                    <View style={styles.reasonRow}>
                        <Pressable style={styles.reasonChip} onPress={() => setPresetReason('Harassment or hate speech')}>
                            <Text style={styles.reasonChipText}>Harassment</Text>
                        </Pressable>
                        <Pressable style={styles.reasonChip} onPress={() => setPresetReason('Spam or scam content')}>
                            <Text style={styles.reasonChipText}>Spam</Text>
                        </Pressable>
                        <Pressable style={styles.reasonChip} onPress={() => setPresetReason('Explicit or inappropriate content')}>
                            <Text style={styles.reasonChipText}>Explicit</Text>
                        </Pressable>
                    </View>

                    <TextInput
                        value={reportReason}
                        onChangeText={setReportReason}
                        placeholder="Add a reason"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        style={styles.reasonInput}
                    />

                    <View style={styles.modalActions}>
                        <Pressable style={styles.cancelButton} onPress={closeReportModal} disabled={reporting}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.submitButton, reporting && styles.submitButtonDisabled]}
                            onPress={submitReport}
                            disabled={reporting}
                        >
                            <Text style={styles.submitText}>{reporting ? 'Submitting...' : 'Submit Report'}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
        </>
    );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    stripe: { height: 4, width: '100%' },
    body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ellipsisButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withOpacity(colors.surface2, 0.4),
    },
    categoryBadge: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    categoryDot: { width: 6, height: 6, borderRadius: 3 },
    categoryLabel: { fontSize: 11, fontWeight: '500', fontFamily: FONTS.body },
    ago: { fontSize: 11, color: colors.textSecondary, fontFamily: FONTS.body },
    title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, fontFamily: FONTS.body },
    preview: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, fontFamily: FONTS.body },
    hiddenState: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: withOpacity(colors.error, 0.5),
        backgroundColor: withOpacity(colors.error, 0.16),
    },
    hiddenMessage: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: colors.error,
        fontStyle: 'italic',
        fontFamily: FONTS.body,
    },
    footerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    posterWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatarContainer: { width: 26, height: 26, position: 'relative', overflow: 'hidden', borderRadius: 13, backgroundColor: colors.surface2 },
    avatarLayer: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.3 }, { translateY: 2 }] },
    posterName: { fontSize: 13, color: colors.textSecondary, fontFamily: FONTS.body },
    rewardWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rewardPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
    rewardValue: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.body },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    modalCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 16,
        gap: 12,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: FONTS.body,
    },
    modalSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: FONTS.body,
    },
    reasonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    reasonChip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface2,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    reasonChipText: {
        fontSize: 12,
        color: colors.textPrimary,
        fontFamily: FONTS.body,
    },
    reasonInput: {
        minHeight: 88,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface2,
        color: colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontFamily: FONTS.body,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelButton: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    cancelText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: FONTS.body,
    },
    submitButton: {
        borderRadius: 8,
        backgroundColor: colors.error,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: FONTS.body,
    },
});