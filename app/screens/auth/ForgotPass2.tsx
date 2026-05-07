import React, { useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import EnvelopePixelSprite from '../../../assets/ForgotPassAssets/Envelope_Pixel_Sprite.svg';
import { forgotStyles } from './ForgotPass.styles';
import { supabase } from '../../lib/supabase';

const OTP_LENGTH = 6;

export default function ForgotPass2({ navigation, route }: any) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const email: string = route?.params?.email ?? '';
  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email || 'your email';
    if (name.length <= 2) return `${name[0] ?? '*'}*@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  const code = digits.join('');
  const canVerify = code.length === OTP_LENGTH && !loading;

  const handleDigit = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    if (!canVerify) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    setLoading(false);
    if (error) {
      setError('Invalid or expired code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
      return;
    }
    // Success: AppNavigator's onAuthStateChange receives PASSWORD_RECOVERY
    // and automatically switches to the ForgotPass3 reset screen
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(email);
    setResending(false);
    setDigits(Array(OTP_LENGTH).fill(''));
    refs.current[0]?.focus();
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

        <View style={forgotStyles.inboxCard}>
          <View style={forgotStyles.mailSpriteWrap}>
            <EnvelopePixelSprite width={58} height={58} />
          </View>

          <Text style={forgotStyles.inboxTitle}>Enter the Code</Text>
          <Text style={forgotStyles.inboxSubtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={forgotStyles.inboxEmailText}>{maskedEmail}</Text>
            {'\n'}Check your inbox and enter it below.
          </Text>

          {/* OTP digit boxes */}
          <View style={forgotStyles.otpRow}>
            {digits.map((digit, i) => (
              <Pressable key={i} style={{ flex: 1 }} onPress={() => refs.current[i]?.focus()}>
                <View
                  style={[
                    forgotStyles.otpBox,
                    focusedIndex === i && forgotStyles.otpBoxFocused,
                    !!digit && forgotStyles.otpBoxFilled,
                  ]}
                >
                  <TextInput
                    ref={(r) => { refs.current[i] = r; }}
                    value={digit}
                    onChangeText={(t) => handleDigit(t, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={forgotStyles.otpDigit}
                    caretHidden
                    selectTextOnFocus
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={[forgotStyles.errorText, { textAlign: 'center' }]}>{error}</Text> : null}

          <Pressable
            disabled={!canVerify}
            onPress={handleVerify}
            style={({ pressed }) => [
              forgotStyles.actionBtn,
              { width: '100%', marginTop: 4 },
              !canVerify && forgotStyles.actionBtnDisabled,
              pressed && canVerify && forgotStyles.actionBtnPressed,
            ]}
          >
            {loading
              ? <ActivityIndicator color="#14121A" />
              : <Text style={forgotStyles.actionText}>Verify Code</Text>
            }
          </Pressable>

          <Pressable
            style={({ pressed }) => [forgotStyles.resendWrap, pressed && { opacity: 0.7 }]}
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={forgotStyles.resendLead}>Didn't receive it? </Text>
            {resending
              ? <ActivityIndicator size="small" color="#11E0E8" />
              : <Text style={forgotStyles.resendAction}>Resend code</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
