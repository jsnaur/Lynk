import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';

type StrengthLevel = 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';

interface PasswordStrengthIndicatorProps {
  filled: StrengthLevel;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ filled }) => {
  const getSegmentColor = (index: number): string => {
    const filledSegments = {
      Empty: 0,
      Weak: 1,
      Fair: 2,
      Good: 3,
      Strong: 4,
    };

    const isFilled = index < filledSegments[filled];
    const isCurrentSegment = index === filledSegments[filled] - 1;

    if (filled === 'Weak' && isCurrentSegment) return '#ff4d4d'; // error
    if (filled === 'Fair' && isCurrentSegment) return FEED_COLORS.token; // gold
    if (filled === 'Good' && isCurrentSegment) return '#ff9500'; // orange
    if (filled === 'Strong' && isCurrentSegment) return FEED_COLORS.item; // lime

    if (!isFilled) return '#31313c'; // unfilled

    // Filled segments
    if (filled === 'Weak' || filled === 'Fair' || filled === 'Good' || filled === 'Strong') {
      if (index === 0) return '#ff4d4d'; // weak always red
      if (filled === 'Fair' && index === 1) return FEED_COLORS.token;
      if (filled === 'Fair' && index > 1) return '#31313c';
      if (index === 1 && (filled === 'Good' || filled === 'Strong'))
        return FEED_COLORS.token;
      if (filled === 'Good' && index === 2) return '#ff9500';
      if (filled === 'Good' && index > 2) return '#31313c';
      if (index === 2 && filled === 'Strong') return '#ff9500';
      if (filled === 'Strong' && index === 3) return FEED_COLORS.item;
      return '#31313c';
    }

    return '#31313c';
  };

  const getLabelColor = (label: 'Weak' | 'Fair' | 'Good' | 'Strong'): string => {
    if (label === 'Weak' && filled === 'Weak') return '#ff4d4d';
    if (label === 'Fair' && filled === 'Fair') return FEED_COLORS.token;
    if (label === 'Good' && filled === 'Good') return '#ff9500';
    if (label === 'Strong' && filled === 'Strong') return FEED_COLORS.item;
    return '#8a8a9a';
  };

  const styles = StyleSheet.create({
    container: {
      width: 326,
      gap: 6,
    },
    strengthBar: {
      flexDirection: 'row',
      gap: 4,
      height: 4,
      backgroundColor: 'transparent',
      borderRadius: 2,
    },
    segment: {
      flex: 1,
      height: '100%',
      borderRadius: 2,
    },
    strengthLabels: {
      flexDirection: 'row',
      gap: 10,
    },
    label: {
      flex: 1,
      fontSize: 12,
      fontFamily: 'DM Sans',
      fontWeight: '400',
      textAlign: 'center',
      color: '#8a8a9a',
    },
  });

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBar}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.segment, { backgroundColor: getSegmentColor(index) }]}
          />
        ))}
      </View>

      {/* Strength Labels */}
      <View style={styles.strengthLabels}>
        <Text
          style={[
            styles.label,
            { color: getLabelColor('Weak'), fontWeight: filled === 'Weak' ? '600' : '400' },
          ]}
        >
          Weak
        </Text>
        <Text
          style={[
            styles.label,
            { color: getLabelColor('Fair'), fontWeight: filled === 'Fair' ? '600' : '400' },
          ]}
        >
          Fair
        </Text>
        <Text
          style={[
            styles.label,
            { color: getLabelColor('Good'), fontWeight: filled === 'Good' ? '600' : '400' },
          ]}
        >
          Good
        </Text>
        <Text
          style={[
            styles.label,
            { color: getLabelColor('Strong'), fontWeight: filled === 'Strong' ? '600' : '400' },
          ]}
        >
          Strong
        </Text>
      </View>
    </View>
  );
};

export default PasswordStrengthIndicator;
