import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import appSoundManager from '../../lib/SoundManager';
import { createFadeSlideStyle, createMotionValues, createStaggeredEntrance } from '../../navigation/navigationMotion';

const OTP_LENGTH = 6;

export default function ForgotPass2({ navigation, route }: any) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const motionValues = useRef(createMotionValues(3)).current;
  const otpMotionValues = useRef(createMotionValues(OTP_LENGTH)).current;

  const email: string = route?.params?.email ?? '';
  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email || 'your email';
    if (name.length <= 2) return `${name[0] ?? '*'}*@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  const code = digits.join('');
  const canVerify = code.length === OTP_LENGTH && !loading;

  useEffect(() => {
    createStaggeredEntrance(motionValues).start();
    createStaggeredEntrance(otpMotionValues, 200, 45).start();
  }, [motionValues, otpMotionValues]);

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
      void appSoundManager.playAuthErrorBuzz();
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
        <Animated.View style={createFadeSlideStyle(motionValues[0], 10)}>
          <Pressable onPress={() => navigation.navigate('Auth')} style={forgotStyles.backWrap}>
            <View style={forgotStyles.backRow}>
              <BackIcon width={24} height={24} />
              <Text style={forgotStyles.backText}>Back to Login</Text>
            </View>
          </Pressable>
        </Animated.View>
        <Animated.View style={createFadeSlideStyle(motionValues[1], 8)}>
          <View style={forgotStyles.topDivider} />
        </Animated.View>

        <Animated.View style={createFadeSlideStyle(motionValues[2], 14)}>
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
                <Animated.View key={i} style={[{ flex: 1 }, createFadeSlideStyle(otpMotionValues[i], 8)]}>
                  <Pressable style={{ flex: 1 }} onPress={() => refs.current[i]?.focus()}>
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
                </Animated.View>
              ))}
            </View>

          {error ? <Text style={[forgotStyles.errorText, { textAlign: 'center' }]}>{error}</Text> : null}

            <Pressable
              disabled={!canVerify}
              onPress={handleVerify}
              style={({ pressed }) => [
                forgotStyles.actionBtn,
                { width: '100%', marginTop: 14 },
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
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
