import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';

export type ButtonVariant = 'Primary' | 'Secondary' | 'Outline' | 'Danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  color?: string;
}

export default function Button({
  label,
  onPress,
  variant = 'Primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  leftIcon,
  rightIcon,
  color,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.surface2;
    if (color && variant !== 'Outline') return color;
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
    if (variant === 'Outline') return color ?? COLORS.border;
    return 'transparent';
  };

  const sizeStyles = size === 'sm' ? styles.containerSm : styles.containerMd;
  const labelStyles = size === 'sm' ? styles.labelSm : styles.labelMd;

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

  const handlePress = () => {
    if (!onPress || disabled || loading) {
      return;
    }

    void appSoundManager.play(AppSoundCategory.ButtonPress);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'Outline' ? 1 : 0,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={[labelStyles, { color: getTextColor() }]}>{label}</Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  containerMd: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  containerSm: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  labelMd: {
    fontSize: 18,
    fontFamily: FONTS.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSm: {
    fontSize: 14,
    fontFamily: FONTS.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
// TODO: Migrate InlineCtaButton callers to this component once a `loading` variant
// with the LoadingDots animation is added here. Until then, keep InlineCtaButton.