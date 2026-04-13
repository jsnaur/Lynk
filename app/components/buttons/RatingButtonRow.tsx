import React from 'react';
import { View, StyleSheet } from 'react-native';
import RatingButton from './RatingButton';

type RatingSelection = 'None' | 'Positive' | 'Negative';

type RatingButtonRowProps = {
  selected?: RatingSelection;
  onRatingChange?: (rating: 'Positive' | 'Negative') => void;
};

export default function RatingButtonRow({
  selected = 'None',
  onRatingChange,
}: RatingButtonRowProps) {
  const handlePositive = () => {
    onRatingChange?.(selected === 'Positive' ? undefined as any : 'Positive');
  };

  const handleNegative = () => {
    onRatingChange?.(selected === 'Negative' ? undefined as any : 'Negative');
  };

  return (
    <View style={styles.container}>
      <RatingButton
        direction="Up"
        state={selected === 'Positive' ? 'Selected' : 'Default'}
        onPress={handlePositive}
      />
      <RatingButton
        direction="Down"
        state={selected === 'Negative' ? 'Selected' : 'Default'}
        onPress={handleNegative}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
});
