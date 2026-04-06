import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

export default function PostCardSkeleton() {
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

    return (
        <Animated.View style={[styles.card, { opacity: pulse }]}>
            <View style={styles.stripe} />

            <View style={styles.body}>
                <View style={styles.headerRow}>
                    <View style={styles.badge} />
                    <View style={styles.time} />
                </View>

                <View style={styles.title} />
                <View style={styles.previewWide} />
                <View style={styles.previewShort} />

                <View style={styles.footerRow}>
                    <View style={styles.posterWrap}>
                        <View style={styles.avatar} />
                        <View style={styles.posterName} />
                    </View>

                    <View style={styles.rewardWrap}>
                        <View style={styles.rewardPill} />
                        <View style={styles.rewardPill} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        backgroundColor: FEED_COLORS.surface,
        overflow: 'hidden',
    },
    stripe: {
        height: 4,
        width: '100%',
        backgroundColor: FEED_COLORS.surface2,
    },
    body: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        gap: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        width: 66,
        height: 20,
        borderRadius: 6,
        backgroundColor: FEED_COLORS.surface2,
    },
    time: {
        width: 36,
        height: 12,
        borderRadius: 6,
        backgroundColor: FEED_COLORS.surface2,
    },
    title: {
        width: '70%',
        height: 18,
        borderRadius: 8,
        backgroundColor: FEED_COLORS.surface2,
    },
    previewWide: {
        width: '100%',
        height: 14,
        borderRadius: 7,
        backgroundColor: FEED_COLORS.surface2,
    },
    previewShort: {
        width: '84%',
        height: 14,
        borderRadius: 7,
        backgroundColor: FEED_COLORS.surface2,
    },
    footerRow: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    posterWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: FEED_COLORS.surface2,
    },
    posterName: {
        width: 64,
        height: 12,
        borderRadius: 6,
        backgroundColor: FEED_COLORS.surface2,
    },
    rewardWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rewardPill: {
        width: 42,
        height: 20,
        borderRadius: 10,
        backgroundColor: FEED_COLORS.surface2,
    },
});