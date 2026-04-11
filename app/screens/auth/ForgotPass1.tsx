import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import EmailLogo from '../../../assets/ForgotPassAssets/Email_logo.svg';
import { forgotStyles } from './ForgotPass.styles';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPass1({ navigation }: any) {
  const [email, setEmail] = useState('');
  const trimmedEmail = email.trim();

  const showError = useMemo(() => trimmedEmail.length > 0 && !isValidEmail(trimmedEmail), [trimmedEmail]);
  const canContinue = trimmedEmail.length > 0 && !showError;
  	
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
            Enter your email and we will send you a reset link.
          </Text>

          <View>
            <Text style={forgotStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#71758A"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[forgotStyles.input, showError && forgotStyles.inputError]}
            />
            {showError && <Text style={forgotStyles.errorText}>Please enter a valid email address.</Text>}
              							</View>

          <Pressable
            disabled={!canContinue}
            onPress={() => navigation.navigate('ForgotPass2', { email: trimmedEmail })}
            style={({ pressed }) => [
              forgotStyles.actionBtn,
              !canContinue && forgotStyles.actionBtnDisabled,
              pressed && canContinue && forgotStyles.actionBtnPressed,
            ]}
          >
            <Text style={forgotStyles.actionText}>Send reset link</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
              							