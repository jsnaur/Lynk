import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import FilterToggle from './FilterToggle';

const CATEGORIES = ['All', 'Favor', 'Study', 'Item'];

interface CategoryFilterBarProps {
  onFilterChange?: (category: string) => void;
  initialFilter?: string;
}

export default function CategoryFilterBar({ 
  onFilterChange,
  initialFilter = 'All' 
}: CategoryFilterBarProps) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const handlePress = (category: string) => {
    // If 'All' is pressed, it shouldn't be toggleable off unless another is selected
    // If a specific category is toggled off, we revert to 'All'
    let newFilter = category;
    if (activeFilter === category && category !== 'All') {
      newFilter = 'All';
    }
    
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => (
          <FilterToggle
            key={cat}
            label={cat}
            selected={activeFilter === cat}
            onPress={() => handlePress(cat)}
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