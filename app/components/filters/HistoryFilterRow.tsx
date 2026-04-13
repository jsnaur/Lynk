import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import HistoryFilterPill from './HistoryFilterPill';

type FilterState = 'None' | 'All' | 'Posted' | 'Accepted';

interface HistoryFilterRowProps {
  onFilterChange?: (filter: FilterState) => void;
  initialFilter?: FilterState;
}

const HistoryFilterRow: React.FC<HistoryFilterRowProps> = ({
  onFilterChange,
  initialFilter = 'None',
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterState>(initialFilter);

  const handleFilterPress = (filter: FilterState) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  const filters: FilterState[] = ['All', 'Posted', 'Accepted'];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });

  return (
    <View style={styles.container}>
      {filters.map((filter) => (
        <HistoryFilterPill
          key={filter}
          label={filter}
          state={activeFilter === filter}
        />
      ))}
    </View>
  );
};

export default HistoryFilterRow;
