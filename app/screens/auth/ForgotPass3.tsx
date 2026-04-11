import * as React from "react";
import {StyleSheet, Text, View, ScrollView, Image} from "react-native";

const PWRecoveryState3 = () => {
  	
  	return (
    		<View style={styles.pwRecoveryState3}>
      			<View style={styles.recoveryNavBar}>
        				<View style={styles.backButton}>
          					<Image style={styles.backIcon} resizeMode="cover" />
          					<Text style={styles.backLabel}>Back to Login</Text>
        				</View>
      			</View>
      			<ScrollView style={styles.recoveryContentBlocksetNew} contentContainerStyle={styles.setNewPasswordContainerContent}>
        				<Image style={styles.iconBlock} resizeMode="cover" />
        				<View style={[styles.textBlock, styles.textBlockFlexBox]}>
          					<Text style={[styles.recoveryTitle, styles.buttonLabelTypo]}>New Password</Text>
          					<Text style={styles.recoveryBody}>Create a strong password{'\n'}for your LYNK account.</Text>
        				</View>
        				<View style={[styles.tokenValidityBanner, styles.tokenBorder]}>
          					<Image style={styles.checkIcon} resizeMode="cover" />
          					<Text style={[styles.bannerText, styles.bannerTypo]}>Secure link verified — expires in 11:23</Text>
        				</View>
        				<View style={[styles.tokenValidityBannerExpired, styles.tokenBorder]}>
          					<Image style={styles.checkIcon} resizeMode="cover" />
          					<Text style={[styles.bannerText2, styles.bannerTypo]}>This link has expired.</Text>
          					<Text style={[styles.requestNewLink, styles.bannerTypo]}>Request a new one.</Text>
        				</View>
        				<View style={[styles.newPasswordInput, styles.ctaButtonLayout]}>
          					<Image style={styles.inputIcon} resizeMode="cover" />
          					<Text style={styles.inputField}>New password</Text>
          					<Image style={styles.inputIcon} resizeMode="cover" />
        				</View>
        				<View style={[styles.textBlock, styles.textBlockFlexBox]}>
          					<View style={[styles.strengthBarTrack, styles.strengthBarTrackFlexBox]}>
            						<View style={styles.strengthSegment} />
            						<View style={styles.strengthSegment} />
            						<View style={styles.strengthSegment} />
            						<View style={styles.strengthSegment} />
          					</View>
          					<View style={styles.strengthLabel}>
            						<Text style={[styles.strengthLabel2, styles.reqTypo]}>Weak</Text>
            						<Text style={[styles.strengthLabel2, styles.reqTypo]}>Fair</Text>
            						<Text style={[styles.strengthLabel2, styles.reqTypo]}>Good</Text>
            						<Text style={[styles.strengthLabel2, styles.reqTypo]}>Strong</Text>
          					</View>
        				</View>
        				<View style={styles.strengthBarTrackFlexBox}>
          					<View style={[styles.requirementRow, styles.textBlockFlexBox]}>
            						<Image style={styles.reqIconunmet} resizeMode="cover" />
            						<Text style={[styles.reqText, styles.reqTypo]}>At least 8 characters</Text>
          					</View>
          					<View style={[styles.requirementRow, styles.textBlockFlexBox]}>
            						<Image style={styles.reqIconunmet} resizeMode="cover" />
            						<Text style={[styles.reqText2, styles.reqTypo]}>One uppercase letter</Text>
          					</View>
          					<View style={[styles.requirementRow, styles.textBlockFlexBox]}>
            						<Image style={styles.reqIconunmet} resizeMode="cover" />
            						<Text style={[styles.reqText2, styles.reqTypo]}>One number</Text>
          					</View>
          					<View style={[styles.requirementRow, styles.textBlockFlexBox]}>
            						<Image style={styles.reqIconunmet} resizeMode="cover" />
            						<Text style={[styles.reqText, styles.reqTypo]}>One special character</Text>
          					</View>
        				</View>
        				<View style={[styles.newPasswordInput, styles.ctaButtonLayout]}>
          					<Image style={styles.inputIcon} resizeMode="cover" />
          					<Text style={styles.inputField}>Confirm new password</Text>
          					<Image style={styles.inputIcon} resizeMode="cover" />
        				</View>
        				<View style={[styles.ctaButton, styles.ctaButtonLayout]}>
          					<Text style={[styles.buttonLabel, styles.buttonLabelTypo]}>Set New Password</Text>
        				</View>
      			</ScrollView>
    		</View>);
};

