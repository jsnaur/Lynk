import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface SettingsSectionProps {
  label: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ label, children }) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  return (
    <View style={styles.section}>
      {label && (
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>{label}</Text>
        </View>
      )}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

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
}) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  return (
    <Pressable
      style={[styles.navRow, !isLast && styles.navRowBorder]}
      onPress={onPress}
    >
      <View style={[styles.iconFrame, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} />
      </View>

      <View style={styles.labelBlock}>
        <Text style={[styles.rowTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSlot}>
        {rightContent === 'chevron' && (
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.border} />
        )}
        {rightContent === 'value' && (
          <View style={styles.valueWithChevron}>
            <Text style={styles.valueLabel}>{rightValue}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.border} />
          </View>
        )}
        {rightContent === 'lock' && (
          <MaterialCommunityIcons name="lock" size={14} color={colors.textSecondary} />
        )}
        {rightContent === 'destructive' && (
          <Text style={styles.destructiveText}>{rightValue}</Text>
        )}
      </View>
    </Pressable>
  );
};

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
}) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  return (
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
        trackColor={{ false: colors.border, true: colors.favor }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

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
}) => {
  const { colors, theme } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconFrame}>
            <MaterialCommunityIcons
              name={actionLabel === 'Log Out' ? 'logout' : 'trash-can'}
              size={24}
              color={colors.error}
            />
          </View>
          <View style={styles.modalTextBlock}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalBody}>{body}</Text>
          </View>
          <View style={styles.modalActionRow}>
            <Pressable style={styles.destructiveButton} onPress={onConfirm}>
              <Text style={styles.destructiveButtonText}>{actionLabel}</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// MAIN SETTINGS SCREEN
// ============================================================================

export default function SettingsScreen({ navigation }: any) {
  const { theme, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const [questActivityEnabled, setQuestActivityEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [ratingsEnabled, setRatingsEnabled] = useState(true);
  const [xpLevelUpEnabled, setXpLevelUpEnabled] = useState(true);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [profileVisibilityEnabled, setProfileVisibilityEnabled] = useState(true);
  const [onlineStatusEnabled, setOnlineStatusEnabled] = useState(true);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={16} color={colors.favor} />
          <Text style={styles.backLabel}>Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: ACCOUNT */}
        <SettingsSection label="ACCOUNT">
          <SettingsNavRow
            icon="lock"
            iconBgColor={withOpacity(colors.favor, 0.15)}
            iconColor={colors.favor}
            title="Change Password"
            onPress={() => navigation.navigate('PasswordRecovery')}
          />
          <SettingsNavRow
            icon="shield-check"
            iconBgColor={withOpacity(colors.item, 0.12)}
            iconColor={colors.item}
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
            iconBgColor={withOpacity(colors.xp, 0.12)}
            iconColor={colors.xp}
            title="Push Notifications"
            subtitle="Allow LYNK to send notifications"
            value={pushNotificationsEnabled}
            onToggle={setPushNotificationsEnabled}
          />

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
            iconBgColor={withOpacity(colors.textSecondary, 0.12)}
            iconColor={colors.textSecondary}
            title="Profile Visibility"
            subtitle={profileVisibilityEnabled ? "Visible to all verified students" : "Limited visibility"}
            value={profileVisibilityEnabled}
            onToggle={setProfileVisibilityEnabled}
          />
          <SettingsToggleRow
            icon="circle"
            iconBgColor={withOpacity(colors.textSecondary, 0.12)}
            iconColor={colors.textSecondary}
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
            icon={theme === 'dark' ? 'weather-night' : 'weather-sunny'}
            iconBgColor={withOpacity(colors.token, 0.12)}
            iconColor={colors.token}
            title="Appearance"
            rightContent="value"
            rightValue={theme === 'dark' ? 'Dark' : 'Light'}
            onPress={toggleTheme}
          />
          <SettingsNavRow
            icon="office-building"
            iconBgColor={withOpacity(colors.item, 0.12)}
            iconColor={colors.item}
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
            icon="message-text-outline"
            iconBgColor={withOpacity(colors.favor, 0.1)}
            iconColor={colors.favor}
            title="Send Feedback"
            onPress={handleSendFeedback}
          />
          <SettingsNavRow
            icon="alert"
            iconBgColor={withOpacity(colors.xp, 0.1)}
            iconColor={colors.xp}
            title="Report a Bug"
            onPress={handleReportBug}
          />
          <SettingsNavRow
            icon="information"
            iconBgColor={withOpacity(colors.textSecondary, 0.12)}
            iconColor={colors.textSecondary}
            title="About LYNK"
            rightContent="value"
            rightValue="v1.0.0"
            isLast
            onPress={() => {
              Alert.alert('About LYNK', 'Version 1.0.0\n\nLynk Platform', [{ text: 'OK' }]);
            }}
          />
        </SettingsSection>

        {/* SECTION 6: ACCOUNT ACTIONS */}
        <View style={styles.accountActionsGap} />
        <SettingsSection label="">
          <SettingsNavRow
            icon="logout"
            iconBgColor={withOpacity(colors.error, 0.12)}
            iconColor={colors.error}
            title="Log Out"
            isDestructive
            isLast={false}
            onPress={() => setLogoutModalVisible(true)}
          />
          <SettingsNavRow
            icon="trash-can"
            iconBgColor={withOpacity(colors.error, 0.08)}
            iconColor={colors.error}
            title="Delete Account"
            isDestructive
            isLast
            onPress={() => setDeleteModalVisible(true)}
          />
        </SettingsSection>

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

// ============================================================================
// DYNAMIC STYLES
// ============================================================================

const getStyles = (colors: any, theme: string) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.favor,
    fontFamily: 'DM_Sans-Regular',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'DM_Sans-Bold',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingVertical: 20,
  },
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
    color: colors.textSecondary,
    fontFamily: 'DM_Sans-SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  navRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
    fontFamily: 'DM_Sans-Medium',
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    fontFamily: 'DM_Sans-Regular',
  },
  destructiveText: {
    color: colors.error,
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
    color: colors.textSecondary,
    fontFamily: 'DM_Sans-Regular',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: colors.surface,
  },
  toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subToggleRow: {
    paddingLeft: 52,
    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.03)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: 320,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  modalIconFrame: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: withOpacity(colors.error, 0.12),
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
    color: colors.textPrimary,
    fontFamily: 'DM_Sans-Bold',
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
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
    backgroundColor: colors.error,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: 'DM_Sans-Medium',
  },
  accountActionsGap: {
    height: 24,
  },
});