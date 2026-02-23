// Reminders list — view and manage scheduled interaction reminders
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Avatar, Badge, Card } from '../src/components/ui';
import { useRemindersStore } from '../src/stores';
import type { ReminderWithPerson } from '../src/stores/remindersStore';
import { Colors, FontSize, FontWeight, Shadow, Spacing } from '../src/theme/tokens';

const FREQUENCY_LABELS: Record<string, string> = {
    'one-time': 'One-time',
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
};

function formatDueDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueColor(dateStr: string): string {
    const diffMs = new Date(dateStr).getTime() - Date.now();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays < 0) return Colors.error;
    if (diffDays <= 1) return Colors.warning;
    if (diffDays <= 7) return Colors.accent;
    return Colors.textTertiary;
}

function ReminderCard({ reminder }: { reminder: ReminderWithPerson }) {
    const { toggleReminder, deleteReminder } = useRemindersStore();

    const handleDelete = () => {
        Alert.alert(
            'Delete Reminder',
            `Remove reminder "${reminder.message}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteReminder(reminder.id),
                },
            ]
        );
    };

    const dueColor = getDueColor(reminder.next_due_at);

    return (
        <Card style={{ ...styles.reminderCard, ...(!reminder.is_active ? styles.inactiveCard : {}) }}>
            <View style={styles.cardRow}>
                {reminder.person && (
                    <Avatar name={reminder.person.name} uri={reminder.person.avatar_url} size={40} />
                )}
                <View style={styles.cardContent}>
                    <Text style={[styles.message, !reminder.is_active && styles.inactiveText]}>
                        {reminder.message}
                    </Text>
                    <View style={styles.metaRow}>
                        {reminder.person && (
                            <Text style={styles.personName}>{reminder.person.name}</Text>
                        )}
                        <Badge
                            label={FREQUENCY_LABELS[reminder.frequency] ?? reminder.frequency}
                            color={Colors.primary}
                            size="sm"
                        />
                    </View>
                    <Text style={[styles.dueDate, { color: dueColor }]}>
                        {formatDueDate(reminder.next_due_at)}
                    </Text>
                </View>
                <View style={styles.actions}>
                    <Pressable
                        style={styles.actionButton}
                        onPress={() => toggleReminder(reminder.id)}
                    >
                        <Ionicons
                            name={reminder.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                            size={24}
                            color={reminder.is_active ? Colors.textSecondary : Colors.success}
                        />
                    </Pressable>
                    <Pressable style={styles.actionButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </Pressable>
                </View>
            </View>
        </Card>
    );
}

export default function RemindersScreen() {
    const router = useRouter();
    const { reminders, isLoading, fetchReminders } = useRemindersStore();

    useEffect(() => {
        fetchReminders();
    }, []);

    const sections = useMemo(() => {
        const now = Date.now();
        const weekFromNow = now + 7 * 86_400_000;

        const overdue: ReminderWithPerson[] = [];
        const dueSoon: ReminderWithPerson[] = [];
        const upcoming: ReminderWithPerson[] = [];
        const paused: ReminderWithPerson[] = [];

        reminders.forEach((r) => {
            if (!r.is_active) {
                paused.push(r);
            } else {
                const dueTime = new Date(r.next_due_at).getTime();
                if (dueTime < now) overdue.push(r);
                else if (dueTime <= weekFromNow) dueSoon.push(r);
                else upcoming.push(r);
            }
        });

        return { overdue, dueSoon, upcoming, paused };
    }, [reminders]);

    const allSections = [
        ...(sections.overdue.length > 0 ? [{ title: '🔴 Overdue', data: sections.overdue }] : []),
        ...(sections.dueSoon.length > 0 ? [{ title: '⏰ Due Soon', data: sections.dueSoon }] : []),
        ...(sections.upcoming.length > 0 ? [{ title: '📅 Upcoming', data: sections.upcoming }] : []),
        ...(sections.paused.length > 0 ? [{ title: '⏸ Paused', data: sections.paused }] : []),
    ];

    return (
        <View style={styles.container}>
            <FlatList
                data={allSections}
                keyExtractor={(section, i) => section.title + i}
                renderItem={({ item: section }) => (
                    <View>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.data.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} />
                        ))}
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No reminders</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap + to create your first reminder
                        </Text>
                    </View>
                }
            />

            {/* FAB — New reminder */}
            <Pressable
                style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                onPress={() => router.push('/reminder/new' as any)}
            >
                <Ionicons name="add" size={28} color={Colors.white} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    reminderCard: {
        marginBottom: Spacing.sm,
    },
    inactiveCard: {
        opacity: 0.5,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    message: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    inactiveText: {
        textDecorationLine: 'line-through',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 4,
    },
    personName: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
    },
    dueDate: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginLeft: Spacing.sm,
    },
    actionButton: {
        padding: Spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        color: Colors.textPrimary,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.semibold,
        marginTop: Spacing.xl,
    },
    emptySubtitle: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.lg,
        ...Shadow.glow(Colors.primary),
    },
    fabPressed: {
        transform: [{ scale: 0.92 }],
        opacity: 0.9,
    },
});
