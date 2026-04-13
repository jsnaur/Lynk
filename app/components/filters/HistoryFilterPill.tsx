import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

interface HistoryFilterPillProps {
  label: string;
  state: boolean; // true = active, false = inactive
}

const HistoryFilterPill: React.FC<HistoryFilterPillProps> = ({ label, state }) => {
  const styles = StyleSheet.create({
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: state ? '#31313c' : '#26262e',
      borderColor: state ? FEED_COLORS.favor : '#3a3a48',
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
    <TouchableOpacity style={styles.pill} activeOpacity={0.8}>
      <Text style={state ? styles.labelActive : styles.labelInactive}>{label}</Text>
    </TouchableOpacity>
  );
};

export default HistoryFilterPill;