const styles = StyleSheet.create({
  	setNewPasswordContainerContent: {
    		flexDirection: "column",
    		paddingHorizontal: 32,
    		paddingTop: 40,
    		alignItems: "center",
    		justifyContent: "center",
    		gap: 24
  	},
  	textBlockFlexBox: {
    		gap: 6,
    		justifyContent: "center",
    		alignItems: "center",
    		overflow: "hidden"
  	},
  	buttonLabelTypo: {
    		color: "#f0f0f5",
    		fontFamily: "DMSans-Bold",
    		fontWeight: "700",
    		textAlign: "center"
  	},
  	tokenBorder: {
    		gap: 8,
    		paddingVertical: 10,
    		paddingHorizontal: 14,
    		borderRadius: 10,
    		borderWidth: 1,
    		justifyContent: "center",
    		flexDirection: "row",
    		borderStyle: "solid",
    		alignItems: "center",
    		overflow: "hidden"
  	},
  	bannerTypo: {
    		fontSize: 13,
    		lineHeight: 22,
    		textAlign: "center",
    		fontFamily: "DMSans-Regular"
  	},
  	ctaButtonLayout: {
    		borderRadius: 14,
    		alignSelf: "stretch",
    		overflow: "hidden"
  	},
  	strengthBarTrackFlexBox: {
    		gap: 4,
    		justifyContent: "center",
    		overflow: "hidden"
  	},
  	reqTypo: {
    		fontSize: 12,
    		textAlign: "center",
    		fontFamily: "DMSans-Regular"
  	},
  	pwRecoveryState3: {
    		width: "100%",
    		height: 844,
    		backgroundColor: "#1a1a1f",
    		alignItems: "center",
    		overflow: "hidden"
  	},
  	recoveryNavBar: {
    		borderBottomWidth: 1,
    		paddingHorizontal: 20,
    		paddingTop: 60,
    		paddingBottom: 12,
    		flexDirection: "row",
    		borderColor: "#3a3a48",
    		borderStyle: "solid",
    		alignSelf: "stretch",
    		alignItems: "center",
    		overflow: "hidden"
  	},
  	backButton: {
    		paddingHorizontal: 15,
    		paddingVertical: 12,
    		gap: 10,
    		flexDirection: "row",
    		alignItems: "center",
    		overflow: "hidden"
  	},
  	backIcon: {
    		height: 20,
    		width: 13
  	},
  	backLabel: {
    		textAlign: "center",
    		fontFamily: "DMSans-Regular",
    		color: "#00f5ff",
    		fontSize: 16
  	},
  	recoveryContentBlocksetNew: {
    		width: 390,
    		maxWidth: 390,
    		flex: 1
  	},
  	iconBlock: {
    		width: 64,
    		height: 64,
    		borderRadius: 18
  	},
  	textBlock: {
    		alignSelf: "stretch"
  	},
  	recoveryTitle: {
    		fontSize: 26
  	},
  	recoveryBody: {
    		color: "#8a8a9a",
    		lineHeight: 22,
    		fontSize: 15,
    		textAlign: "center",
    		fontFamily: "DMSans-Regular",
    		alignSelf: "stretch"
  	},
  	tokenValidityBanner: {
    		backgroundColor: "rgba(57, 255, 20, 0.08)",
    		borderColor: "rgba(57, 255, 20, 0.25)"
  	},
  	checkIcon: {
    		height: 14,
    		width: 14
  	},
  	bannerText: {
    		color: "#39ff14"
  	},
  	tokenValidityBannerExpired: {
    		backgroundColor: "rgba(255, 77, 77, 0.08)",
    		borderColor: "rgba(255, 77, 77, 0.25)",
    		display: "none"
  	},
  	bannerText2: {
    		color: "#ff4d4d"
  	},
  	requestNewLink: {
    		color: "#00f5ff",
    		fontSize: 13
  	},
  	newPasswordInput: {
    		backgroundColor: "#26262e",
    		paddingHorizontal: 16,
    		paddingVertical: 0,
    		minHeight: 52,
    		borderWidth: 1,
    		borderRadius: 14,
    		gap: 10,
    		flexDirection: "row",
    		borderColor: "#3a3a48",
    		borderStyle: "solid",
    		alignItems: "center"
  	},
  	inputIcon: {
    		height: 18,
    		width: 18
  	},
  	inputField: {
    		textAlign: "left",
    		color: "#8a8a9a",
    		fontSize: 15,
    		flex: 1,
    		fontFamily: "DMSans-Regular"
  	},
  	strengthBarTrack: {
    		height: 4,
    		borderRadius: 2,
    		flexDirection: "row",
    		alignSelf: "stretch",
    		alignItems: "center"
  	},
  	strengthSegment: {
    		backgroundColor: "#31313c",
    		flex: 1,
    		alignSelf: "stretch",
    		overflow: "hidden"
  	},
  	strengthLabel: {
    		justifyContent: "center",
    		gap: 10,
    		flexDirection: "row",
    		alignSelf: "stretch",
    		alignItems: "center"
  	},
  	strengthLabel2: {
    		color: "#8a8a9a",
    		flex: 1
  	},
  	requirementRow: {
    		flexDirection: "row"
  	},
  	reqIconunmet: {
    		height: 12,
    		width: 12
  	},
  	reqText: {
    		color: "#8a8a9a"
  	},
  	reqText2: {
    		color: "#39ff14"
  	},
  	ctaButton: {
    		height: 52,
    		backgroundColor: "#8a8a9a"
  	},
  	buttonLabel: {
    		position: "absolute",
    		marginTop: -11,
    		marginLeft: -71,
    		top: "50%",
    		left: "50%",
    		fontSize: 16,
    		fontFamily: "DMSans-Bold",
    		fontWeight: "700"
  	}
});

export default PWRecoveryState3;
