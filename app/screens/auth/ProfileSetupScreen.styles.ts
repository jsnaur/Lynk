import { StyleSheet } from "react-native";

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
		fontFamily: "DMSans-Regular",
		color: "#8a8a9a"
	},
	screenTitleTypo: {
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		color: "#f0f0f5"
	},
	hintTitleTypo: {
		fontWeight: "600",
		fontFamily: "DMSans-Bold"
	},
	fieldLayout: {
		minHeight: 52,
		paddingVertical: 0,
		paddingHorizontal: 16,
		borderRadius: 14,
		width: 326,
		borderWidth: 1,
		borderColor: "#3a3a48",
		borderStyle: "solid",
		backgroundColor: "#26262e",
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
		backgroundColor: "#1a1a1f"
	},
	setupProgressHeader: {
		paddingTop: 32,
		paddingBottom: 20
	},
	progressBarTrack: {
		borderRadius: 2,
		backgroundColor: "#31313c",
		flexDirection: "row",
		alignSelf: "stretch",
		alignItems: "center",
		overflow: "hidden"
	},
	progressBarFill: {
		height: 4,
		width: 100,
		borderRadius: 4,
		backgroundColor: "#00f5ff",
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
		color: "#8a8a9a",
		fontSize: 12,
		fontFamily: "DMSans-Regular"
	},
	screenTitle: {
		fontSize: 24,
		color: "#f0f0f5",
		textAlign: "center"
	},
	screenSubtitle: {
		fontSize: 14,
		textAlign: "center",
		color: "#8a8a9a",
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
		color: "#8a8a9a"
	},
	inputField: {
		fontSize: 15,
		textAlign: "left",
		flex: 1,
		color: "#8a8a9a"
	},
	textInput: {
		fontSize: 15,
		textAlign: "left",
		flex: 1,
		color: "#f0f0f5",
		fontFamily: "DMSans-Regular"
	},
	dropdownSelectField: {
		gap: 10
	},
	dropdownWrapper: {
		width: 326,
		alignSelf: "center",
		position: "relative",
		overflow: "visible"
	},
	dropdownWrapperOnTop: {
		zIndex: 120
	},
	dropdownValue: {
		flex: 1,
		color: "#f0f0f5",
		fontSize: 15,
		textAlign: "left",
		fontFamily: "DMSans-Regular"
	},
	placeholderText: {
		color: "#8a8a9a"
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
		top: 52,
		left: 0,
		borderWidth: 1,
		borderTopWidth: 0,
		borderColor: "#3a3a48",
		backgroundColor: "#31313c",
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		overflow: "hidden",
		zIndex: 120,
		elevation: 8,
		width: 326
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
		backgroundColor: "rgba(240, 240, 245, 0.08)"
	},
	dropdownList: {
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#3a3a48",
		backgroundColor: "#26262e",
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
		backgroundColor: "rgba(0, 245, 255, 0.08)"
	},
	dropdownOptionText: {
		color: "#f0f0f5",
		fontSize: 15,
		fontFamily: "DMSans-Regular"
	},
	yearSelectFieldOpen: {
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		borderBottomWidth: 0
	},
	yearDropdownList: {
		position: "absolute",
		top: 52,
		left: 0,
		borderWidth: 1,
		borderTopWidth: 0,
		borderColor: "#3a3a48",
		backgroundColor: "#31313c",
		borderBottomLeftRadius: 14,
		borderBottomRightRadius: 14,
		overflow: "hidden",
		zIndex: 120,
		elevation: 8,
		width: 326
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
		backgroundColor: "rgba(240, 240, 245, 0.08)"
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
		backgroundColor: "#3a3a48",
		flex: 1,
		overflow: "hidden"
	},
	dividerLabel: {
		fontSize: 8,
		fontFamily: "PressStart2P-Regular",
		textAlign: "center",
		color: "#8a8a9a"
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
		borderColor: "#3a3a48",
		backgroundColor: "#26262e",
		alignItems: "center",
		justifyContent: "center"
	},
	hintTitle: {
		textAlign: "left",
		fontSize: 14,
		color: "#f0f0f5"
	},
	hintBody: {
		textAlign: "left",
		color: "#8a8a9a",
		fontSize: 12,
		fontFamily: "DMSans-Regular"
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
		borderColor: "#3a3a48",
		backgroundColor: "#26262e",
		width: 72,
		height: 72,
		alignItems: "center",
		justifyContent: "center"
	},
	avatarPressed: {
		opacity: 0.88
	},
	avatarGridItem8: {
		backgroundColor: "rgba(0, 245, 255, 0.1)",
		borderColor: "#00f5ff",
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
		paddingBottom: 48,
		paddingHorizontal: 24
	},
	ctaButton: {
		borderWidth: 1,
		borderColor: "#3a3a48",
		borderStyle: "solid",
		height: 52
	},
	buttonLabel: {
		marginLeft: -15,
		fontWeight: "500",
		fontFamily: "DMSans-Medium",
		color: "#8a8a9a"
	},
	ctaButton2: {
		backgroundColor: "#8a8a9a"
	},
	ctaPressed: {
		opacity: 0.75
	},
	ctaPressedPrimary: {
		opacity: 0.88
	},
	buttonLabel2: {
		marginLeft: -43,
		color: "#f0f0f5",
		fontFamily: "DMSans-Bold",
		fontWeight: "700"
	}
});