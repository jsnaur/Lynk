import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import TextureSvg from '../../../assets/AuthAssets/texture.svg';
import {
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import appSoundManager, { AppSoundCategory } from '../../lib/SoundManager';
import { Button, InlineCtaButton } from '../../components/buttons';
import { AuthTab } from '../../components/inputs';
import { useCustomAlert } from '../../contexts/AlertContext';

type AuthMode = 'Left' | 'Right';

const ASSETS = {
    background:
        'https://www.figma.com/api/mcp/asset/320eb0a8-8dec-4b42-afb2-4d9554882dbd',
};

const TERMS_AND_PRIVACY_TEXT = `
LAST UPDATED: May 8, 2026

1. ACCEPTANCE OF TERMS AND BINDING AGREEMENT
1.1. THIS DOCUMENT CONSTITUTES A LEGALLY BINDING AGREEMENT (HEREINAFTER REFERRED TO AS THE "AGREEMENT") BETWEEN YOU (HEREINAFTER REFERRED TO AS THE "USER", "YOU", OR "YOUR") AND THE DEVELOPERS, ADMINISTRATORS, AND LEGAL ENTITIES OPERATING UNDER THE MONIKER OF "LYNK" (HEREINAFTER REFERRED TO AS "THE COMPANY," "WE," "US," OR "OUR"). BY DOWNLOADING, INSTALLING, ACCESSING, REGISTERING FOR, OR OTHERWISE UTILIZING THE LYNK MOBILE APPLICATION, INCLUDING BUT NOT LIMITED TO ANY ASSOCIATED WEB SERVICES, DATABASES, APPLICATION PROGRAMMING INTERFACES (APIs), DYNAMIC FEEDS, OR IN-APP PURCHASING INFRASTRUCTURES (COLLECTIVELY REFERRED TO AS THE "PLATFORM" OR "SERVICES"), YOU EXPLICITLY, IRREVOCABLY, AND UNCONDITIONALLY AGREE TO BE BOUND BY ALL STIPULATIONS, CLAUSES, CONDITIONS, AND PROVISIONS SET FORTH IN THIS COMPREHENSIVE DOCUMENT.
1.2. IF YOU DO NOT AGREE TO THESE TERMS IN THEIR ENTIRETY, YOU ARE STRICTLY PROHIBITED FROM ACCESSING OR USING THE SERVICES AND MUST IMMEDIATELY UNINSTALL THE APPLICATION AND CEASE ALL ENGAGEMENT WITH THE PLATFORM.
1.3. We reserve the unequivocal right, at our sole and absolute discretion, to modify, amend, alter, append, or otherwise update these Terms at any given time, without prior formalized notice, notwithstanding your ongoing use of the Platform. Your continued use of the Platform subsequent to the posting of any modifications constitutes an affirmative acknowledgment and legally binding acceptance of said modifications. It remains your exclusive responsibility to periodically, persistently, and rigorously review these Terms for any such alterations.

2. ELIGIBILITY, REGISTRATION, AND ACCOUNT AUTHENTICATION
2.1. The Platform is engineered, designed, and exclusively intended for the active, enrolled student body of the Cebu Institute of Technology - University (CIT - U).
2.2. In order to initiate the registration protocol and subsequently access the Platform, you must possess, control, and seamlessly authenticate a valid, officially issued institutional email address containing the precise domain suffix "@cit.edu".
2.3. The utilization of alias addresses, forwarding services, compromised credentials, or third-party authentication circumvention methods to simulate possession of a valid @cit.edu address constitutes a material breach of this Agreement and will result in instantaneous, permanent, and irrevocable account termination, alongside potential notification to relevant academic or disciplinary authorities.
2.4. You are solely, comprehensively, and undeniably responsible for maintaining the absolute confidentiality of your login credentials, password schemas, biometric access protocols, and any other security mechanisms associated with your LYNK account.

3. VIRTUAL ECONOMY, REWARDS, AND IN-APP SHOP MECHANICS
3.1. The Platform facilitates an interactive environment wherein Users may engage in "Quests" (comprising both digital interactions and geographically validated real-world challenges within or surrounding the campus) to earn virtual badges, digital accolades, avatars, and specific in-app currencies or reward points (collectively, "Virtual Assets").
3.2. YOU HEREBY ACKNOWLEDGE AND AGREE THAT VIRTUAL ASSETS HOLD ABSOLUTELY NO REAL-WORLD MONETARY VALUE, FIAT CURRENCY EQUIVALENCY, OR TANGIBLE PROPERTY RIGHTS.
3.3. Virtual Assets are merely a limited, non-transferable, non-sublicensable, revocable license granted by Us for the sole purpose of interacting within the Platform's isolated ecosystem. You may not sell, trade, broker, transfer, or attempt to convert Virtual Assets into actual currency or goods outside of the explicit confines of the LYNK in-app shop.
3.4. We reserve the absolute right to manage, regulate, control, modify, dilute, or eliminate Virtual Assets and the corresponding in-app shop inventory at any time, for any reason, without liability to you or any third party.

4. DYNAMIC FEED AND USER-GENERATED CONTENT EXCHANGES
4.1. The Platform includes a social interaction module (the "Dynamic Feed") enabling Users to post, transmit, display, and disseminate textual, visual, or contextual data (collectively, "User Content").
4.2. By submitting User Content, you grant Us a perpetual, irrevocable, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the User Content in connection with the operation, promotion, and algorithmic optimization of the Platform.
4.3. You are strictly forbidden from utilizing the Dynamic Feed to transmit content that is defamatory, libelous, harassing, discriminatory, sexually explicit, infringing upon third-party intellectual property, mathematically or structurally malicious (including SQL injections or executable scripts), or otherwise contrary to the localized community standards of the institution.

5. LIMITATION OF LIABILITY AND INDEMNIFICATION
5.1. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY, ITS DEVELOPERS, AFFILIATES, LICENSORS, OR AGENTS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES (EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), RESULTING FROM: (I) THE USE OR THE INABILITY TO USE THE SERVICE; (II) THE COST OF PROCUREMENT OF SUBSTITUTE GOODS AND SERVICES RESULTING FROM ANY GOODS, DATA, INFORMATION, OR SERVICES PURCHASED OR OBTAINED; (III) UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA; (IV) PHYSICAL INJURY, TORTS, OR DAMAGES INCURRED WHILE PARTICIPATING IN REAL-WORLD CAMPUS QUESTS; OR (V) ANY OTHER MATTER RELATING TO THE SERVICE.
5.2. You agree to unconditionally indemnify, defend, and hold harmless the Company and its associated developers against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Platform or your violation of these Terms.

COMPREHENSIVE PRIVACY POLICY AND DATA GOVERNANCE DIRECTIVE

1. INTRODUCTION AND SCOPE OF DATA HARVESTING
1.1. This Privacy Policy delineates the extensive, multi-layered, and exhaustive methodologies by which we collect, parse, store, manipulate, disseminate, and protect the personally identifiable information (PII) and non-personally identifiable information (Non-PII) of Users navigating the LYNK ecosystem.
1.2. The fundamental premise of the LYNK application—which bridges digital socialization with geolocation-based physical campus quests—necessitates a robust, pervasive, and persistent data collection architecture. By utilizing the Platform, you furnish your explicit, uncoerced, and continuous consent to the data practices described herein.

2. TYPOLOGY OF DATA COLLECTED
2.1. Directly Submitted Telemetry: When you instantiate an account, we irrevocably collect your institutional email address (@cit.edu), your chosen alphanumeric username, encrypted cryptographic representations of your password, and any granular profile customizations you execute, including but not limited to avatar structural parameters, biographical text strings, and user-selected visual themes.
2.2. Automated Subcutaneous Data Extraction: Upon launching the LYNK application, our backend infrastructure automatically and silently harvests a myriad of device-specific datapoints. This includes, without limitation: operating system taxonomy (e.g., Android, iOS), hardware device identifiers (MAC addresses, IMEI, UUIDs), IP addresses, network gateway data, packet transmission latency metrics, memory allocation statistics, and background application execution states.
2.3. Geospatial and Chronological Tracking: Given the intrinsic nature of the real-world questing paradigm, LYNK relies heavily on persistent geolocation tracking. We collect continuous GPS coordinates, Wi-Fi triangulation data, Bluetooth Low Energy (BLE) beacon proximity logs, and cellular tower handover metrics to verify your physical presence at designated campus waypoints. This tracking may occur even when the application is operating in a minimized or background state.
2.4. Behavioral and Interaction Analytics: We systematically log every screen tap, swipe gesture, scroll velocity, session duration, feed interaction (likes, comments, read-time), and shop transaction. This data is fed into proprietary heuristic models to analyze user engagement patterns and optimize the psychological reward loops associated with the questing mechanics.

3. UTILIZATION OF ACCUMULATED ASSETS
3.1. The data amassed through the aforementioned channels is deployed for a multitude of operational and strategic imperatives, including:
(a) The seamless facilitation and verification of your @cit.edu eligibility.
(b) The algorithmic adjudication of your success or failure in completing geographically bound quests.
(c) The dynamic rendering of the social feed, tailored via machine learning algorithms to maximize your localized engagement.
(d) The enforcement of security protocols, including anomaly detection to prevent GPS spoofing, automated macro execution, or unauthorized account access.
(e) The generation of aggregated, anonymized statistical models regarding student movement patterns and high-density campus interaction zones.

4. DISSEMINATION, SYNDICATION, AND THIRD-PARTY EXPOSURE
4.1. While we do not conventionally sell your raw PII to indiscriminate data brokers, we explicitly reserve the right to share your data within the scope of our operational matrix.
4.2. We may transmit your data to third-party cloud infrastructure providers, database hosting solutions, and analytics subprocessors required to maintain the functional integrity of the Platform.
4.3. We may disclose your data if legally compelled to do so by a subpoena, court order, or formal request from academic or judicial authorities, or if we, in our sole discretion, determine that such disclosure is strictly necessary to protect the physical safety, intellectual property, or legal rights of the Company, the university, or other Users.

5. RETENTION CHRONOLOGY AND DATA DECAY
5.1. Your data is retained within our decentralized ledger and server architecture for as long as your account remains active and for a commercially reasonable, theoretically indefinite period thereafter to comply with data backup, archival, and longitudinal auditing requirements.
5.2. Even upon the formal request for account deletion, residual fragments of your User Content, historical quest logs, and anonymized interaction metrics may persist irreversibly within our aggregated datasets, completely severed from your specific @cit.edu identifier but forever woven into the historical fabric of the Platform's analytics engine.

6. JURISDICTION AND DISPUTE RESOLUTION
6.1. These Terms and Privacy Directives shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without giving effect to any principles of conflicts of law.
6.2. Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or invalidity thereof, shall be settled by obligatory, binding, and confidential arbitration occurring within the territorial jurisdiction of Cebu City, Philippines. You explicitly waive any right to participate in a class-action lawsuit or class-wide arbitration against the developers of LYNK.`;

/**
 * Standardized icon-only button that handles sound feedback and provides consistent behavior.
 * Used for small interactive icons like password visibility toggles.
 */
interface IconButtonProps {
  iconName: any;
  size: number;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

function IconButton({ iconName, size, color, onPress, disabled = false }: IconButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    void appSoundManager.play(AppSoundCategory.UIClicks);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Ionicons name={iconName} size={size} color={color} />
    </Pressable>
  );
}

type Props = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
    const { width, height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const { alert } = useCustomAlert();
    const [activeTab, setActiveTab] = useState<'Left' | 'Right'>('Left');
    const [switcherWidth, setSwitcherWidth] = useState(0);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    // Only reveal "Forgot password?" after a failed login due to wrong credentials
    const [showForgotLink, setShowForgotLink] = useState(false);

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

    // Real-time Form Validation
    const isPasswordValid = password.length >= 6; // Supabase defaults to min 6 chars
    const doPasswordsMatch = activeTab === 'Left' || password === confirmPassword;
    const isFormReady = isValidEmail && isPasswordValid && doPasswordsMatch;

    // ── OTP screen: hand off entirely to OtpVerificationScreen ───────────────
    if (isVerifying) {
        return (
            <OtpVerificationScreen
                email={trimmedEmail}
                onVerified={() => {
                    setIsVerifying(false);
                    setActiveTab('Left'); // Reset background tab state
                    setPassword('');
                    setConfirmPassword('');
                    // AppNavigator handles auto-routing to ProfileSetup.
                }}
                onBack={() => setIsVerifying(false)}
            />
        );
    }

    // Supabase Authentication Functions
    async function handleAuth() {
        if (!isFormReady) return;

        setLoading(true);

        if (activeTab === 'Left') {
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: password,
            });

            if (error) {
                void appSoundManager.playAuthErrorBuzz();
                Alert.alert('Login Failed', error.message);
                // Supabase returns "Invalid login credentials" for wrong email OR wrong password.
                // Reveal the Forgot password? link so the user can recover if it was the password.
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('invalid') && msg.includes('credentials')) {
                    setShowForgotLink(true);
                }
            } else {
                void appSoundManager.playAuthSuccessChime();
            }
        } else {
            if (isGmail(trimmedEmail)) {
                // Gmail: standard signUp, no OTP needed
                const { error } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: password,
                });

                if (error) {
                    Alert.alert('Registration Failed', error.message);
                    setLoading(false);
                    return;
                }

                setActiveTab('Left'); // Reset background tab state
                setPassword('');
                setConfirmPassword('');
                // AppNavigator handles auto-routing to ProfileSetup.

            } else if (isExactCit(trimmedEmail)) {
                // CIT: Proceed to OTP Verification
                const { error: signUpError } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: password,
                });

                if (signUpError) {
                    Alert.alert('Registration Failed', signUpError.message);
                    setLoading(false);
                    return;
                }

                setIsVerifying(true);
            }
        }

        setLoading(false);
    }

    const handleTabChange = (tab: 'Left' | 'Right') => {
        setActiveTab(tab);
        setShowForgotLink(false);
        // Clear form fields when switching tabs for better UX
        setPassword('');
        setConfirmPassword('');
    };

    const openTermsAndPrivacyPolicy = () => {
        alert(
            'TERMS OF SERVICE AND END USER LICENSE AGREEMENT FOR LYNK',
            undefined,
            undefined,
            <ScrollView
                style={{ width: '100%', maxHeight: 420 }}
                contentContainerStyle={{ paddingRight: 4 }}
                showsVerticalScrollIndicator
            >
                <Text
                    style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        lineHeight: 18,
                    }}
                >
                    {TERMS_AND_PRIVACY_TEXT}
                </Text>
            </ScrollView>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
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
                        <TextureSvg
                            width={width}
                            height={height}
                            preserveAspectRatio="xMidYMid slice"
                        />
                    </View>
                    <SafeAreaView style={styles.safeArea}>
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.heroBlock}>
                                <Image source={require('../../../assets/logowithoutbg.png')} style={styles.mascot} />
                                <Text style={styles.logo}>LYNK</Text>
                                <Text style={styles.tagline}>Let Your Network Know</Text>
                            </View>

                            {/* ── Tab Switcher ── */}
                            <View
                                style={styles.switcherContainer}
                                onLayout={(event) => setSwitcherWidth(event.nativeEvent.layout.width)}
                            >
                                <AuthTab
                                    activeTab={activeTab}
                                    leftLabel="Log In"
                                    rightLabel="Register"
                                    onTabChange={handleTabChange}
                                    style={{ width: switcherWidth > 0 ? Math.min(switcherWidth, 326) : 326 }}
                                />
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
                                            onChangeText={(val) => {
                                                setEmail(val);
                                                if (showForgotLink) setShowForgotLink(false);
                                            }}
                                            onFocus={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
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
                                        onChangeText={(val) => {
                                            setPassword(val);
                                            if (showForgotLink) setShowForgotLink(false);
                                        }}
                                        onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                                    />
                                    <IconButton
                                        iconName={showPassword ? 'eye' : 'eye-off'}
                                        size={18}
                                        color={COLORS.textSecondary}
                                        onPress={() => setShowPassword((prev) => !prev)}
                                    />
                                </View>

                                {activeTab === 'Right' && (
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
                                            onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                                        />
                                        <IconButton
                                            iconName={showConfirmPassword ? 'eye' : 'eye-off'}
                                            size={18}
                                            color={COLORS.textSecondary}
                                            onPress={() => setShowConfirmPassword((prev) => !prev)}
                                        />
                                    </View>
                                )}

                                {activeTab === 'Left' && showForgotLink && (
                                    <InlineCtaButton
                                        state="Active"
                                        label="Forgot password?"
                                        onPress={() => {
                                            setPassword('');
                                            setConfirmPassword('');
                                            navigation.navigate('ForgotPass1');
                                        }}
                                    />
                                )}
                            </View>

                            {/* ── CTA ── */}
                            <View style={styles.ctaBlock}>
                                <Button
                                    label={activeTab === 'Left' ? 'Log In' : 'Create Account'}
                                    onPress={handleAuth}
                                    disabled={!isFormReady || loading}
                                    loading={loading}
                                    style={{ minHeight: 52, borderRadius: 14 }}
                                />

                                {activeTab === 'Right' && (
                                    <Text style={styles.termsText}>
                                        By registering, you agree to our{' '}
                                        <Text
                                            onPress={openTermsAndPrivacyPolicy}
                                            style={styles.termsLink}
                                        >
                                            Terms & Privacy Policy
                                        </Text>
                                    </Text>
                                )}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </ImageBackground>
            </View>
        </KeyboardAvoidingView>
    );
}