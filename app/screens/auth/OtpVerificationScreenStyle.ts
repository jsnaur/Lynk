import { StyleSheet } from 'react-native';

export const COLORS = {
    bg:            '#1A1A1F',
    surface:       '#23232A',
    surfaceHigh:   '#2C2C35',
    accent:        '#00E5C8',
    accentDim:     'rgba(0,229,200,0.12)',
    text:          '#F0F0F5',
    textSecondary: '#7A7A8C',
    error:         '#FF4D6A',
    border:        '#35353F',
};

export const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    background: {
        flex: 1,
    },
    textureOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.35,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 24,
    },

    // ── Back button ────────────────────────────────────────────────────────────
    backBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        alignSelf: 'flex-start' as const,
        paddingVertical: 8,
        gap: 2,
    },
    backText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500' as const,
    },

    // ── Hero ───────────────────────────────────────────────────────────────────
    hero: {
        alignItems: 'center' as const,
        marginTop: 12,
        marginBottom: 28,
    },
    mascot: {
        width: 72,
        height: 72,
        resizeMode: 'contain' as const,
        marginBottom: 10,
    },
    logo: {
        fontSize: 30,
        fontWeight: '800' as const,
        color: COLORS.text,
        letterSpacing: 6,
    },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 28,
        gap: 20,
    },
    cardHeader: {
        alignItems: 'center' as const,
        gap: 10,
    },
    iconRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accentDim,
        borderWidth: 1,
        borderColor: COLORS.accent,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 4,
    },
    cardTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700' as const,
        letterSpacing: 0.3,
    },
    cardSub: {
        color: COLORS.textSecondary,
        fontSize: 13.5,
        textAlign: 'center' as const,
        lineHeight: 20,
    },
    emailHighlight: {
        color: COLORS.accent,
        fontWeight: '600' as const,
    },

    // ── OTP boxes ──────────────────────────────────────────────────────────────
    otpRow: {
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
        gap: 10,
    },
    otpBox: {
        width: 46,
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceHigh,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    otpBoxFilled: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accentDim,
    },
    otpInput: {
        width: '100%',
        height: '100%',
        textAlign: 'center' as const,
        fontSize: 22,
        fontWeight: '700' as const,
        color: COLORS.text,
    },

    // ── Confirm button ─────────────────────────────────────────────────────────
    confirmBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.accent,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    confirmBtnDisabled: {
        opacity: 0.45,
    },
    confirmBtnText: {
        color: COLORS.bg,
        fontSize: 16,
        fontWeight: '700' as const,
        letterSpacing: 0.3,
    },

    // ── Divider ────────────────────────────────────────────────────────────────
    divider: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },

    // ── Resend ─────────────────────────────────────────────────────────────────
    resendBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: 4,
    },
    resendText: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '600' as const,
    },
    resendTextDisabled: {
        color: COLORS.textSecondary,
    },

    // ── Bottom hint ────────────────────────────────────────────────────────────
    hint: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center' as const,
        marginTop: 20,
        lineHeight: 18,
        opacity: 0.7,
    },
});