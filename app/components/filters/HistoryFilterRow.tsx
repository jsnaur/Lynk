import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HistoryFilterPill from './HistoryFilterPill';

const FILTERS = ['All', 'Completed', 'Failed', 'Given', 'Received'];

interface HistoryFilterRowProps {
  onFilterSelect?: (filter: string) => void;
  initialFilter?: string;
}

export default function HistoryFilterRow({ 
  onFilterSelect,
  initialFilter = 'All' 
}: HistoryFilterRowProps) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const handleSelect = (filter: string) => {
    setActiveFilter(filter);
    onFilterSelect?.(filter);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => (
          <HistoryFilterPill
            key={filter}
            label={filter}
            selected={activeFilter === filter}
            onPress={() => handleSelect(filter)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});