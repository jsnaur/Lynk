import * as React from "react";
import {StyleSheet, Text, View, Image} from "react-native";

const PWRecoveryState2 = () => {
  	
  	return (
    		<View style={styles.pwRecoveryState2}>
      			<View style={[styles.recoveryNavBar, styles.resendRowFlexBox]}>
        				<View style={[styles.backButton, styles.resendRowFlexBox]}>
          					<Image style={styles.backIcon} resizeMode="cover" />
          					<Text style={styles.backLabel}>Back to Login</Text>
        				</View>
      			</View>
      			<View style={[styles.recoveryContentBlockemailS, styles.instructionFlexBox]}>
        				<Image style={styles.successIllustrationBlockIcon} resizeMode="cover" />
        				<View style={[styles.confirmationTextBlock, styles.instructionFlexBox]}>
          					<Text style={styles.confirmTitle}>Check Your Inbox</Text>
          					<Text style={[styles.confirmBody, styles.confirmBodyTypo]}>
            						<Text style={styles.weveSentAClr}>{`We've sent a reset link to `}</Text>
            						<Text style={[styles.useruniversityedu, styles.buttonTypo]}>[user@university.edu]</Text>
            						<Text style={styles.weveSentAClr}>.{'\n'}It expires in 15 minutes.</Text>
          					</Text>
        				</View>
        				<View style={[styles.expiryCountdownChip, styles.ctaButtonFlexBox]}>
          					<Image style={styles.clockIcon} resizeMode="cover" />
          					<Text style={[styles.countdownText, styles.resendTypo]}>Link expires in 14:58</Text>
        				</View>
        				<View style={[styles.instructionSteps, styles.instructionFlexBox]}>
          					<View style={[styles.instructionStep, styles.instructionFlexBox]}>
            						<View style={styles.stepNumberCircle}>
              							<Text style={[styles.number, styles.numberTypo]}>1</Text>
            						</View>
            						<Text style={[styles.openTheEmail, styles.weveSentAClr]}>Open the email from LYNK in your inbox</Text>
          					</View>
          					<View style={[styles.instructionStep, styles.instructionFlexBox]}>
            						<View style={styles.stepNumberCircle}>
              							<Text style={[styles.number2, styles.numberTypo]}>2</Text>
            						</View>
            						<Text style={[styles.openTheEmail, styles.weveSentAClr]}>Tap the reset link — it opens the app</Text>
          					</View>
          					<View style={[styles.instructionStep, styles.instructionFlexBox]}>
            						<View style={styles.stepNumberCircle}>
              							<Text style={[styles.number2, styles.numberTypo]}>3</Text>
            						</View>
            						<Text style={[styles.openTheEmail, styles.weveSentAClr]}>Create your new password</Text>
          					</View>
        				</View>
        				<View style={[styles.resendRow, styles.instructionFlexBox]}>
          					<Text style={[styles.resendPrompt, styles.resendTypo]}>Didn't receive it?</Text>
            						<Text style={[styles.resendLinkButton, styles.resendTypo]}>Resend email</Text>
            						</View>
            						<View style={[styles.ctaButton, styles.ctaButtonFlexBox]}>
              							<Image style={styles.mailIcon} resizeMode="cover" />
              							<Text style={[styles.buttonLabel, styles.buttonTypo]}>Open Email App</Text>
            						</View>
            						</View>
            						</View>);
            						};
            						
            						const styles = StyleSheet.create({
              							resendRowFlexBox: {
                								flexDirection: "row",
                								alignItems: "center"
              							},
              							instructionFlexBox: {
                								justifyContent: "center",
                								overflow: "hidden"
              							},
              							confirmBodyTypo: {
                								fontSize: 15,
                								textAlign: "center"
              							},
              							buttonTypo: {
                								fontWeight: "600",
                								fontFamily: "DMSans-Bold"
              							},
              							ctaButtonFlexBox: {
                								borderWidth: 1,
                								justifyContent: "center",
                								flexDirection: "row",
                								borderStyle: "solid",
                								alignItems: "center",
                								overflow: "hidden"
              							},
              							resendTypo: {
                								fontSize: 13,
                								textAlign: "center"
              							},
              							numberTypo: {
                								fontSize: 12,
                								left: "50%",
                								top: "50%",
                								marginTop: -8,
                								position: "absolute",
                								color: "#8a8a9a",
                								fontFamily: "DMSans-Bold",
                								fontWeight: "700",
                								textAlign: "center"
              							},
              							weveSentAClr: {
                								color: "#8a8a9a",
                								fontFamily: "DMSans-Regular"
              							},
              							pwRecoveryState2: {
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
                								borderColor: "#3a3a48",
                								alignSelf: "stretch",
                								borderStyle: "solid",
                								flexDirection: "row",
                								overflow: "hidden"
              							},
              							backButton: {
                								paddingHorizontal: 15,
                								paddingVertical: 12,
                								gap: 10,
                								overflow: "hidden"
              							},
              							backIcon: {
                								width: 13,
                								height: 20
              							},
              							backLabel: {
                								fontSize: 16,
                								textAlign: "center",
                								color: "#00f5ff",
                								fontFamily: "DMSans-Regular"
              							},
              							recoveryContentBlockemailS: {
                								width: 390,
                								paddingHorizontal: 32,
                								paddingTop: 40,
                								gap: 24,
                								alignItems: "center"
              							},
              							successIllustrationBlockIcon: {
                								width: 80,
                								height: 80,
                								borderRadius: 20
              							},
              							confirmationTextBlock: {
                								gap: 8,
                								alignItems: "center"
              							},
              							confirmTitle: {
                								fontSize: 26,
                								color: "#f0f0f5",
                								fontFamily: "DMSans-Bold",
                								fontWeight: "700",
                								textAlign: "center"
              							},
              							confirmBody: {
                								lineHeight: 22
              							},
              							useruniversityedu: {
                								color: "#f0f0f5"
              							},
              							expiryCountdownChip: {
                								backgroundColor: "rgba(255, 215, 0, 0.1)",
                								borderColor: "rgba(255, 215, 0, 0.3)",
                								paddingHorizontal: 14,
                								paddingVertical: 8,
                								gap: 6,
                								borderRadius: 20
              							},
              							clockIcon: {
                								height: 14,
                								width: 14
              							},
              							countdownText: {
                								fontFamily: "SpaceMono-Regular",
                								color: "#ffd700"
              							},
              							instructionSteps: {
                								gap: 10
              							},
              							instructionStep: {
                								gap: 12,
                								flexDirection: "row",
                								alignItems: "center"
              							},
              							stepNumberCircle: {
                								height: 24,
                								width: 24,
                								borderRadius: 1000,
                								backgroundColor: "#31313c",
                								overflow: "hidden"
              							},
              							number: {
                								marginLeft: -3
              							},
              							openTheEmail: {
                								fontSize: 14,
                								lineHeight: 20,
                								textAlign: "center"
              							},
              							number2: {
                								marginLeft: -4
              							},
              							resendRow: {
                								gap: 4,
                								flexDirection: "row",
                								alignItems: "center"
              							},
              							resendPrompt: {
                								color: "#8a8a9a",
                								fontFamily: "DMSans-Regular"
              							},
              							resendLinkButton: {
                								fontWeight: "600",
                								fontFamily: "DMSans-Bold",
                								color: "#00f5ff"
              							},
              							ctaButton: {
                								height: 52,
                								borderRadius: 14,
                								backgroundColor: "#26262e",
                								gap: 8,
                								borderColor: "#3a3a48",
                								alignSelf: "stretch",
                								borderWidth: 1
              							},
              							mailIcon: {
                								width: 20,
                								height: 20
              							},
              							buttonLabel: {
                								fontSize: 15,
                								textAlign: "center",
                								color: "#f0f0f5"
              							}
            						});
            						
            						export default PWRecoveryState2;
            						