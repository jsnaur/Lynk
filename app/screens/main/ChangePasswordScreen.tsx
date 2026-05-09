import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import TextInput from '../../components/inputs/TextInput';
import Button from '../../components/buttons/Button';
import PasswordStrengthIndicator from '../../components/inputs/PasswordStrengthIndicator';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple password strength calculation
  const getPasswordStrength = (pass: string): 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong' => {
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

  const strength = getPasswordStrength(newPassword);

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (strength === 'Weak') {
      Alert.alert('Weak Password', 'Please choose a stronger password before proceeding.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setLoading(false);

      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );

    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to update password.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} disabled={loading}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.favor} />
          <Text style={styles.backLabel}>Settings</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Create a new, strong password for your account. We recommend using a mix of letters, numbers, and symbols.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            state={loading ? 'disabled' : 'default'}
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
            state={loading ? 'disabled' : confirmPassword && newPassword !== confirmPassword ? 'error' : 'default'}
            errorMessage="Passwords do not match"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Update Password"
          onPress={handleUpdatePassword}
          loading={loading}
          disabled={!newPassword || !confirmPassword || loading}
          style={styles.submitButton}
        />
      </View>

    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80, 
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.favor,
    fontFamily: 'DM_Sans-Regular',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'DM_Sans-Bold',
  },
  headerSpacer: {
    width: 80,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  instructionContainer: {
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontFamily: 'DM_Sans-Regular',
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
  },
  strengthContainer: {
    marginTop: -8, 
    marginBottom: 4,
    alignItems: 'center',
  },
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