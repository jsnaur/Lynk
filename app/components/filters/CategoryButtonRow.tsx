import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import CategorySelectButton from '../buttons/CategorySelectButton';

type SelectedCategory = 'Favor' | 'Study' | 'Item' | null;

interface CategoryButtonRowProps {
  selected?: SelectedCategory;
  onCategorySelect?: (category: SelectedCategory) => void;
  showError?: boolean;
}

const CategoryButtonRow: React.FC<CategoryButtonRowProps> = ({
  selected = null,
  onCategorySelect,
  showError = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory>(selected);

  const handleSelect = (category: SelectedCategory) => {
    setSelectedCategory(category);
    onCategorySelect?.(category);
  };

  const categories: Array<'Favor' | 'Study' | 'Item'> = ['Favor', 'Study', 'Item'];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <CategorySelectButton
          key={category}
          category={category}
          state={
            showError
              ? 'Error'
              : selectedCategory === category
              ? 'Selected'
              : 'Default'
          }
          onPress={() => handleSelect(category)}
        />
      ))}
    </View>
  );
};

export default CategoryButtonRow;
