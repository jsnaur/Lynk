import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
};

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#3a3a48';
    switch (variant) {
      case 'primary':
        return FEED_COLORS.favor;
      case 'secondary':
        return '#26262e';
      case 'success':
        return '#39FF14';
      case 'error':
        return '#FF4d4d';
      case 'text':
        return 'transparent';
      default:
        return FEED_COLORS.favor;
    }
  };

  const getTextColor = () => {
    if (variant === 'text' || (disabled && variant !== 'secondary')) {
      return '#8a8a9a';
    }
    if (variant === 'secondary') return '#f0f0f5';
    if (variant === 'success' || variant === 'error') return '#1a1a1f';
    return '#1a1a1f';
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 8 };
      case 'medium':
        return { paddingHorizontal: 16, paddingVertical: 12 };
      case 'large':
        return { paddingHorizontal: 24, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 16, paddingVertical: 12 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 14;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  const isSecondary = variant === 'secondary';
  const borderColor = isSecondary ? '#3a3a48' : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        getPadding(),
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator color={getTextColor()} size="small" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <MaterialCommunityIcons
            name={icon as any}
            size={getFontSize()}
            color={getTextColor()}
          />
        )}

        <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
          {title}
        </Text>

        {!loading && icon && iconPosition === 'right' && (
          <MaterialCommunityIcons
            name={icon as any}
            size={getFontSize()}
            color={getTextColor()}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    fontFamily: 'DM_Sans-SemiBold',
  },
});
