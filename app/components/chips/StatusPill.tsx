import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type StatusPillProps = {
  status?: 'Open' | 'Accepted' | 'Completed' | 'Expired';
};

export default function StatusPill({ status = 'Open' }: StatusPillProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'Open':
        return FEED_COLORS.favor;
      case 'Accepted':
        return FEED_COLORS.favor;
      case 'Completed':
        return '#39FF14';
      case 'Expired':
        return '#FF4d4d';
      default:
        return FEED_COLORS.favor;
    }
  };

  const backgroundColor = `${getStatusColor()}20`;
  const textColor = getStatusColor();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'DM_Sans-Medium',
  },
});
