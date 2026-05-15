import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import EmailLogo from '../../../assets/ForgotPassAssets/Email_logo.svg';
import { forgotStyles } from './ForgotPass.styles';
import { supabase } from '../../lib/supabase';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPass1({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const trimmedEmail = email.trim().toLowerCase();
  const isCit = isValidEmail(trimmedEmail) && trimmedEmail.endsWith('@cit.edu');
  const showFormatError = trimmedEmail.length > 0 && !isValidEmail(trimmedEmail);
  const showNonCitError = trimmedEmail.length > 0 && isValidEmail(trimmedEmail) && !isCit;
  const canContinue = trimmedEmail.length > 0 && isCit && !loading;

  const handleSend = async () => {
    if (!canContinue) return;
    setApiError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setLoading(false);
    if (error) {
      setApiError(error.message);
      return;
    }
    navigation.navigate('ForgotPass2', { email: trimmedEmail });
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

        <View style={forgotStyles.card}>
          <View style={forgotStyles.iconWrap}>
            <EmailLogo width={34} height={34} />
          </View>

          <Text style={forgotStyles.title}>Forgot Password</Text>
          <Text style={forgotStyles.subtitle}>
            Enter your @cit.edu email and we'll send you a 6-digit verification code.
          </Text>

          <View>
            <Text style={forgotStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(val) => { setEmail(val); setApiError(null); }}
              placeholder="you@cit.edu"
              placeholderTextColor="#71758A"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[forgotStyles.input, (showFormatError || showNonCitError) && forgotStyles.inputError]}
            />
            {showFormatError && (
              <Text style={forgotStyles.errorText}>Please enter a valid email address.</Text>
            )}
            {showNonCitError && (
              <Text style={forgotStyles.errorText}>
                Only @cit.edu emails are supported for password reset.
              </Text>
            )}
            {apiError && <Text style={forgotStyles.errorText}>{apiError}</Text>}
          </View>

          <Pressable
            disabled={!canContinue}
            onPress={handleSend}
            style={({ pressed }) => [
              forgotStyles.actionBtn,
              !canContinue && forgotStyles.actionBtnDisabled,
              pressed && canContinue && forgotStyles.actionBtnPressed,
            ]}
          >
            {loading
              ? <ActivityIndicator color="#0F0F14" />
              : <Text style={forgotStyles.actionText}>Send One-Time Password</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
