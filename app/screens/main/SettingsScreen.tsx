import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
  Modal,
  Switch,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEED_COLORS } from '../../constants/colors';


// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface SettingsSectionProps {
  label: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ label, children }) => (
  <View style={styles.section}>
    {label && (
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
    )}
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

interface SettingsNavRowProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  rightContent?: 'chevron' | 'value' | 'lock' | 'destructive';
  rightValue?: string;
  isLast?: boolean;
  isDestructive?: boolean;
  onPress: () => void;
}

const SettingsNavRow: React.FC<SettingsNavRowProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  rightContent = 'chevron',
  rightValue,
  isLast = false,
  isDestructive = false,
  onPress,
}) => (
  <Pressable
    style={[styles.navRow, !isLast && styles.navRowBorder]}
    onPress={onPress}
  >
    {/* Icon Frame */}
    <View style={[styles.iconFrame, { backgroundColor: iconBgColor }]}>
      <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} />
    </View>

    {/* Label Block */}
    <View style={styles.labelBlock}>
      <Text style={[styles.rowTitle, isDestructive && styles.destructiveText]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>

    {/* Right Slot */}
    <View style={styles.rightSlot}>
      {rightContent === 'chevron' && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color="#3A3A48"
        />
      )}
      {rightContent === 'value' && (
        <View style={styles.valueWithChevron}>
          <Text style={styles.valueLabel}>{rightValue}</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color="#3A3A48"
          />
        </View>
      )}
      {rightContent === 'lock' && (
        <MaterialCommunityIcons
          name="lock"
          size={14}
          color="#3A3A48"
        />
      )}
      {rightContent === 'destructive' && (
        <Text style={styles.destructiveText}>{rightValue}</Text>
      )}
    </View>
  </Pressable>
);

interface SettingsToggleRowProps {
  icon?: string;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  isLast?: boolean;
  isSub?: boolean;
}

const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  value,
  onToggle,
  isLast = false,
  isSub = false,
}) => (
  <View
    style={[
      styles.toggleRow,
      !isLast && styles.toggleRowBorder,
      isSub && styles.subToggleRow,
    ]}
  >
    {!isSub && (
      <View style={[styles.iconFrame, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} />
      </View>
    )}

    <View style={[styles.labelBlock, isSub && styles.subLabelBlock]}>
      <Text style={[styles.rowTitle, isSub && styles.subRowTitle]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.rowSubtitle, isSub && styles.subRowSubtitle]}>
          {subtitle}
        </Text>
      )}
    </View>

    <Switch
      style={styles.toggleSwitch}
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#3A3A48', true: FEED_COLORS.favor }}
      thumbColor="#FFFFFF"
    />
  </View>
);

// ============================================================================
// CONFIRMATION MODALS
// ============================================================================

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  body: string;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  body,
  actionLabel,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Icon */}
        <View style={styles.modalIconFrame}>
          <MaterialCommunityIcons
            name={actionLabel === 'Log Out' ? 'logout' : 'trash-can'}
            size={24}
            color="#FF4D4D"
          />
        </View>

        {/* Text */}
        <View style={styles.modalTextBlock}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>
        </View>

        {/* Actions */}
        <View style={styles.modalActionRow}>
          <Pressable
            style={styles.destructiveButton}
            onPress={onConfirm}
          >
            <Text style={styles.destructiveButtonText}>{actionLabel}</Text>
          </Pressable>
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

// ============================================================================
// MAIN SETTINGS SCREEN
// ============================================================================

