import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RatingReceivedIconProps = {
  type?: 'Positive' | 'Negative';
};

export default function RatingReceivedIcon({ type = 'Positive' }: RatingReceivedIconProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={type === 'Positive' ? 'thumb-up' : 'thumb-down'}
        size={20}
        color={type === 'Positive' ? '#C084FC' : '#FF2D78'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
