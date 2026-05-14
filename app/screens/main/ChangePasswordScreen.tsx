import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { screenHeaderTheme, useTheme } from '../../contexts/ThemeContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import TextInput from '../../components/inputs/TextInput';
import Button from '../../components/buttons/Button';
import PasswordStrengthIndicator from '../../components/inputs/PasswordStrengthIndicator';

type StrengthLevel = 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';

const getPasswordStrength = (pass: string): StrengthLevel => {
  if (!pass) return 'Empty';
  if (pass.length < 6) return 'Weak';

  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return 'Weak';
  if (score === 2) return 'Fair';
  if (score === 3) return 'Good';
  return 'Strong';
};

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const { alert } = useCustomAlert();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const strength = getPasswordStrength(newPassword);
  const passwordsMismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;
  const reusingOldPassword =
    Boolean(currentPassword) && Boolean(newPassword) && currentPassword === newPassword;

  const isReady =
    !loading &&
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0 &&
    !passwordsMismatch &&
    !reusingOldPassword;

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Missing Fields', 'Please fill in all fields before continuing.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords Do Not Match', 'Please make sure both new password fields match.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('Reuse Detected', 'Your new password must be different from your current password.');
      return;
    }

    if (strength === 'Weak') {
      alert('Weak Password', 'Please choose a stronger password before proceeding.');
      return;
    }

    setLoading(true);
    setCurrentPasswordError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.email) {
        throw new Error('Unable to verify your account. Please sign in again.');
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        setCurrentPasswordError('Current password is incorrect.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setLoading(false);

      alert(
        'Password Updated',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      setLoading(false);
      alert('Error', error?.message || 'Failed to update password.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header — matches SettingsScreen layout for consistency */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textPrimary} />
          <Text style={styles.backLabel} numberOfLines={1}>
            Settings
          </Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1} pointerEvents="none">
          Change Password
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Confirm your current password, then choose a new one. Use a mix of letters,
            numbers, and symbols for the best protection.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Current Password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              if (currentPasswordError) setCurrentPasswordError(null);
            }}
            secureTextEntry
            state={
              loading
                ? 'disabled'
                : currentPasswordError
                ? 'error'
                : 'default'
            }
            errorMessage={currentPasswordError ?? undefined}
          />

          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            state={
              loading
                ? 'disabled'
                : reusingOldPassword
                ? 'error'
                : 'default'
            }
            errorMessage={
              reusingOldPassword ? 'New password must differ from current password.' : undefined
            }
          />

          <View style={styles.strengthContainer}>
            <PasswordStrengthIndicator filled={strength} />
          </View>

          <TextInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            state={loading ? 'disabled' : passwordsMismatch ? 'error' : 'default'}
            errorMessage={passwordsMismatch ? 'Passwords do not match.' : undefined}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Update Password"
          onPress={handleUpdatePassword}
          loading={loading}
          disabled={!isReady}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, _theme: string) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    // ── Header (mirrors SettingsScreen) ──────────────────────────────────────
    header: {
      height: screenHeaderTheme.layout.height + 24,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: screenHeaderTheme.layout.topPadding + 12,
      paddingHorizontal: screenHeaderTheme.layout.horizontalPadding,
      paddingBottom: screenHeaderTheme.layout.bottomPadding + 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'relative',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      width: 112,
      justifyContent: 'flex-start',
      zIndex: 1,
    },
    backLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.favor,
      fontFamily: 'DM_Sans-Medium',
      flexShrink: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'DM_Sans-Bold',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: screenHeaderTheme.layout.bottomPadding + 12,
      textAlign: 'center',
      zIndex: 0,
    },
    headerSpacer: {
      width: 112,
      zIndex: 1,
    },

    // ── Scroll body ──────────────────────────────────────────────────────────
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    instructionContainer: {
      marginBottom: 24,
    },
    instructionText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'DM_Sans-Regular',
      lineHeight: 20,
    },
    formContainer: {
      gap: 20,
    },
    strengthContainer: {
      marginTop: -8,
      marginBottom: 4,
      alignItems: 'center',
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
    submitButton: {
      width: '100%',
    },
  });
