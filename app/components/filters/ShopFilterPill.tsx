import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface ShopFilterPillProps {
  label: string;
  state?: boolean; // true = active, false = inactive (optional - component can manage own state)
  onPress?: (isActive: boolean) => void; // Callback when state changes
}

const ShopFilterPill: React.FC<ShopFilterPillProps> = ({ label, state, onPress }) => {
  // Use internal state if external state not provided
  const [isActive, setIsActive] = useState(state ?? false);
  const displayState = state !== undefined ? state : isActive;

  const handlePress = () => {
    const newState = !displayState;
    if (state === undefined) {
      setIsActive(newState);
    }
    onPress?.(newState);
  };

  const styles = StyleSheet.create({
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: displayState ? 1.5 : 1,
      backgroundColor: displayState ? withOpacity(COLORS.token, 0.15) : COLORS.surface,
      borderColor: displayState ? COLORS.token : COLORS.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelActive: {
      fontSize: 13,
      fontFamily: FONTS.body,
      fontWeight: '600',
      color: COLORS.token,
      textAlign: 'center',
    },
    labelInactive: {
      fontSize: 13,
      fontFamily: FONTS.body,
      fontWeight: '500',
      color: COLORS.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity 
      style={styles.pill} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Text style={displayState ? styles.labelActive : styles.labelInactive}>{label}</Text>
    </TouchableOpacity>
  );
};

export default ShopFilterPill;