import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    Animated,
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, withOpacity } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS } from '../../constants/fonts';

type ThemeColors = Record<keyof typeof darkColors, string>;

const MAJORS = [
  "Computer Science", "Information Technology", "Business", "Architecture",
  "Computer Engineering", "Electrical Engineering", "Mechanical Engineering",
  "Chemical Engineering", "Industrial Engineering", "Mechatronics Engineering",
  "Civil Engineering", "Mining Engineering", "Electronics Engineering",
  "Psychology", "Nursing", "Criminology", "Accounting",
  "Tourism Management", "Hotel Management",
];

const GRADUATION_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

type EditProfileModalProps = {
    onClose?: () => void;
    onSave?: (data: ProfileData) => void;
    initialData?: ProfileData;
};

type ProfileData = {
    displayName: string;
    bio: string;
    major: string;
    graduationYear: string;
};

export default function EditProfileModal({
    onClose,
    onSave,
    initialData = {
        displayName: '',
        bio: '',
        major: 'Undeclared',
        graduationYear: '2027',
    },
}: EditProfileModalProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const slideAnim = useRef(new Animated.Value(36)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const [displayName, setDisplayName] = useState(initialData.displayName);
    const [bio, setBio] = useState(initialData.bio);
    const [major, setMajor] = useState(initialData.major);
    const [graduationYear, setGraduationYear] = useState(initialData.graduationYear);
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [majorSearchQuery, setMajorSearchQuery] = useState('');
    const [yearSearchQuery, setYearSearchQuery] = useState('');

    const filteredMajors = useMemo(
        () =>
            MAJORS.filter((m) =>
                m.toLowerCase().includes(majorSearchQuery.trim().toLowerCase())
            ),
        [majorSearchQuery]
    );

    const filteredGraduationYears = useMemo(
        () =>
            GRADUATION_YEARS.filter((year) =>
                year
                    .toLowerCase()
                    .includes(yearSearchQuery.trim().toLowerCase())
            ),
        [yearSearchQuery]
    );

    const getMatchingMajor = (value: string) =>
        MAJORS.find((m) => m.toLowerCase() === value.trim().toLowerCase());

    const getMatchingGraduationYear = (value: string) =>
        GRADUATION_YEARS.find(
            (year) => year.toLowerCase() === value.trim().toLowerCase()
        );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 260,
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, opacityAnim]);

    const handleSave = () => {
        const data: ProfileData = {
            displayName,
            bio,
            major,
            graduationYear,
        };
        onSave?.(data);
    };

    const handleShopPress = () => {
        Alert.alert('Shop', 'Opening Shop...');
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.modalHandle}>
                <View style={styles.handleBar} />
            </View>

            <View style={styles.header}>
                <Pressable onPress={onClose} hitSlop={10}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </Pressable>

                <Text style={styles.headerTitle}>Edit Profile</Text>

                <Pressable onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            >
                <ScrollView
                    style={styles.formContainer}
                    showsVerticalScrollIndicator={false}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                <View style={styles.fieldBlock}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                        <Text style={styles.fieldCounter}>
                            {displayName.length} / 30
                        </Text>
                    </View>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your display name"
                        placeholderTextColor={colors.textSecondary}
                        value={displayName}
                        onChangeText={(text) =>
                            setDisplayName(text.slice(0, 30))
                        }
                        maxLength={30}
                    />
                </View>

                <View style={styles.fieldBlock}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>BIO</Text>
                        <Text style={styles.fieldCounter}>
                            {bio.length} / 100
                        </Text>
                    </View>
                    <TextInput
                        style={[styles.textInput, styles.bioInput]}
                        placeholder="Tell your campus a little about yourself..."
                        placeholderTextColor={colors.textSecondary}
                        value={bio}
                        onChangeText={(text) => setBio(text.slice(0, 100))}
                        maxLength={100}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <Text style={styles.helperText}>
                        Shown on your public profile
                    </Text>
                </View>

                <View style={styles.fieldBlock}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>MAJOR</Text>
                    </View>
                    <Pressable
                        style={styles.dropdownButton}
                        onPress={() => {
                            const nextIsOpen = !showMajorDropdown;
                            setShowMajorDropdown(nextIsOpen);
                            if (!nextIsOpen) {
                                setMajorSearchQuery('');
                            } else {
                                setMajorSearchQuery('');
                            }
                        }}
                    >
                        <TextInput
                            style={[
                                styles.dropdownInput,
                                !showMajorDropdown &&
                                    major !== 'Undeclared' && {
                                    color: colors.textPrimary,
                                },
                            ]}
                            value={
                                showMajorDropdown ? majorSearchQuery : major
                            }
                            onFocus={() => {
                                setShowMajorDropdown(true);
                                setMajorSearchQuery('');
                            }}
                            onChangeText={(text) => {
                                setShowMajorDropdown(true);
                                setMajorSearchQuery(text);
                                const matchingMajor = getMatchingMajor(text);
                                if (matchingMajor) {
                                    setMajor(matchingMajor);
                                }
                            }}
                            placeholder={showMajorDropdown ? '' : 'Search major'}
                            placeholderTextColor={colors.textSecondary}
                            onEndEditing={() => {
                                const matchingMajor =
                                    getMatchingMajor(majorSearchQuery);
                                if (matchingMajor) {
                                    setMajor(matchingMajor);
                                }
                            }}
                        />
                        <Ionicons
                            name={
                                showMajorDropdown
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size={16}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                    {showMajorDropdown && (
                        <View style={styles.dropdownMenu}>
                            <ScrollView
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                            >
                                {filteredMajors.length > 0 ? (
                                    filteredMajors.map((m) => (
                                        <Pressable
                                            key={m}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setMajor(m);
                                                setShowMajorDropdown(false);
                                                setMajorSearchQuery('');
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.dropdownItemText,
                                                    m === major &&
                                                        styles.selectedItem,
                                                ]}
                                            >
                                                {m}
                                            </Text>
                                        </Pressable>
                                    ))
                                ) : (
                                    <View style={styles.emptyDropdownState}>
                                        <Text style={styles.emptyDropdownText}>
                                            No majors found
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.fieldBlock}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>GRADUATION YEAR</Text>
                    </View>
                    <Pressable
                        style={styles.dropdownButton}
                        onPress={() => {
                            const nextIsOpen = !showYearDropdown;
                            setShowYearDropdown(nextIsOpen);
                            if (!nextIsOpen) {
                                setYearSearchQuery('');
                            } else {
                                setYearSearchQuery('');
                            }
                        }}
                    >
                        <TextInput
                            style={[
                                styles.dropdownInput,
                                !showYearDropdown &&
                                    graduationYear !== '2027' && {
                                    color: colors.textPrimary,
                                },
                            ]}
                            value={
                                showYearDropdown
                                    ? yearSearchQuery
                                    : graduationYear
                            }
                            onFocus={() => {
                                setShowYearDropdown(true);
                                setYearSearchQuery('');
                            }}
                            onChangeText={(text) => {
                                setShowYearDropdown(true);
                                setYearSearchQuery(text);
                                const matchingYear =
                                    getMatchingGraduationYear(text);
                                if (matchingYear) {
                                    setGraduationYear(matchingYear);
                                }
                            }}
                            placeholder={showYearDropdown ? '' : 'Search year'}
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="number-pad"
                            onEndEditing={() => {
                                const matchingYear =
                                    getMatchingGraduationYear(yearSearchQuery);
                                if (matchingYear) {
                                    setGraduationYear(matchingYear);
                                }
                            }}
                        />
                        <Ionicons
                            name={
                                showYearDropdown
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size={16}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                    {showYearDropdown && (
                        <View style={styles.dropdownMenu}>
                            <ScrollView
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                            >
                                {filteredGraduationYears.length > 0 ? (
                                    filteredGraduationYears.map((year) => (
                                        <Pressable
                                            key={year}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setGraduationYear(year);
                                                setShowYearDropdown(false);
                                                setYearSearchQuery('');
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.dropdownItemText,
                                                    year === graduationYear &&
                                                        styles.selectedItem,
                                                ]}
                                            >
                                                {year}
                                            </Text>
                                        </Pressable>
                                    ))
                                ) : (
                                    <View style={styles.emptyDropdownState}>
                                        <Text style={styles.emptyDropdownText}>
                                            No years found
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: COLORS.surface,
        zIndex: 1000,
    },
    modalHandle: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingTop: 10,
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: FONTS.display,
        color: COLORS.textPrimary,
    },
    saveButton: {
        backgroundColor: COLORS.favor,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.bg,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 48,
    },
    fieldBlock: {
        marginBottom: 18,
    },
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 10,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 1.5,
    },
    fieldCounter: {
        fontSize: 11,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    textInput: {
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: COLORS.textPrimary,
        minHeight: 52,
    },
    bioInput: {
        minHeight: 80,
        marginBottom: 6,
    },
    helperText: {
        fontSize: 11,
        fontWeight: '400',
        color: COLORS.textSecondary,
        marginTop: 6,
        marginLeft: 10,
    },
    dropdownButton: {
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        minHeight: 52,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownInput: {
        fontSize: 15,
        fontWeight: '400',
        color: COLORS.textSecondary,
        flex: 1,
        paddingVertical: 0,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    dropdownMenu: {
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        marginTop: 8,
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dropdownItemText: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    selectedItem: {
        color: COLORS.favor,
        fontWeight: '600',
    },
    emptyDropdownState: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    emptyDropdownText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    nudgeCard: {
        backgroundColor: withOpacity(COLORS.favor, 0.04),
        borderWidth: 1,
        borderColor: withOpacity(COLORS.favor, 0.15),
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nudgeAvatarContainer: {
        backgroundColor: COLORS.surface2,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nudgeTextBlock: {
        flex: 1,
    },
    nudgeTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    nudgeDescription: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    shopLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    shopLinkText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.favor,
    },
});