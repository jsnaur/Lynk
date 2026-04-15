import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEED_COLORS } from '../../constants/colors';

const MAJORS = [
    'Computer Engineering',
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business',
    'Biology',
    'Chemistry',
    'Physics',
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
    // Provide empty string for bio so placeholder works properly
    initialData = {
        displayName: '',
        bio: '',
        major: 'Undeclared',
        graduationYear: '2027',
    },
}: EditProfileModalProps) {
    const slideAnim = useRef(new Animated.Value(36)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const [displayName, setDisplayName] = useState(initialData.displayName);
    const [bio, setBio] = useState(initialData.bio);
    const [major, setMajor] = useState(initialData.major);
    const [graduationYear, setGraduationYear] = useState(initialData.graduationYear);
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

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

            <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
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
                        placeholderTextColor={FEED_COLORS.textSecondary}
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
                        placeholderTextColor={FEED_COLORS.textSecondary}
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
                        onPress={() => setShowMajorDropdown(!showMajorDropdown)}
                    >
                        <Text style={styles.dropdownText}>{major}</Text>
                        <Ionicons
                            name={
                                showMajorDropdown
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size={16}
                            color={FEED_COLORS.textSecondary}
                        />
                    </Pressable>
                    {showMajorDropdown && (
                        <View style={styles.dropdownMenu}>
                            {MAJORS.map((m) => (
                                <Pressable
                                    key={m}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setMajor(m);
                                        setShowMajorDropdown(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownItemText,
                                            m === major && styles.selectedItem,
                                        ]}
                                    >
                                        {m}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.fieldBlock}>
                    <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>GRADUATION YEAR</Text>
                    </View>
                    <Pressable
                        style={styles.dropdownButton}
                        onPress={() =>
                            setShowYearDropdown(!showYearDropdown)
                        }
                    >
                        <Text style={styles.dropdownText}>
                            {graduationYear}
                        </Text>
                        <Ionicons
                            name={
                                showYearDropdown
                                    ? 'chevron-up'
                                    : 'chevron-down'
                            }
                            size={16}
                            color={FEED_COLORS.textSecondary}
                        />
                    </Pressable>
                    {showYearDropdown && (
                        <View style={styles.dropdownMenu}>
                            {GRADUATION_YEARS.map((year) => (
                                <Pressable
                                    key={year}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setGraduationYear(year);
                                        setShowYearDropdown(false);
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
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: FEED_COLORS.surface,
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
        backgroundColor: FEED_COLORS.border,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    cancelButton: {
        fontSize: 16,
        color: FEED_COLORS.textSecondary,
        fontWeight: '400',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: FEED_COLORS.textPrimary,
    },
    saveButton: {
        backgroundColor: FEED_COLORS.favor,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: FEED_COLORS.bg,
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
        color: FEED_COLORS.textSecondary,
        letterSpacing: 1.5,
    },
    fieldCounter: {
        fontSize: 11,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
    },
    textInput: {
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: FEED_COLORS.textPrimary,
        minHeight: 52,
    },
    bioInput: {
        minHeight: 80,
        marginBottom: 6,
    },
    helperText: {
        fontSize: 11,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
        marginTop: 6,
        marginLeft: 10,
    },
    dropdownButton: {
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        borderRadius: 14,
        minHeight: 52,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
        flex: 1,
    },
    dropdownMenu: {
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
        borderRadius: 14,
        marginTop: 8,
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: FEED_COLORS.border,
    },
    dropdownItemText: {
        fontSize: 14,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
    },
    selectedItem: {
        color: FEED_COLORS.favor,
        fontWeight: '600',
    },
    nudgeCard: {
        backgroundColor: 'rgba(0, 245, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(0, 245, 255, 0.15)',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nudgeAvatarContainer: {
        backgroundColor: FEED_COLORS.surface2,
        borderWidth: 1,
        borderColor: FEED_COLORS.border,
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
        color: FEED_COLORS.textPrimary,
        marginBottom: 2,
    },
    nudgeDescription: {
        fontSize: 12,
        fontWeight: '400',
        color: FEED_COLORS.textSecondary,
    },
    shopLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    shopLinkText: {
        fontSize: 12,
        fontWeight: '600',
        color: FEED_COLORS.favor,
    },
});