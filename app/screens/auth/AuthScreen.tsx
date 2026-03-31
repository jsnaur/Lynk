import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SvgUri } from 'react-native-svg';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from './AuthScreenStyles';
import { supabase } from '../../lib/supabase';
import OtpVerificationScreen from './OtpVerificationScreen';

// Manage automatic token refreshing based on app state
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});

type AuthTab = 'login' | 'register';

const ASSETS = {
    background:
        'https://www.figma.com/api/mcp/asset/320eb0a8-8dec-4b42-afb2-4d9554882dbd',
    mascot:
        'https://www.figma.com/api/mcp/asset/44639b1b-a95d-43b4-a76a-a23fe54c1843',
    texture: Asset.fromModule(require('../../../assets/AuthAssets/texture.svg')).uri,
};

export default function AuthScreen() {
    const { width, height } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<AuthTab>('login');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Email Validation Logic
    const trimmedEmail = email.trim();
    
    // Relaxed Regex to allow standard @cit.edu formats
    const isExactCit = (emailText: string) => {
        const citRegex = /^[a-zA-Z0-9._-]+@cit\.edu$/;
        return citRegex.test(emailText);
    };
    const isGmail = (emailText: string) => {
        const gmailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
        return gmailRegex.test(emailText);
    };

    const isValidEmail = isExactCit(trimmedEmail) || isGmail(trimmedEmail);
    const showEmailError = trimmedEmail.length > 0 && !isValidEmail;

    // ── OTP screen: hand off entirely to OtpVerificationScreen ───────────────
    if (isVerifying) {
        return (
            <OtpVerificationScreen
                email={trimmedEmail}
                onVerified={() => {
                    setIsVerifying(false);
                    setActiveTab('login');
                    setPassword('');
                    setConfirmPassword('');
                    Alert.alert('Success', 'Email verified successfully! You can now log in.');
                }}
                onBack={() => setIsVerifying(false)}
            />
        );
    }

    // Supabase Authentication Functions
    async function handleAuth() {
        if (!isValidEmail) {
            Alert.alert('Invalid Email', 'Please use a valid @cit.edu or @gmail.com account.');
            return;
        }

        if (activeTab === 'register' && password !== confirmPassword) {
            Alert.alert('Passwords Mismatch', 'Your passwords do not match. Please try again.');
            return;
        }

        setLoading(true);

        if (activeTab === 'login') {
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: password,
            });

            if (error) Alert.alert('Login Failed', error.message);
        } else {
            if (isGmail(trimmedEmail)) {
                // Gmail: standard signUp, no OTP needed (auto-verified by your DB trigger)
                const { error } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: password,
                });

                if (error) {
                    Alert.alert('Registration Failed', error.message);
                    setLoading(false);
                    return;
                }

                Alert.alert('Registration Successful', 'Your account has been created. Please log in.');
                setActiveTab('login');
                setPassword('');
                setConfirmPassword('');
            } else if (isExactCit(trimmedEmail)) {
                // CIT: ONLY call signUp. Supabase handles sending the initial OTP automatically.
                const { error: signUpError } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: password,
                });

                if (signUpError) {
                    Alert.alert('Registration Failed', signUpError.message);
                    setLoading(false);
                    return;
                }

                // Proceed directly to the verification screen
                setIsVerifying(true);
            }
        }

        setLoading(false);
    }

    return (
        <View style={styles.root}>
            <StatusBar style="light" />

            <ImageBackground
                source={{ uri: ASSETS.background }}
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(26, 26, 31, 0.82)', 'rgba(26, 26, 31, 0.95)']}
                    style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                />
                <View pointerEvents="none" style={styles.textureOverlay}>
                    <SvgUri
                        width={width}
                        height={height}
                        preserveAspectRatio="xMidYMid slice"
                        uri={ASSETS.texture}
                    />
                </View>

                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.heroBlock}>
                            <Image source={{ uri: ASSETS.mascot }} style={styles.mascot} />
                            <Text style={styles.logo}>LYNK</Text>
                            <Text style={styles.tagline}>Let Your Network Know</Text>
                        </View>

                        {/* ── Tab Switcher ── */}
                        <View style={styles.switcherContainer}>
                            <View style={styles.switcher}>
                                <Pressable
                                    onPress={() => setActiveTab('login')}
                                    style={[
                                        styles.switchTab,
                                        activeTab === 'login' && styles.switchTabActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.switchTabText,
                                            activeTab === 'login' && styles.switchTabTextActive,
                                        ]}
                                    >
                                        Log In
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => setActiveTab('register')}
                                    style={[
                                        styles.switchTab,
                                        activeTab === 'register' && styles.switchTabActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.switchTabText,
                                            activeTab === 'register' && styles.switchTabTextActive,
                                        ]}
                                    >
                                        Register
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* ── Form ── */}
                        <View style={styles.formBlock}>
                            <View style={styles.fieldBlock}>
                                <View
                                    style={[
                                        styles.inputShell,
                                        showEmailError && styles.inputShellError,
                                    ]}
                                >
                                    <Ionicons
                                        name="mail"
                                        size={17}
                                        color={showEmailError ? COLORS.error : COLORS.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="email@cit.edu or @gmail.com"
                                        placeholderTextColor={COLORS.textSecondary}
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                    {showEmailError && (
                                        <Ionicons name="close-circle" size={18} color={COLORS.error} />
                                    )}
                                </View>

                                {showEmailError && (
                                    <View style={styles.errorRow}>
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={13}
                                            color={COLORS.error}
                                        />
                                        <Text style={styles.errorText}>
                                            Must be @cit.edu or @gmail.com
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputShell}>
                                <Ionicons
                                    name="lock-closed"
                                    size={17}
                                    color={COLORS.textSecondary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    autoCapitalize="none"
                                    placeholder="Password"
                                    placeholderTextColor={COLORS.textSecondary}
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                                    <Ionicons
                                        name={showPassword ? 'eye' : 'eye-off'}
                                        size={18}
                                        color={COLORS.textSecondary}
                                    />
                                </Pressable>
                            </View>

                            {activeTab === 'register' && (
                                <View style={styles.inputShell}>
                                    <Ionicons
                                        name="lock-closed"
                                        size={17}
                                        color={COLORS.textSecondary}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        autoCapitalize="none"
                                        placeholder="Confirm Password"
                                        placeholderTextColor={COLORS.textSecondary}
                                        secureTextEntry={!showConfirmPassword}
                                        style={styles.input}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                    <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)}>
                                        <Ionicons
                                            name={showConfirmPassword ? 'eye' : 'eye-off'}
                                            size={18}
                                            color={COLORS.textSecondary}
                                        />
                                    </Pressable>
                                </View>
                            )}

                            {activeTab === 'login' && (
                                <Pressable style={styles.forgotWrap}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* ── CTA ── */}
                        <View style={styles.ctaBlock}>
                            <Pressable
                                style={styles.loginButton}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.bg} />
                                ) : (
                                    <Text style={styles.loginButtonText}>
                                        {activeTab === 'login' ? 'Log In' : 'Create Account'}
                                    </Text>
                                )}
                            </Pressable>

                            {activeTab === 'register' && (
                                <Text style={styles.termsText}>
                                    By registering, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
}