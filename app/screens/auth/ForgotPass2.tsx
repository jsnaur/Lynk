import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/ForgotPassAssets/Back_Icon.svg';
import EnvelopePixelSprite from '../../../assets/ForgotPassAssets/Envelope_Pixel_Sprite.svg';
import ClockIcon from '../../../assets/ForgotPassAssets/Clock_Icon.svg';
import CheckIcon from '../../../assets/ForgotPassAssets/Check_Icon.svg';
import UncheckedIcon from '../../../assets/ForgotPassAssets/Unchecked_icon.svg';
import { forgotStyles } from './ForgotPass.styles';

export default function ForgotPass2({ navigation, route }: any) {
  const [timeLeftSec, setTimeLeftSec] = useState(15 * 60);

  const maskedEmail = useMemo(() => {
    const value = route.params.email;
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    if (name.length <= 2) return `${name[0] || '*'}*@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, [route.params.email]);

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

  const handleOpenEmailApp = async () => {
    try {
      await Linking.openURL('mailto:');
    } catch {
      // Fall through to next screen even when no mail app is available.
    }
    navigation.navigate('ForgotPass3', { email: route.params.email });
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

          <Text style={forgotStyles.inboxTitle}>Check Your Inbox</Text>
          <Text style={forgotStyles.inboxSubtitle}>
            We&apos;ve sent a reset link to <Text style={forgotStyles.inboxEmailText}>[{maskedEmail}]</Text>.
            {'\n'}
            It expires in 15 minutes.
          </Text>

          <View style={forgotStyles.timerBadge}>
            <ClockIcon width={14} height={14} />
            <Text style={forgotStyles.timerText}>Link expires in {timerLabel}</Text>
          </View>

          <View style={forgotStyles.stepsWrap}>
            <View style={forgotStyles.stepRow}>
              <CheckIcon width={20} height={20} />
              <Text style={forgotStyles.stepText}>Open the email from LYNK in your inbox</Text>
            </View>
            <View style={forgotStyles.stepRow}>
              <UncheckedIcon width={20} height={20} />
              <Text style={forgotStyles.stepText}>Tap the reset link - it opens the app</Text>
            </View>
            <View style={forgotStyles.stepRow}>
              <UncheckedIcon width={20} height={20} />
              <Text style={forgotStyles.stepText}>Create your new password</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [forgotStyles.resendWrap, pressed && { opacity: 0.8 }]}
            onPress={() => setTimeLeftSec(15 * 60)}
          >
            <Text style={forgotStyles.resendLead}>Didn&apos;t receive it? </Text>
            <Text style={forgotStyles.resendAction}>Resend email</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [forgotStyles.emailButton, pressed && { opacity: 0.85 }]}
            onPress={handleOpenEmailApp}
          >
            <Text style={forgotStyles.emailButtonText}>Open Email App</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
