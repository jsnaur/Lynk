import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  Modal,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withOpacity } from '../../constants/colors';
import { screenHeaderTheme, useTheme } from '../../contexts/ThemeContext';
import { useCustomAlert } from '../../contexts/AlertContext';
import { useNotificationPreferences } from '../../contexts/NotificationPreferencesContext';

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
  const { alert } = useCustomAlert();

  const { prefs, setPrefs } = useNotificationPreferences();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleLogOut = async () => {
    try {
      await AsyncStorage.removeItem('@lynk/profileDisplayName');
      await supabase.auth.signOut();
      setLogoutModalVisible(false);
    } catch (error) {
      alert('Error', 'Failed to log out.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      alert('Account Deleted', 'Your account has been deleted.');
      setDeleteModalVisible(false);
      await supabase.auth.signOut();
    } catch (error) {
      alert('Error', 'Failed to delete account.');
    }
  };

  const handleSendFeedback = async () => {
    const email = 'feedback@lynk.app';
    const subject = 'LYNK Feedback';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    await Linking.openURL(url).catch(() =>
      alert('Error', 'Could not open email client')
    );
  };

  const handleReportBug = async () => {
    const email = 'bugs@lynk.app';
    const subject = 'LYNK Bug Report';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    await Linking.openURL(url).catch(() =>
      alert('Error', 'Could not open email client')
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Back button — left-anchored, never grows */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textPrimary} />
          <Text style={styles.backLabel} numberOfLines={1}>
            Profile
          </Text>
        </Pressable>

        {/* Title — absolutely centred over the full header width, non-interactive */}
        <Text style={styles.headerTitle} numberOfLines={1} pointerEvents="none">
          Settings
        </Text>

        {/* Right spacer — mirrors back button width so title stays centred */}
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
            onPress={() => navigation.navigate('ChangePassword')}
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
            icon="sword-cross"
            iconBgColor={withOpacity(colors.favor, 0.12)}
            iconColor={colors.favor}
            title="Quest Activity"
            subtitle="Accepted, started, completed, applicants"
            value={prefs.questActivity}
            onToggle={(v) => setPrefs({ questActivity: v })}
          />
          <SettingsToggleRow
            icon="comment-text-outline"
            iconBgColor={withOpacity(colors.item, 0.12)}
            iconColor={colors.item}
            title="Comments"
            subtitle="New replies on your quests"
            value={prefs.comments}
            onToggle={(v) => setPrefs({ comments: v })}
          />
          <SettingsToggleRow
            icon="star-outline"
            iconBgColor={withOpacity(colors.xp, 0.12)}
            iconColor={colors.xp}
            title="Ratings"
            subtitle="When someone rates your help"
            value={prefs.ratings}
            onToggle={(v) => setPrefs({ ratings: v })}
          />
          <SettingsToggleRow
            icon="lightning-bolt"
            iconBgColor={withOpacity(colors.token, 0.12)}
            iconColor={colors.token}
            title="XP & Level-ups"
            subtitle="Daily rewards and milestone alerts"
            value={prefs.xpLevelUp}
            onToggle={(v) => setPrefs({ xpLevelUp: v })}
            isLast
          />
        </SettingsSection>

        {/* SECTION 3: APP */}
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

        {/* SECTION 4: SUPPORT */}
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
              alert(
                'About LYNK',
                'LYNK is an exclusive campus questing mobile application designed specifically for the students of the Cebu Institute of Technology - University (CIT - U). By merging social connectivity with engaging real-world and digital challenges, LYNK transforms the university experience into an interactive adventure. To ensure a safe, localized, and authentic community, registration is strictly restricted to users with a valid @cit.edu institutional email address.\n\nStudents can interact with a dynamic feed, tackle exciting campus-centric challenges, customize their profiles with unique avatars and badges, and earn rewards through our in-app shop.',
                [{ text: 'OK' }]
              );
            }}
          />
        </SettingsSection>

        {/* SECTION 5: ACCOUNT ACTIONS */}
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
  },

  // ── Header ──────────────────────────────────────────────────────────────
  // Key fix: `position: 'relative'` on the container so the absolutely-
  // positioned title is constrained to the header bounds, not the screen.
  header: {
    // Increased header height and top padding to give more top margin
    height: screenHeaderTheme.layout.height + 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: screenHeaderTheme.layout.topPadding + 12,
    paddingHorizontal: screenHeaderTheme.layout.horizontalPadding,
    paddingBottom: screenHeaderTheme.layout.bottomPadding + 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // Required so the absolute title is clipped to this View
    position: 'relative',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    // Give the button a fixed width that matches headerSpacer.
    // 112 comfortably fits "< Profile" on all phones.
    width: 112,
    justifyContent: 'flex-start',
    // Sits above the title in z-order so taps are captured correctly
    zIndex: 1,
  },

  backLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.favor,
    fontFamily: 'DM_Sans-Medium',
    flexShrink: 1,
  },

  // Absolutely-centred title — never nudged by sibling widths
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    // Fill the full header width and centre the text
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: screenHeaderTheme.layout.bottomPadding + 12,
    textAlign: 'center',
    // Sit below the back button so touches pass through to it
    zIndex: 0,
  },

  // Mirror of backButton width — keeps title visually centred
  headerSpacer: {
    width: 112,
    zIndex: 1,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingVertical: 20,
  },

  // ── Sections ─────────────────────────────────────────────────────────────
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

  // ── Nav rows ─────────────────────────────────────────────────────────────
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

  // ── Toggle rows ───────────────────────────────────────────────────────────
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

  // ── Modals ────────────────────────────────────────────────────────────────
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

  // ── Misc ─────────────────────────────────────────────────────────────────
  accountActionsGap: {
    height: 24,
  },
});