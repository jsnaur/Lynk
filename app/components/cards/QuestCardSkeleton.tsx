import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

export default function QuestCardSkeleton() {
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

  const styles = getStyles(colors);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.stripe} />
      <View style={styles.cardBody}>
        <View style={styles.textColumn}>
          <View style={styles.title} />
          <View style={styles.metaLine} />
        </View>
        <View style={styles.actionCluster}>
          <View style={styles.pill} />
          <View style={styles.chevron} />
        </View>
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      minHeight: 80,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    stripe: {
      width: 3,
      backgroundColor: colors.surface2,
    },
    cardBody: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    textColumn: {
      flex: 1,
      gap: 8,
    },
    title: {
      height: 18,
      width: '75%',
      borderRadius: 8,
      backgroundColor: colors.surface2,
    },
    metaLine: {
      height: 12,
      width: '52%',
      borderRadius: 6,
      backgroundColor: colors.surface2,
    },
    actionCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    pill: {
      height: 28,
      width: 56,
      borderRadius: 999,
      backgroundColor: colors.surface2,
    },
    chevron: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.surface2,
    },
  });
