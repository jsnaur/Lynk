import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RatingButton from './RatingButton';

interface RatingButtonRowProps {
  initialRating?: 'Up' | 'Down' | null;
  onRatingChange?: (rating: 'Up' | 'Down' | null) => void;
}

export default function RatingButtonRow({ initialRating = null, onRatingChange }: RatingButtonRowProps) {
  const [selected, setSelected] = useState<'Up' | 'Down' | null>(initialRating);

  const handlePress = (direction: 'Up' | 'Down') => {
    const newSelection = selected === direction ? null : direction;
    setSelected(newSelection);
    onRatingChange?.(newSelection);
  };

  return (
    <View style={styles.container}>
      <RatingButton
        direction="Up"
        state={selected === 'Up' ? 'Selected' : 'Default'}
        onPress={() => handlePress('Up')}
      />
      <RatingButton
        direction="Down"
        state={selected === 'Down' ? 'Selected' : 'Default'}
        onPress={() => handlePress('Down')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});