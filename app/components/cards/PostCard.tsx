import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';
import { useTheme } from '../../contexts/ThemeContext';

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

    const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = useMemo(() => ({
        favor: { label: 'FAVOR', color: colors.favor },
        study: { label: 'STUDY', color: colors.study },
        item: { label: 'ITEM', color: colors.item },
    }), [colors]);

    const categoryMeta = CATEGORY_META[quest.category];
    
    const posterAccessories = hasPosterAccessories(quest.posterAccessories)
        ? quest.posterAccessories
        : DEFAULT_POSTER_ACCESSORIES;

    return (
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
                    <Text style={styles.ago}>{quest.ago}</Text>
                </View>

                <Text style={styles.title}>{quest.title}</Text>
                <Text numberOfLines={3} style={styles.preview}>
                    {quest.preview}
                </Text>

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
    categoryBadge: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    categoryDot: { width: 6, height: 6, borderRadius: 3 },
    categoryLabel: { fontSize: 11, fontWeight: '500', fontFamily: FONTS.body },
    ago: { fontSize: 11, color: colors.textSecondary, fontFamily: FONTS.body },
    title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, fontFamily: FONTS.body },
    preview: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, fontFamily: FONTS.body },
    footerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    posterWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatarContainer: { width: 26, height: 26, position: 'relative', overflow: 'hidden', borderRadius: 13, backgroundColor: colors.surface2 },
    avatarLayer: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.3 }, { translateY: 2 }] },
    posterName: { fontSize: 13, color: colors.textSecondary, fontFamily: FONTS.body },
    rewardWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rewardPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
    rewardValue: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.body },
});