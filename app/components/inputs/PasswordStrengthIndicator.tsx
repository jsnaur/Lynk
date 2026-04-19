import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

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

    if (filled === 'Weak' && isCurrentSegment) return COLORS.error; 
    if (filled === 'Fair' && isCurrentSegment) return COLORS.token; 
    if (filled === 'Good' && isCurrentSegment) return COLORS.warning; 
    if (filled === 'Strong' && isCurrentSegment) return COLORS.item; 

    if (!isFilled) return COLORS.surface2; // unfilled

    // Filled segments
    if (filled === 'Weak' || filled === 'Fair' || filled === 'Good' || filled === 'Strong') {
      if (index === 0) return COLORS.error; // weak always red
      if (filled === 'Fair' && index === 1) return COLORS.token;
      if (filled === 'Fair' && index > 1) return COLORS.surface2;
      if (index === 1 && (filled === 'Good' || filled === 'Strong'))
        return COLORS.token;
      if (filled === 'Good' && index === 2) return COLORS.warning;
      if (filled === 'Good' && index > 2) return COLORS.surface2;
      if (index === 2 && filled === 'Strong') return COLORS.warning;
      if (filled === 'Strong' && index === 3) return COLORS.item;
      return COLORS.surface2;
    }

    return COLORS.surface2;
  };

  const getLabelColor = (label: 'Weak' | 'Fair' | 'Good' | 'Strong'): string => {
    if (label === 'Weak' && filled === 'Weak') return COLORS.error;
    if (label === 'Fair' && filled === 'Fair') return COLORS.token;
    if (label === 'Good' && filled === 'Good') return COLORS.warning;
    if (label === 'Strong' && filled === 'Strong') return COLORS.item;
    return COLORS.textSecondary;
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
      fontFamily: FONTS.body,
      fontWeight: '400',
      textAlign: 'center',
      color: COLORS.textSecondary,
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