import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type FilterOption = 'Default' | 'Favor' | 'Study' | 'Item';

type CategoryFilterBarProps = {
  chosen?: FilterOption;
  onFilterChange?: (filter: FilterOption) => void;
};

export default function CategoryFilterBar({
  chosen: externalChosen = 'Default',
  onFilterChange,
}: CategoryFilterBarProps) {
  // Manage internal filter state
  const [internalChosen, setInternalChosen] = useState<FilterOption>(externalChosen);
  const activeFilter = externalChosen ?? internalChosen;

  const handleFilterChange = (filter: FilterOption) => {
    if (!externalChosen) {
      setInternalChosen(filter);
    }
    onFilterChange?.(filter);
  };
  const filters: FilterOption[] = ['Default', 'Favor', 'Study', 'Item'];

  const renderFilterButton = (label: FilterOption) => {
    const isSelected = activeFilter === label;
    
    let backgroundColor = '#26262e';
    let borderColor = '#3a3a48';
    let textColor = '#8a8a9a';
    let borderWidth = 1;

    if (isSelected && label !== 'Default') {
      const colorMap = {
        Favor: FEED_COLORS.favor,
        Study: FEED_COLORS.study,
        Item: FEED_COLORS.item,
        Default: '#26262e',
      };
      const selectedColor = colorMap[label];
      
      backgroundColor = `${selectedColor}20`;
      borderColor = selectedColor;
      textColor = selectedColor;
      borderWidth = 1.5;
    }

    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.filterButton,
          {
            backgroundColor,
            borderColor,
            borderWidth,
          },
        ]}
        onPress={() => handleFilterChange(label)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, { color: textColor }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {filters.map((filter) => renderFilterButton(filter))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1f',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a48',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  filterButton: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'DM_Sans-Medium',
  },
});
