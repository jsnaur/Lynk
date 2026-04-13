import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

interface HistoryFilterPillProps {
  label: string;
  state?: boolean; // true = active, false = inactive (optional - component can manage own state)
  onPress?: (isActive: boolean) => void; // Callback when state changes
}

const HistoryFilterPill: React.FC<HistoryFilterPillProps> = ({ label, state, onPress }) => {
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
      borderWidth: 1,
      backgroundColor: displayState ? '#31313c' : '#26262e',
      borderColor: displayState ? FEED_COLORS.favor : '#3a3a48',
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelActive: {
      fontSize: 13,
      fontFamily: 'DM Sans',
      fontWeight: '600',
      color: FEED_COLORS.favor,
      textAlign: 'center',
    },
    labelInactive: {
      fontSize: 13,
      fontFamily: 'DM Sans',
      fontWeight: '500',
      color: '#8a8a9a',
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

export default HistoryFilterPill;
