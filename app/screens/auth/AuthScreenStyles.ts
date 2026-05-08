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
	error: '#FF4D4D',
	warning: '#FFA500',
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
		marginBottom: 24,
		alignItems: 'center',
	},
	formBlock: {
		width: '100%',
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
	ctaBlock: {
		width: '100%',
		gap: 16,
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
