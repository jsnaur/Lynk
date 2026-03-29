import { StyleSheet } from 'react-native';

export const COLORS = {
	bg: '#1A1A1F',
	textPrimary: '#F0F0F5',
	textSecondary: '#8A8A9A',
	surface: '#26262E',
	surface2: '#31313C',
	border: '#3A3A48',
	accent: '#00F5FF',
	accentText: '#0E1013',
	error: '#FF4D6D',
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
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		overflow: 'hidden',
		opacity: 0.05,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		alignItems: 'center',
		paddingTop: 56,
		paddingBottom: 36,
		paddingHorizontal: 32,
	},
	heroBlock: {
		alignItems: 'center',
		gap: 12,
		marginBottom: 20,
	},
	mascot: {
		width: 80,
		height: 88,
	},
	logo: {
		color: COLORS.textPrimary,
		fontSize: 42,
		fontWeight: '800',
		letterSpacing: 8,
		lineHeight: 44,
	},
	tagline: {
		color: COLORS.textSecondary,
		fontSize: 15,
		fontWeight: '400',
	},
	switcherContainer: {
		width: '100%',
		maxWidth: 326,
		marginBottom: 24,
	},
	switcher: {
		height: 44,
		borderRadius: 12,
		backgroundColor: COLORS.surface,
		padding: 4,
		flexDirection: 'row',
		gap: 4,
	},
	switchTab: {
		flex: 1,
		borderRadius: 9,
		justifyContent: 'center',
		alignItems: 'center',
	},
	switchTabActive: {
		backgroundColor: COLORS.surface2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 7,
		elevation: 3,
	},
	switchTabText: {
		color: COLORS.textSecondary,
		fontSize: 15,
		fontWeight: '400',
	},
	switchTabTextActive: {
		color: COLORS.textPrimary,
		fontWeight: '600',
	},
	formBlock: {
		width: '100%',
		maxWidth: 326,
		gap: 14,
		marginBottom: 20,
	},
	fieldBlock: {
		gap: 6,
	},
	inputShell: {
		minHeight: 52,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	inputShellError: {
		borderColor: COLORS.error,
	},
	inputIcon: {
		marginTop: 1,
	},
	input: {
		flex: 1,
		color: COLORS.textPrimary,
		fontSize: 15,
		paddingVertical: 12,
	},
	forgotWrap: {
		alignSelf: 'flex-end',
		paddingHorizontal: 2,
		paddingTop: 2,
	},
	forgotText: {
		color: COLORS.accent,
		fontSize: 13,
		fontWeight: '400',
	},
	ctaBlock: {
		width: '100%',
		maxWidth: 326,
		gap: 16,
	},
	loginButton: {
		minHeight: 52,
		borderRadius: 14,
		backgroundColor: COLORS.accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loginButtonText: {
		color: COLORS.accentText,
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.2,
	},
	termsText: {
		color: COLORS.textPrimary,
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
		opacity: 0.9,
	},
	termsLink: {
		color: COLORS.accent,
		fontSize: 12,
		lineHeight: 18,
	},
	errorRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 2,
	},
	errorText: {
		color: COLORS.error,
		fontSize: 12,
		lineHeight: 16,
	},
});
