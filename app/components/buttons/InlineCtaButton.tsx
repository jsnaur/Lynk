import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { FEED_COLORS } from '../../constants/colors';
import LoadingDots from '../loading/LoadingDots';

type ButtonState = 'Disabled' | 'Active' | 'Loading';

interface InlineCtaButtonProps {
  state: ButtonState;
  onPress?: () => void;
  label?: string;
}

const InlineCtaButton: React.FC<InlineCtaButtonProps> = ({
  state,
  onPress,
  label = 'Publish',
}) => {
  const isDisabled = state === 'Disabled';
  const isActive = state === 'Active';
  const isLoading = state === 'Loading';

  const styles = StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDisabled ? '#31313c' : isActive ? FEED_COLORS.favor : `${FEED_COLORS.favor}66`, // loading: 40% opacity
      width: isLoading ? 'auto' : 'auto', // responsive width
      minWidth: isLoading ? 85 : 'auto',
    },
    text: {
      fontSize: 14,
      fontFamily: 'DM Sans',
      fontWeight: '600',
      color: isDisabled ? '#8a8a9a' : '#1a1a1f',
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
  });

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.button} disabled={true} activeOpacity={0.8}>
        <View style={styles.loadingContainer}>
          <LoadingDots />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

export default InlineCtaButton;
