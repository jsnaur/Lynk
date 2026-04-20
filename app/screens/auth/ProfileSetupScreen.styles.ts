import { StyleSheet } from "react-native";
import { COLORS, withOpacity } from "../../constants/colors";
import { FONTS } from "../../constants/fonts";

export const styles = StyleSheet.create({
	utilityInfoFormFlexBox: {
		alignItems: "center",
		overflow: "visible"
	},
	setupProgressHeaderFlexBox: {
		gap: 16,
		paddingHorizontal: 24,
		alignSelf: "stretch",
		alignItems: "center",
		overflow: "hidden"
	},
	textCommon: {
		gap: 4,
		overflow: "hidden"
	},
	hintBodyTypo: {
		fontFamily: FONTS.body,
		color: COLORS.textSecondary
	},
	screenTitleTypo: {
		fontFamily: FONTS.body,
		fontWeight: "700",
		color: COLORS.textPrimary
	},
	hintTitleTypo: {
		fontWeight: "600",
		fontFamily: FONTS.body
	},
	fieldLayout: {
		minHeight: 52,
		paddingVertical: 0,
		paddingHorizontal: 16,
		borderRadius: 14,
		width: "100%",
		borderWidth: 1,
		borderColor: COLORS.border,
		borderStyle: "solid",
		backgroundColor: COLORS.surface,
		flexDirection: "row",
		alignItems: "center",
		overflow: "hidden"
	},
	setupCtaBarFlexBox: {
		gap: 12,
		justifyContent: "center",
		flexDirection: "row",
		alignSelf: "stretch",
		alignItems: "center",
		overflow: "hidden"
	},
	avatarItemLayout: {
		width: 72,
		height: 72,
		borderStyle: "solid",
		borderRadius: 14
	},
	spriteIconPosition: {
		height: 48,
		width: 48,
		marginLeft: -24,
		marginTop: -24,
		left: "50%",
		top: "50%",
		position: "absolute"
	},
	ctaLayout: {
		height: 52,
		flex: 1,
		borderRadius: 14,
		overflow: "hidden"
	},
	buttonPosition: {
		fontSize: 16,
		marginTop: -11,
		left: "50%",
		top: "50%",
		position: "absolute",
		textAlign: "center"
	},
	profileSetupScreen: {
		width: "100%",
		height: 844,
		backgroundColor: COLORS.bg
	},
	setupProgressHeader: {
		paddingTop: 20,
		paddingBottom: 20
	},
	progressBarTrack: {
		borderRadius: 2,
		backgroundColor: COLORS.surface2,
		flexDirection: "row",
		alignSelf: "stretch",
		alignItems: "center",
		overflow: "hidden"
	},
	progressBarFill: {
		height: 4,
		width: 100,
		borderRadius: 4,
		backgroundColor: COLORS.favor,
		overflow: "hidden"
	},
	headerTextBlock: {
		padding: 10,
		justifyContent: "center",
		gap: 4,
		alignSelf: "stretch",
		alignItems: "center"
	},
	stepLabel: {
		textAlign: "center",
		color: COLORS.textSecondary,
		fontSize: 12,
		fontFamily: FONTS.body
	},
	screenTitle: {
		fontSize: 24,
		color: COLORS.textPrimary,
		textAlign: "center"
	},
	screenSubtitle: {
		fontSize: 14,
		textAlign: "center",
		color: COLORS.textSecondary,
		alignSelf: "stretch"
	},
	utilityInfoForm: {
		paddingBottom: 24,
		gap: 14,
		paddingHorizontal: 24,
		alignSelf: "stretch",
		zIndex: 200
	},
	fieldGroupLabel: {
		fontSize: 13,
		letterSpacing: 1.5,
		textAlign: "center",
		color: COLORS.textSecondary
	},
	inputField: {
		fontSize: 15,
		textAlign: "left",
		flex: 1,
		color: COLORS.textSecondary
	},
	textInput: {
		fontSize: 15,
		textAlign: "left",
		flex: 1,
		color: COLORS.textPrimary,
		fontFamily: FONTS.body
	},
	dropdownSelectField: {
		gap: 10,
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	dropdownWrapper: {
		width: "100%",
		alignSelf: "stretch",
		position: "relative",
		overflow: "visible"
	},
	dropdownWrapperOnTop: {
		zIndex: 120
	},
	dropdownValue: {
		flex: 1,
		color: COLORS.textPrimary,
		fontSize: 15,
		textAlign: "left",
		fontFamily: FONTS.body,
		minHeight: 16,
		paddingVertical: 12
	},
	placeholderText: {
		color: COLORS.textSecondary
	},
	dropdownPressed: {
		opacity: 0.85
	},
	majorSelectFieldOpen: {
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		borderBottomWidth: 0
	},
	majorDropdownList: {
		position: "absolute",
		top: 51,
		left: 0,
		borderWidth: 1,
		borderTopWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface2,
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		overflow: "hidden",
		zIndex: 120,
		elevation: 8,
		width: "100%"
	},
	majorDropdownScroll: {
		maxHeight: 280
	},
	majorDropdownContent: {
		paddingVertical: 8
	},
	majorDropdownOption: {
		paddingVertical: 8,
		paddingHorizontal: 16
	},
	majorDropdownOptionPressed: {
		backgroundColor: withOpacity(COLORS.textPrimary, 0.08)
	},
	dropdownList: {
		marginTop: 8,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		borderRadius: 14,
		overflow: "hidden",
		zIndex: 50,
		width: 326
	},
	dropdownScroll: {
		maxHeight: 180
	},
	dropdownOption: {
		paddingVertical: 12,
		paddingHorizontal: 16
	},
	dropdownOptionPressed: {
		backgroundColor: withOpacity(COLORS.favor, 0.08)
	},
	dropdownOptionText: {
		color: COLORS.textPrimary,
		fontSize: 15,
		fontFamily: FONTS.body
	},
	yearSelectFieldOpen: {
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		borderBottomWidth: 0
	},
	yearDropdownList: {
		position: "absolute",
		top: 51,
		left: 0,
		borderWidth: 1,
		borderTopWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface2,
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		overflow: "hidden",
		zIndex: 120,
		elevation: 8,
		width: "100%"
	},
	yearDropdownScroll: {
		maxHeight: 280
	},
	yearDropdownContent: {
		paddingVertical: 8
	},
	yearDropdownOption: {
		paddingVertical: 8,
		paddingHorizontal: 16
	},
	yearDropdownOptionPressed: {
		backgroundColor: withOpacity(COLORS.textPrimary, 0.08)
	},
	chevronIcon: {
		width: 16,
		height: 16
	},
	avatarSelectionBlock: {
		paddingBottom: 32,
		zIndex: 1
	},
	dividerLineL: {
		height: 1,
		backgroundColor: COLORS.border,
		flex: 1,
		overflow: "hidden"
	},
	dividerLabel: {
		fontSize: 8,
		fontFamily: FONTS.display,
		textAlign: "center",
		color: COLORS.textSecondary
	},
	avatarPreviewRow: {
		borderRadius: 16
	},
	selectedAvatarFrameIcon: {
		height: 80,
		width: 80,
		minWidth: 80,
		minHeight: 80,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		alignItems: "center",
		justifyContent: "center"
	},
	hintTitle: {
		textAlign: "left",
		fontSize: 14,
		color: COLORS.textPrimary
	},
	hintBody: {
		textAlign: "left",
		color: COLORS.textSecondary,
		fontSize: 12,
		fontFamily: FONTS.body
	},
	avatarGrid: {
		width: 324,
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: 12,
		overflow: "hidden"
	},
	avatarGridItem: {
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		width: 72,
		height: 72,
		alignItems: "center",
		justifyContent: "center"
	},
	avatarPressed: {
		opacity: 0.88
	},
	avatarGridItem8: {
		backgroundColor: withOpacity(COLORS.favor, 0.1),
		borderColor: COLORS.favor,
		borderWidth: 2
	},
	selectionCheckBadgeIcon: {
		top: 4,
		right: 4,
		width: 12,
		height: 12,
		alignItems: "center",
		justifyContent: "center",
		position: "absolute"
	},
	setupCtaBar: {
		paddingTop: 16,
		paddingBottom: 16,
		paddingHorizontal: 24
	},
	ctaButton: {
		borderWidth: 1,
		borderColor: COLORS.border,
		borderStyle: "solid",
		height: 52
	},
	buttonLabel: {
		marginLeft: -15,
		fontWeight: "500",
		fontFamily: FONTS.body,
		color: COLORS.textSecondary
	},
	ctaButton2: {
		backgroundColor: COLORS.textSecondary
	},
	ctaPressed: {
		opacity: 0.75
	},
	ctaPressedPrimary: {
		opacity: 0.88
	},
	buttonLabel2: {
		marginLeft: -43,
		color: COLORS.textPrimary,
		fontFamily: FONTS.body,
		fontWeight: "700"
	}
});