// Settings screen — logout, account, notifications, reminders
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { Card } from '../src/components/ui';
import { useAuthStore } from '../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../src/theme/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuRowProps {
    icon: IoniconsName;
    iconColor?: string;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
}

function MenuRow({ icon, iconColor, label, subtitle, onPress, rightElement, destructive }: MenuRowProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && onPress && styles.menuRowPressed]}
            onPress={onPress}
            disabled={!onPress && !rightElement}
        >
            <View style={[styles.menuIcon, { backgroundColor: (iconColor ?? Colors.primary) + '20' }]}>
                <Ionicons name={icon} size={18} color={iconColor ?? Colors.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, destructive && styles.destructiveLabel]}>{label}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement ?? (
                onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} /> : null
            )}
        </Pressable>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [reminderNotifs, setReminderNotifs] = useState(true);

    const handleLogout = () => {
        const doLogout = async () => {
            await signOut();
            router.replace('/auth');
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to log out?')) {
                doLogout();
            }
        } else {
            Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: doLogout },
            ]);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Account */}
            <SectionHeader title="Account" />
            <Card>
                <MenuRow
                    icon="person-circle-outline"
                    iconColor={Colors.primary}
                    label={user?.email ?? 'Not signed in'}
                    subtitle="Signed in"
                />
                <View style={styles.divider} />
                <MenuRow
                    icon="key-outline"
                    iconColor={Colors.accent}
                    label="Change Password"
                    subtitle="Update your password"
                    onPress={() => {
                        // Placeholder — would open a password change flow
                        if (Platform.OS === 'web') {
                            window.alert('Password change coming soon');
                        } else {
                            Alert.alert('Coming Soon', 'Password change will be available in a future update.');
                        }
                    }}
                />
            </Card>

            {/* Notifications */}
            <SectionHeader title="Notifications" />
            <Card>
                <MenuRow
                    icon="notifications-outline"
                    iconColor={Colors.info}
                    label="Push Notifications"
                    subtitle="Get notified about activity"
                    rightElement={
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: Colors.surfaceLight, true: Colors.primaryLight }}
                            thumbColor={pushEnabled ? Colors.primary : Colors.textTertiary}
                        />
                    }
                />
                <View style={styles.divider} />
                <MenuRow
                    icon="alarm-outline"
                    iconColor={Colors.warning}
                    label="Reminder Alerts"
                    subtitle="Get reminded about due contacts"
                    rightElement={
                        <Switch
                            value={reminderNotifs}
                            onValueChange={setReminderNotifs}
                            trackColor={{ false: Colors.surfaceLight, true: Colors.primaryLight }}
                            thumbColor={reminderNotifs ? Colors.primary : Colors.textTertiary}
                        />
                    }
                />
            </Card>

            {/* Reminders */}
            <SectionHeader title="Reminders" />
            <Card>
                <MenuRow
                    icon="calendar-outline"
                    iconColor={Colors.accent}
                    label="Manage Reminders"
                    subtitle="View and create reminders"
                    onPress={() => router.push('/reminders' as any)}
                />
            </Card>

            {/* Log Out */}
            <View style={styles.logoutSection}>
                <Pressable
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
            </View>

            {/* Version */}
            <Text style={styles.version}>SocialQ v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    sectionHeader: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: Spacing.xxl,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    menuRowPressed: {
        opacity: 0.6,
    },
    menuIcon: {
        width: 34,
        height: 34,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    destructiveLabel: {
        color: Colors.error,
    },
    menuSubtitle: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        marginTop: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.surfaceBorder,
        marginLeft: 46,
    },
    logoutSection: {
        marginTop: Spacing.xxxl,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.error + '40',
        backgroundColor: Colors.error + '10',
    },
    logoutButtonPressed: {
        opacity: 0.7,
    },
    logoutText: {
        color: Colors.error,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    version: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        textAlign: 'center',
        marginTop: Spacing.xxl,
    },
});
