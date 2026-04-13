import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

interface ShopFilterPillProps {
  label: string;
  state: boolean; // true = active, false = inactive (Default)
}

const ShopFilterPill: React.FC<ShopFilterPillProps> = ({ label, state }) => {
  const styles = StyleSheet.create({
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: state ? 1.5 : 1,
      backgroundColor: state ? `${FEED_COLORS.token}26` : '#26262e', // 15% opacity for active
      borderColor: state ? FEED_COLORS.token : '#3a3a48',
      justifyContent: 'center',
      alignItems: 'center',
    },
    labelActive: {
      fontSize: 13,
      fontFamily: 'DM Sans',
      fontWeight: '600',
      color: FEED_COLORS.token,
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

export default ShopFilterPill;
