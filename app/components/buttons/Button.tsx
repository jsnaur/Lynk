import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export type ButtonVariant = 'Primary' | 'Secondary' | 'Outline' | 'Danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'Primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.surface2;
    switch (variant) {
      case 'Primary': return COLORS.favor;
      case 'Secondary': return COLORS.surface2;
      case 'Danger': return COLORS.error;
      case 'Outline': return 'transparent';
      default: return COLORS.favor;
    }
  };

  const getBorderColor = () => {
    if (disabled) return 'transparent';
    if (variant === 'Outline') return COLORS.border;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textSecondary;
    switch (variant) {
      case 'Primary':
      case 'Danger':
        return COLORS.bg;
      case 'Secondary':
      case 'Outline':
        return COLORS.textPrimary;
      default:
        return COLORS.bg;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'Outline' ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  label: {
    fontSize: 18,
    fontFamily: FONTS.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});