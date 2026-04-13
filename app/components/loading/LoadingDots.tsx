import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

type LoadingDotsProps = {
  phase?: 1 | 2 | 3 | 4;
};

export default function LoadingDots({ phase = 1 }: LoadingDotsProps) {
  const dotPositions = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dotPositions.map((dot, index) => {
      return Animated.sequence([
        Animated.delay(index * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -8,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container}>
      {dotPositions.map((position, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            { transform: [{ translateY: position }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
});
