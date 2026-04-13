import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RatingButton from './RatingButton';

type RatingSelection = 'None' | 'Positive' | 'Negative';

type RatingButtonRowProps = {
  selected?: RatingSelection;
  onRatingChange?: (rating: 'Positive' | 'Negative') => void;
};

export default function RatingButtonRow({
  selected: externalSelected = 'None',
  onRatingChange,
}: RatingButtonRowProps) {
  // Manage internal selection state
  const [internalSelected, setInternalSelected] = useState<RatingSelection>('None');
  const selectedState = externalSelected ?? internalSelected;

  const handlePositive = () => {
    const newState: RatingSelection = selectedState === 'Positive' ? 'None' : 'Positive';
    if (!externalSelected) {
      setInternalSelected(newState);
    }
    if (newState !== 'None') {
      onRatingChange?.('Positive');
    } else {
      onRatingChange?.(undefined as any);
    }
  };

  const handleNegative = () => {
    const newState: RatingSelection = selectedState === 'Negative' ? 'None' : 'Negative';
    if (!externalSelected) {
      setInternalSelected(newState);
    }
    if (newState !== 'None') {
      onRatingChange?.('Negative');
    } else {
      onRatingChange?.(undefined as any);
    }
  };

  return (
    <View style={styles.container}>
      <RatingButton
        direction="Up"
        state={selectedState === 'Positive' ? 'Selected' : 'Default'}
        onPress={handlePositive}
      />
      <RatingButton
        direction="Down"
        state={selectedState === 'Negative' ? 'Selected' : 'Default'}
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
