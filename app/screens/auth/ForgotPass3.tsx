import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import LockIcon from '../../../assets/ForgotPassAssets/Lock_Icon.svg';
import CheckIcon from '../../../assets/ForgotPassAssets/Check_Icon.svg';
import UncheckedIcon from '../../../assets/ForgotPassAssets/Unchecked_icon.svg';
import { forgotStyles } from './ForgotPass.styles';

export default function ForgotPass3({ navigation, route }: any) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(11 * 60 + 23);

  const email = route?.params?.email ?? '';

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const matches = password === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && !matches;
  const strength = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const canSubmit = useMemo(
    () => hasLength && hasUpper && hasNumber && hasSpecial && matches,
    [hasLength, hasUpper, hasNumber, hasSpecial, matches],
  );

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(timeLeftSec / 60);
    const seconds = timeLeftSec % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [timeLeftSec]);

  const handleReset = () => {
    Alert.alert('Password reset complete', `Your password for ${email} has been updated.`);
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={forgotStyles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={() => navigation.navigate('Auth')} style={forgotStyles.backWrap}>
          <View style={forgotStyles.backRow}>
            <BackIcon width={24} height={24} />
            <Text style={forgotStyles.backText}>Back to Login</Text>
          </View>
        </Pressable>
        <View style={forgotStyles.topDivider} />

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
            <Text style={forgotStyles.pass3BadgeText}>Secure link verified — expires in {timerLabel}</Text>
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
            <Text style={forgotStyles.pass3CtaText}>Set New Password</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
