import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

type InputState = 'default' | 'focus' | 'success' | 'error' | 'disabled';

type TextInputProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  state?: InputState;
  errorMessage?: string;
  secureTextEntry?: boolean;
  showCopyButton?: boolean;
  onCopy?: () => void;
};

export default function TextInput({
  label,
  placeholder = 'Enter text',
  value = '',
  onChangeText,
  state = 'default',
  errorMessage,
  secureTextEntry = false,
  showCopyButton = false,
  onCopy,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const getBackgroundColor = () => {
    if (state === 'disabled') return COLORS.bg;
    return COLORS.surface;
  };

  const getBorderColor = () => {
    if (state === 'disabled') return COLORS.border;
    if (state === 'success') return COLORS.item;
    if (state === 'error') return COLORS.error;
    if (isFocused) return COLORS.favor;
    return COLORS.border;
  };

  const getTextColor = () => {
    if (state === 'disabled') return COLORS.textSecondary;
    return COLORS.textPrimary;
  };

  const getPlaceholderColor = () => {
    return COLORS.textSecondary;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
        ]}
      >
        <RNTextInput
          style={[
            styles.input,
            {
              color: getTextColor(),
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={getPlaceholderColor()}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          editable={state !== 'disabled'}
        />

        {isSecure && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsSecure(!isSecure)}
          >
            <MaterialCommunityIcons
              name={isSecure ? 'eye-off' : 'eye'}
              size={20}
              color={getTextColor()}
            />
          </TouchableOpacity>
        )}

        {showCopyButton && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onCopy}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={20}
              color={getTextColor()}
            />
          </TouchableOpacity>
        )}

        {state === 'success' && !showCopyButton && !isSecure && (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={COLORS.item}
            style={styles.icon}
          />
        )}

        {state === 'error' && (
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={COLORS.error}
            style={styles.icon}
          />
        )}
      </View>

      {errorMessage && state === 'error' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.body, 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    fontFamily: FONTS.body,
  },
  icon: {
    marginLeft: 12,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
});