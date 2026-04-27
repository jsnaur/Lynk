import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileSkeleton() {
    const { colors } = useTheme();
    const pulse = useRef(new Animated.Value(0.45)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.45,
                    duration: 700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );

        animation.start();

        return () => {
            animation.stop();
        };
    }, [pulse]);

    const skeletonStyles = getSkeletonStyles(colors);

    return (
        <ScrollView contentContainerStyle={skeletonStyles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Identity Section */}
            <Animated.View style={[skeletonStyles.identityBlock, { opacity: pulse }]}>
                <View style={skeletonStyles.identityRow}>
                    <View style={skeletonStyles.avatarColumn}>
                        <View style={skeletonStyles.avatarFrame} />
                    </View>

                    <View style={skeletonStyles.identityTextColumn}>
                        <View style={skeletonStyles.namePlaceholder} />
                        <View style={skeletonStyles.subtitlePlaceholder} />
                        <View style={skeletonStyles.bioPlaceholder} />
                        <View style={skeletonStyles.bioPlaceholderShort} />
                        <View style={skeletonStyles.editLinkPlaceholder} />
                    </View>
                </View>
            </Animated.View>

            {/* Badges Section */}
            <Animated.View style={[skeletonStyles.badgesBlock, { opacity: pulse }]}>
                <View style={skeletonStyles.blockHeaderRow}>
                    <View style={skeletonStyles.blockTitlePlaceholder} />
                    <View style={skeletonStyles.setLinkPlaceholder} />
                </View>
                <View style={skeletonStyles.badgeRow}>
                    <View style={skeletonStyles.badgeSlot} />
                    <View style={skeletonStyles.badgeSlot} />
                    <View style={skeletonStyles.badgeSlot} />
                </View>
            </Animated.View>

            {/* Reputation Section */}
            <Animated.View style={[skeletonStyles.reputationBlock, { opacity: pulse }]}>
                <View style={skeletonStyles.blockHeaderRow}>
                    <View style={skeletonStyles.blockTitlePlaceholder} />
                    <View style={skeletonStyles.rankChipPlaceholder} />
                </View>

                <View style={skeletonStyles.karmaLabelRow}>
                    <View style={skeletonStyles.karmaLabelPlaceholder} />
                    <View style={skeletonStyles.karmaValuePlaceholder} />
                </View>

                <View style={skeletonStyles.progressTrackPlaceholder} />

                <View style={skeletonStyles.levelRow}>
                    <View style={skeletonStyles.levelPlaceholder} />
                    <View style={skeletonStyles.levelPlaceholder} />
                </View>

                {/* Leaderboard Card */}
                <View style={skeletonStyles.leaderboardCardPlaceholder} />

                {/* Token Card */}
                <View style={skeletonStyles.shortcutCardPlaceholder} />

                {/* Quests Card */}
                <View style={skeletonStyles.shortcutCardPlaceholder} />
            </Animated.View>
        </ScrollView>
    );
}

const getSkeletonStyles = (colors: any) =>
    StyleSheet.create({
        scrollContent: { paddingBottom: 112 },
        identityBlock: {
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        identityRow: { flexDirection: 'row', gap: 18 },
        avatarColumn: { alignItems: 'center', gap: 8 },
        avatarFrame: {
            width: 100,
            height: 100,
            borderRadius: 14,
            backgroundColor: colors.surface2,
        },
        identityTextColumn: { flex: 1, gap: 8, justifyContent: 'center' },
        namePlaceholder: {
            height: 20,
            borderRadius: 8,
            backgroundColor: colors.surface2,
            width: '80%',
        },
        subtitlePlaceholder: {
            height: 13,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: '60%',
        },
        bioPlaceholder: {
            height: 13,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: '100%',
        },
        bioPlaceholderShort: {
            height: 13,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: '85%',
        },
        editLinkPlaceholder: {
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: '40%',
        },
        badgesBlock: {
            paddingHorizontal: 24,
            paddingVertical: 20,
            gap: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        blockHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        blockTitlePlaceholder: {
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: 60,
        },
        setLinkPlaceholder: {
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: 40,
        },
        badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4, gap: 8 },
        badgeSlot: {
            flex: 1,
            height: 104,
            borderRadius: 14,
            backgroundColor: colors.surface2,
            marginHorizontal: 4,
        },
        reputationBlock: {
            paddingHorizontal: 24,
            paddingVertical: 20,
            gap: 14,
        },
        rankChipPlaceholder: {
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.surface2,
            width: 120,
        },
        karmaLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        karmaLabelPlaceholder: {
            height: 9,
            borderRadius: 4,
            backgroundColor: colors.surface2,
            width: 80,
        },
        karmaValuePlaceholder: {
            height: 13,
            borderRadius: 6,
            backgroundColor: colors.surface2,
            width: 100,
        },
        progressTrackPlaceholder: {
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.surface2,
        },
        levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 },
        levelPlaceholder: {
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.surface2,
            width: 60,
        },
        leaderboardCardPlaceholder: {
            height: 64,
            borderRadius: 14,
            backgroundColor: colors.surface2,
            marginVertical: 8,
        },
        shortcutCardPlaceholder: {
            height: 64,
            borderRadius: 14,
            backgroundColor: colors.surface2,
            marginVertical: 8,
        },
    });