export default function SettingsScreen({ navigation }: any) {
  const [questActivityEnabled, setQuestActivityEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [ratingsEnabled, setRatingsEnabled] = useState(true);
  const [xpLevelUpEnabled, setXpLevelUpEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [profileVisibilityEnabled, setProfileVisibilityEnabled] = useState(true);
  const [onlineStatusEnabled, setOnlineStatusEnabled] = useState(true);
  const [appearanceValue, setAppearanceValue] = useState('Dark');

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Handlers
  const handleLogOut = async () => {
    try {
      await AsyncStorage.removeItem('@lynk/profileDisplayName');
      await supabase.auth.signOut();
      setLogoutModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion with backend
      Alert.alert('Account Deleted', 'Your account has been deleted.');
      setDeleteModalVisible(false);
      await supabase.auth.signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account.');
    }
  };

  const handleSendFeedback = async () => {
    const email = 'feedback@lynk.app';
    const subject = 'LYNK Feedback';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    await Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open email client')
    );
  };

  const handleReportBug = async () => {
    const email = 'bugs@lynk.app';
    const subject = 'LYNK Bug Report';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    await Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open email client')
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={16} color={FEED_COLORS.favor} />
          <Text style={styles.backLabel}>Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scroll Container */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: ACCOUNT */}
        <SettingsSection label="ACCOUNT">
          <SettingsNavRow
            icon="person"
            iconBgColor="rgba(0, 245, 255, 0.15)"
            iconColor={FEED_COLORS.favor}
            title="Edit Profile"
            onPress={() => {
              navigation.goBack();
              setImmediate(() => {
                navigation.setParams({ openEditProfile: true });
              });
            }}
          />
          <SettingsNavRow
            icon="lock"
            iconBgColor="rgba(0, 245, 255, 0.15)"
            iconColor={FEED_COLORS.favor}
            title="Change Password"
            onPress={() => navigation.navigate('PasswordRecovery')}
          />
          <SettingsNavRow
            icon="shield-check"
            iconBgColor="rgba(57, 255, 20, 0.12)"
            iconColor={FEED_COLORS.item}
            title="Verified Email"
            subtitle="your@university.edu"
            rightContent="lock"
            isLast
            onPress={() => {}}
          />
        </SettingsSection>

        {/* SECTION 2: NOTIFICATIONS */}
        <SettingsSection label="NOTIFICATIONS">
          <SettingsToggleRow
            icon="bell"
            iconBgColor="rgba(255, 215, 0, 0.12)"
            iconColor={FEED_COLORS.xp}
            title="Push Notifications"
            subtitle="Allow LYNK to send notifications"
            value={pushNotificationsEnabled}
            onToggle={setPushNotificationsEnabled}
          />

          {/* Sub-toggle group - visible when master toggle is ON */}
          {pushNotificationsEnabled && (
            <>
              <SettingsToggleRow
                title="Quest Activity"
                subtitle="Accepted, completed, pending"
                value={questActivityEnabled}
                onToggle={setQuestActivityEnabled}
                isSub
              />
              <SettingsToggleRow
                title="Comments"
                subtitle="New replies on your quests"
                value={commentsEnabled}
                onToggle={setCommentsEnabled}
                isSub
              />
              <SettingsToggleRow
                title="Ratings"
                subtitle="When someone rates your help"
                value={ratingsEnabled}
                onToggle={setRatingsEnabled}
                isSub
              />
              <SettingsToggleRow
                title="XP & Level-ups"
                subtitle="Milestone and reward alerts"
                value={xpLevelUpEnabled}
                onToggle={setXpLevelUpEnabled}
                isSub
                isLast
              />
            </>
          )}

          {!pushNotificationsEnabled && (
            <View style={styles.toggleRowBorder} />
          )}
        </SettingsSection>

        {/* SECTION 3: PRIVACY */}
        <SettingsSection label="PRIVACY">
          <SettingsToggleRow
            icon="eye"
            iconBgColor="rgba(138, 138, 154, 0.12)"
            iconColor={FEED_COLORS.textSecondary}
            title="Profile Visibility"
            subtitle={profileVisibilityEnabled ? "Visible to all verified students" : "Limited visibility"}
            value={profileVisibilityEnabled}
            onToggle={setProfileVisibilityEnabled}
          />
          <SettingsToggleRow
            icon="circle"
            iconBgColor="rgba(138, 138, 154, 0.12)"
            iconColor={FEED_COLORS.textSecondary}
            title="Show Online Status"
            subtitle="Let others see when you're active"
            value={onlineStatusEnabled}
            onToggle={setOnlineStatusEnabled}
            isLast
          />
        </SettingsSection>

        {/* SECTION 4: APP */}
        <SettingsSection label="APP">
          <SettingsNavRow
            icon="moon"
            iconBgColor="rgba(192, 132, 252, 0.12)"
            iconColor={FEED_COLORS.token}
            title="Appearance"
            rightContent="value"
            rightValue={appearanceValue}
            onPress={() => {
              Alert.alert('Appearance', 'Dark mode is currently active. Light mode coming soon.', [
                { text: 'OK' }
              ]);
            }}
          />
          <SettingsNavRow
            icon="building"
            iconBgColor="rgba(57, 255, 20, 0.12)"
            iconColor={FEED_COLORS.item}
            title="Campus"
            subtitle="State University"
            rightContent="lock"
            isLast
            onPress={() => {}}
          />
        </SettingsSection>

        {/* SECTION 5: SUPPORT */}
        <SettingsSection label="SUPPORT">
          <SettingsNavRow
            icon="message-square"
            iconBgColor="rgba(0, 245, 255, 0.1)"
            iconColor={FEED_COLORS.favor}
            title="Send Feedback"
            onPress={handleSendFeedback}
          />
          <SettingsNavRow
            icon="alert-triangle"
            iconBgColor="rgba(255, 215, 0, 0.1)"
            iconColor={FEED_COLORS.xp}
            title="Report a Bug"
            onPress={handleReportBug}
          />
          <SettingsNavRow
            icon="information"
            iconBgColor="rgba(138, 138, 154, 0.12)"
            iconColor={FEED_COLORS.textSecondary}
            title="About LYNK"
            rightContent="value"
            rightValue="v1.0.0"
            isLast
            onPress={() => {
              Alert.alert('About LYNK', 'Version 1.0.0\n\nLynk Platform', [
                { text: 'OK' }
              ]);
            }}
          />
        </SettingsSection>

        {/* SECTION 6: ACCOUNT ACTIONS */}
        <View style={styles.accountActionsGap} />
        <SettingsSection label="">
          <SettingsNavRow
            icon="logout"
            iconBgColor="rgba(255, 77, 77, 0.12)"
            iconColor="#FF4D4D"
            title="Log Out"
            isDestructive
            isLast={false}
            onPress={() => setLogoutModalVisible(true)}
          />
          <SettingsNavRow
            icon="trash-can"
            iconBgColor="rgba(255, 77, 77, 0.08)"
            iconColor="#FF4D4D"
            title="Delete Account"
            isDestructive
            isLast
            onPress={() => setDeleteModalVisible(true)}
          />
        </SettingsSection>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <ConfirmActionModal
        visible={logoutModalVisible}
        title="Log out of LYNK?"
        body="You can log back in anytime with your .edu email."
        actionLabel="Log Out"
        onConfirm={handleLogOut}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ConfirmActionModal
        visible={deleteModalVisible}
        title="Delete your account?"
        body="This permanently removes your profile, quests, and Karma. This cannot be undone."
        actionLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  // ========== ROOT & LAYOUT ==========
  root: {
    flex: 1,
    backgroundColor: '#1A1A1F',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },

  // ========== HEADER ==========
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A48',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    width: 44,
    justifyContent: 'center',
  },

  backLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: FEED_COLORS.favor,
    fontFamily: 'DM_Sans-Regular',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0F0F5',
    fontFamily: 'DM_Sans-Bold',
  },

  headerSpacer: {
    width: 44,
  },

  // ========== SCROLL CONTAINER ==========
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1A1A1F',
    paddingVertical: 20,
  },

  // ========== SECTION COMPONENT ==========
  section: {
    marginHorizontal: 0,
    marginBottom: 8,
  },

  sectionLabelRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A9A',
    fontFamily: 'DM_Sans-SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  sectionBody: {
    backgroundColor: '#26262E',
    borderTopWidth: 1,
    borderTopColor: '#3A3A48',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A48',
  },

  // ========== NAV ROW ==========
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },

  navRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A48',
  },

  iconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  labelBlock: {
    flex: 1,
    gap: 1,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F0F0F5',
    fontFamily: 'DM_Sans-Medium',
  },

  rowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A8A9A',
    fontFamily: 'DM_Sans-Regular',
  },

  destructiveText: {
    color: '#FF4D4D',
  },

  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  valueWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  valueLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A8A9A',
    fontFamily: 'DM_Sans-Regular',
  },

  // ========== TOGGLE ROW ==========
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#26262E',
  },

  toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A48',
  },

  subToggleRow: {
    paddingLeft: 52,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },

  subLabelBlock: {
    gap: 0,
  },

  subRowTitle: {
    fontSize: 14,
    fontWeight: '400',
  },

  subRowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },

  toggleSwitch: {
    marginLeft: 'auto',
  },

  // ========== MODAL STYLES ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: 320,
    backgroundColor: '#2A2A35',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },

  modalIconFrame: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalTextBlock: {
    gap: 6,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F0F5',
    fontFamily: 'DM_Sans-Bold',
    textAlign: 'center',
  },

  modalBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A8A9A',
    fontFamily: 'DM_Sans-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  modalActionRow: {
    width: '100%',
    gap: 8,
  },

  destructiveButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  destructiveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'DM_Sans-Bold',
  },

  cancelButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#3A3A48',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F0F0F5',
    fontFamily: 'DM_Sans-Medium',
  },

  // ========== ACCOUNT ACTIONS SPACING ==========
  accountActionsGap: {
    height: 24,
  },

  // ========== TYPOGRAPHY HELPERS ==========
  textSecondary: {
    color: '#8A8A9A',
  },
});