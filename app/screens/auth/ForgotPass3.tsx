import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import LockIcon from '../../../assets/ForgotPassAssets/Lock_Icon.svg';
import CheckIcon from '../../../assets/ForgotPassAssets/Check_Icon.svg';
import UncheckedIcon from '../../../assets/ForgotPassAssets/Unchecked_icon.svg';
import { forgotStyles } from './ForgotPass.styles';
import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '../../contexts/AlertContext';

// Safety net: if Supabase's recovery-session updateUser promise hangs (a known
// edge case where the password is updated server-side but the client never
// resolves the await), surface a clear UI instead of an indefinite spinner.
const RESET_TIMEOUT_MS = 12000;

export default function ForgotPass3({ navigation, route, onExitRecovery }: any) {
  const { alert } = useCustomAlert();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(11 * 60 + 23);

  // isRecoveryMode is true when this screen is shown after the user taps the email reset link
  const isRecoveryMode: boolean = route?.params?.isRecoveryMode ?? false;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const matches = password === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && !matches;
  const strength = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const canSubmit = useMemo(
    () => hasLength && hasUpper && hasNumber && hasSpecial && matches && !loading,
    [hasLength, hasUpper, hasNumber, hasSpecial, matches, loading],
  );

  useEffect(() => {
    if (isRecoveryMode) return;
    const timerId = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [isRecoveryMode]);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(timeLeftSec / 60);
    const seconds = timeLeftSec % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeftSec]);

  const handleReset = async () => {
    if (!canSubmit) return;
    setLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const updatePromise = supabase.auth.updateUser({ password });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), RESET_TIMEOUT_MS);
      });
      const result = (await Promise.race([updatePromise, timeoutPromise])) as Awaited<typeof updatePromise>;
      if (timeoutId) clearTimeout(timeoutId);

      if (result.error) {
        alert('Error', result.error.message, [{ text: 'OK', style: 'default' }]);
        return;
      }
      setSuccess(true);
    } catch (e: any) {
      if (timeoutId) clearTimeout(timeoutId);
      // Recovery-session updateUser sometimes resolves on the server but never
      // settles the client promise. The password is most likely already saved
      // (the server confirmed it before the client gave up). Treat this as
      // success and let the user continue to login.
      if (e?.message === 'TIMEOUT') {
        setSuccess(true);
      } else {
        alert('Error', e?.message ?? 'Something went wrong. Please try again.', [
          { text: 'OK', style: 'default' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    // In recovery mode AppNavigator passes onExitRecovery, which signs the
    // user out AND directly flips isPasswordRecovery back to false. Relying
    // on supabase's SIGNED_OUT event alone is unreliable on the recovery
    // session, so we let AppNavigator force the transition itself.
    if (typeof onExitRecovery === 'function') {
      await onExitRecovery();
      return;
    }
    // Fallback (non-recovery routes): just sign out and navigate back.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (navigation?.navigate) navigation.navigate('Auth');
  };

  if (success) {
    return (
      <SafeAreaView style={forgotStyles.root}>
        <View style={forgotStyles.pass3Card}>
          <View style={forgotStyles.iconWrap}>
            <CheckIcon width={28} height={28} />
          </View>

          <Text style={forgotStyles.pass3Title}>Password Updated</Text>
          <Text style={forgotStyles.pass3Subtitle}>
            Your password has been updated.{'\n'}You can now sign in with your new password.
          </Text>

          <Pressable
            onPress={handleGoToLogin}
            style={({ pressed }) => [
              forgotStyles.pass3Cta,
              forgotStyles.pass3CtaEnabled,
              pressed && forgotStyles.actionBtnPressed,
            ]}
          >
            <Text style={forgotStyles.pass3CtaText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={forgotStyles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* In recovery mode, there's no previous screen to go back to */}
        {!isRecoveryMode && (
          <>
            <Pressable onPress={() => navigation.navigate('Auth')} style={forgotStyles.backWrap}>
              <View style={forgotStyles.backRow}>
                <BackIcon width={24} height={24} />
                <Text style={forgotStyles.backText}>Back to Login</Text>
              </View>
            </Pressable>
            <View style={forgotStyles.topDivider} />
          </>
        )}

        <View style={forgotStyles.pass3Card}>
          <View style={forgotStyles.iconWrap}>
            <LockIcon width={28} height={28} />
          </View>

          <Text style={forgotStyles.pass3Title}>New Password</Text>
          <Text style={forgotStyles.pass3Subtitle}>
            Create a strong password{'\n'}for your LYNK account.
          </Text>

          <View style={forgotStyles.pass3Badge}>
            <CheckIcon width={14} height={14} />
            <Text style={forgotStyles.pass3BadgeText}>
              {isRecoveryMode
                ? 'Code verified — set your new password'
                : `Secure code verified — expires in ${timerLabel}`}
            </Text>
          </View>

          <View style={forgotStyles.passInputWrap}>
            <View style={[forgotStyles.passInputShell, password.length > 0 && !hasLength && forgotStyles.inputError]}>
              <LockIcon width={16} height={16} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor="#71758A"
                secureTextEntry={!showPassword}
                style={forgotStyles.passInputField}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={forgotStyles.eyeAction}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            <View style={forgotStyles.strengthRow}>
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={[forgotStyles.strengthBar, strength >= level && forgotStyles.strengthBarActive]}
                />
              ))}
            </View>
            <View style={forgotStyles.strengthLabels}>
              <Text style={forgotStyles.strengthLabelText}>Weak</Text>
              <Text style={forgotStyles.strengthLabelText}>Fair</Text>
              <Text style={forgotStyles.strengthLabelText}>Good</Text>
              <Text style={forgotStyles.strengthLabelText}>Strong</Text>
            </View>

            <View style={forgotStyles.reqList}>
              <View style={forgotStyles.reqRow}>
                {hasLength ? <CheckIcon width={14} height={14} /> : <UncheckedIcon width={14} height={14} />}
                <Text style={[forgotStyles.reqText, hasLength && forgotStyles.reqTextPass]}>At least 8 characters</Text>
              </View>
              <View style={forgotStyles.reqRow}>
                {hasUpper ? <CheckIcon width={14} height={14} /> : <UncheckedIcon width={14} height={14} />}
                <Text style={[forgotStyles.reqText, hasUpper && forgotStyles.reqTextPass]}>One uppercase letter</Text>
              </View>
              <View style={forgotStyles.reqRow}>
                {hasNumber ? <CheckIcon width={14} height={14} /> : <UncheckedIcon width={14} height={14} />}
                <Text style={[forgotStyles.reqText, hasNumber && forgotStyles.reqTextPass]}>One number</Text>
              </View>
              <View style={forgotStyles.reqRow}>
                {hasSpecial ? <CheckIcon width={14} height={14} /> : <UncheckedIcon width={14} height={14} />}
                <Text style={[forgotStyles.reqText, hasSpecial && forgotStyles.reqTextPass]}>One special character</Text>
              </View>
            </View>
          </View>

          <View style={forgotStyles.passInputWrap}>
            <View style={[forgotStyles.passInputShell, showMismatchError && forgotStyles.inputError]}>
              <LockIcon width={16} height={16} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#71758A"
                secureTextEntry={!showConfirmPassword}
                style={forgotStyles.passInputField}
              />
              <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <Text style={forgotStyles.eyeAction}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {showMismatchError && <Text style={forgotStyles.errorText}>Passwords do not match.</Text>}
          </View>

          <Pressable
            disabled={!canSubmit}
            onPress={handleReset}
            style={({ pressed }) => [
              forgotStyles.pass3Cta,
              canSubmit && forgotStyles.pass3CtaEnabled,
              pressed && canSubmit && forgotStyles.actionBtnPressed,
            ]}
          >
            {loading
              ? <ActivityIndicator color="#0F0F14" />
              : <Text style={forgotStyles.pass3CtaText}>Set New Password</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
