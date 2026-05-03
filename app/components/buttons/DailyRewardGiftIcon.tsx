import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

type DailyRewardGiftIconProps = {
  isClaimable: boolean;
  onPress?: () => void;
};

/**
 * Gift box icon for daily reward claim.
 * - Shows red dot when claimable
 * - Jumping animation when claimable
 * - No animation when claimed
 */
export default function DailyRewardGiftIcon({
  isClaimable,
  onPress,
}: DailyRewardGiftIconProps) {
  const { colors } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Jumping animation: bounces up and down
  useEffect(() => {
    if (!isClaimable) {
      bounceAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        // Jump up
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fall down
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [isClaimable, bounceAnim]);

  // Convert bounce animation to translateY (0 to -15px)
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          isClaimable && {
            transform: [{ translateY }],
          },
        ]}
      >
        <MaterialIcons
          name="card-giftcard"
          size={26}
          color={colors.textPrimary}
        />
      </Animated.View>

      {isClaimable && (
        <View
          style={[
            styles.claimableBadge,
            { backgroundColor: colors.error || '#FF3B30' },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimableBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
});
