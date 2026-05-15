import { Animated, Easing } from 'react-native';
import { COLORS } from '../constants/colors';

type StackScreenOptions = {
  headerShown: boolean;
  animation: 'fade' | 'slide_from_bottom' | 'none';
  contentStyle: { backgroundColor: string };
};

export const MOTION = {
  entranceDuration: 420,
  entranceOffset: 14,
  staggerDelay: 70,
  revealDuration: 220,
  revealOffset: 10,
};

export function createBaseStackScreenOptions(backgroundColor = COLORS.bg): StackScreenOptions {
  return {
    headerShown: false,
    animation: 'fade',
    contentStyle: { backgroundColor },
  };
}

export function createFadeSlideStyle(animation: Animated.Value, offset = MOTION.entranceOffset) {
  return {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [offset, 0],
        }),
      },
    ],
  };
}

export function createStaggeredEntrance(values: Animated.Value[], duration = MOTION.entranceDuration) {
  return Animated.stagger(
    MOTION.staggerDelay,
    values.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    )
  );
}
