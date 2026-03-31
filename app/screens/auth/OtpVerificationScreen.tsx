import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface OtpVerificationScreenProps {
    email: string;
    onVerified: () => void;
    onBack: () => void;
}

export default function OtpVerificationScreen({ email, onVerified, onBack }: OtpVerificationScreenProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Timer state for Resend button to prevent rate limiting
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Countdown Timer Logic
    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    async function handleVerify() {
        if (code.length !== 6) {
            Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
            return;
        }

        setLoading(true);
        
        // CRITICAL FIX: type 'signup' explicitly matches the initial registration request
        const { error } = await supabase.auth.verifyOtp({
            email: email,
            token: code,
            type: 'signup'
        });

        setLoading(false);

        if (error) {
            Alert.alert('Verification Failed', error.message);
        } else {
            onVerified();
        }
    }

    async function handleResend() {
        if (!canResend) return;

        // Reset timer immediately to prevent spam
        setCanResend(false);
        setTimeLeft(60);

        // Call the official Supabase Resend API
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) {
            Alert.alert('Failed to Resend', error.message);
        } else {
            Alert.alert('Code Sent', 'A new 6-digit code has been sent to your email.');
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                
                {/* Back Button */}
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>

                <View style={styles.content}>
                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.subtitle}>
                        We sent a 6-digit verification code to:
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>

                    {/* OTP Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="••••••"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={code}
                        onChangeText={setCode}
                    />

                    {/* Verify Button */}
                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Verify Account</Text>
                        )}
                    </Pressable>

                    {/* Resend Logic */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive a code? </Text>
                        <Pressable onPress={handleResend} disabled={!canResend}>
                            <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                                {canResend ? 'Resend' : `Resend in ${timeLeft}s`}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Included styles to match the dark theme established in AuthScreen.
// You can extract these to your OtpVerificationScreenStyle.ts file if preferred.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1F', 
    },
    keyboardView: {
        flex: 1,
    },
    backButton: {
        padding: 20,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#667EEA', 
        marginBottom: 32,
    },
    input: {
        backgroundColor: '#2A2A35',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 24,
        letterSpacing: 8,
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#667EEA',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    resendLink: {
        color: '#667EEA',
        fontSize: 14,
        fontWeight: 'bold',
    },
    resendLinkDisabled: {
        color: '#4b5563',
    },
});