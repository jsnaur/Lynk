import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CategorySelectButton from '../buttons/CategorySelectButton';

type Category = 'Favor' | 'Study' | 'Item';

interface CategoryButtonRowProps {
  onCategorySelect?: (category: Category | null) => void;
  initialCategory?: Category | null;
}

export default function CategoryButtonRow({ 
  onCategorySelect, 
  initialCategory = null 
}: CategoryButtonRowProps) {
  const [selected, setSelected] = useState<Category | null>(initialCategory);

  const handleSelect = (category: Category, isSelected: boolean) => {
    const newSelection = isSelected ? category : null;
    setSelected(newSelection);
    onCategorySelect?.(newSelection);
  };

  return (
    <View style={styles.container}>
      <CategorySelectButton
        category="Favor"
        state={selected === 'Favor' ? 'Selected' : 'Default'}
        onPress={handleSelect}
      />
      <CategorySelectButton
        category="Study"
        state={selected === 'Study' ? 'Selected' : 'Default'}
        onPress={handleSelect}
      />
      <CategorySelectButton
        category="Item"
        state={selected === 'Item' ? 'Selected' : 'Default'}
        onPress={handleSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
});