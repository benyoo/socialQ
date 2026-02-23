// New Reminder — form for creating a scheduled interaction reminder
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Avatar, Button } from '../../src/components/ui';
import { usePeopleStore, useRemindersStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { ReminderFrequency } from '../../src/types';

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string; icon: string }[] = [
    { value: 'one-time', label: 'One-time', icon: 'calendar-outline' },
    { value: 'weekly', label: 'Weekly', icon: 'repeat' },
    { value: 'biweekly', label: 'Biweekly', icon: 'swap-horizontal' },
    { value: 'monthly', label: 'Monthly', icon: 'calendar' },
    { value: 'quarterly', label: 'Quarterly', icon: 'time-outline' },
];

export default function NewReminderScreen() {
    const router = useRouter();
    const { people, fetchPeople } = usePeopleStore();
    const { addReminder } = useRemindersStore();

    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [frequency, setFrequency] = useState<ReminderFrequency>('monthly');
    const [daysFromNow, setDaysFromNow] = useState('7');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [personSearch, setPersonSearch] = useState('');

    useEffect(() => {
        fetchPeople();
    }, []);

    const filteredPeople = personSearch
        ? people.filter((p) => p.name.toLowerCase().includes(personSearch.toLowerCase()))
        : people.slice(0, 10);

    const selectedPerson = people.find((p) => p.id === selectedPersonId);

    const handleSubmit = async () => {
        if (!selectedPersonId) {
            Alert.alert('Required', 'Please select a person');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Required', 'Please enter a message');
            return;
        }

        const days = parseInt(daysFromNow, 10) || 7;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        setIsSubmitting(true);
        const result = await addReminder({
            person_id: selectedPersonId,
            message: message.trim(),
            frequency,
            next_due_at: dueDate.toISOString(),
        });

        setIsSubmitting(false);
        if (result) {
            router.back();
        } else {
            Alert.alert('Error', 'Failed to create reminder. Please try again.');
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'New Reminder' }} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Person selection */}
                <Text style={styles.label}>Who is this reminder for?</Text>
                {selectedPerson ? (
                    <Pressable
                        style={styles.selectedPerson}
                        onPress={() => setSelectedPersonId(null)}
                    >
                        <Avatar name={selectedPerson.name} size={32} />
                        <Text style={styles.selectedPersonName}>{selectedPerson.name}</Text>
                        <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                    </Pressable>
                ) : (
                    <>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={16} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search people..."
                                placeholderTextColor={Colors.textTertiary}
                                value={personSearch}
                                onChangeText={setPersonSearch}
                                selectionColor={Colors.primary}
                            />
                        </View>
                        <View style={styles.personList}>
                            {filteredPeople.map((person) => (
                                <Pressable
                                    key={person.id}
                                    style={styles.personOption}
                                    onPress={() => {
                                        setSelectedPersonId(person.id);
                                        setPersonSearch('');
                                    }}
                                >
                                    <Avatar name={person.name} size={28} />
                                    <Text style={styles.personOptionName}>{person.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </>
                )}

                {/* Message */}
                <Text style={styles.label}>Reminder message</Text>
                <TextInput
                    style={styles.messageInput}
                    placeholder="e.g. Catch up over coffee"
                    placeholderTextColor={Colors.textTertiary}
                    value={message}
                    onChangeText={setMessage}
                    selectionColor={Colors.primary}
                    multiline
                />

                {/* Frequency */}
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.frequencyRow}>
                    {FREQUENCY_OPTIONS.map((opt) => {
                        const isActive = frequency === opt.value;
                        return (
                            <Pressable
                                key={opt.value}
                                style={[styles.frequencyChip, isActive && styles.frequencyChipActive]}
                                onPress={() => setFrequency(opt.value)}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={14}
                                    color={isActive ? Colors.primary : Colors.textTertiary}
                                />
                                <Text style={[styles.frequencyText, isActive && styles.frequencyTextActive]}>
                                    {opt.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Due in N days */}
                <Text style={styles.label}>First due in (days)</Text>
                <View style={styles.daysRow}>
                    {['1', '3', '7', '14', '30'].map((d) => (
                        <Pressable
                            key={d}
                            style={[styles.dayChip, daysFromNow === d && styles.dayChipActive]}
                            onPress={() => setDaysFromNow(d)}
                        >
                            <Text style={[styles.dayText, daysFromNow === d && styles.dayTextActive]}>
                                {d}
                            </Text>
                        </Pressable>
                    ))}
                    <TextInput
                        style={styles.customDayInput}
                        value={daysFromNow}
                        onChangeText={setDaysFromNow}
                        keyboardType="number-pad"
                        selectionColor={Colors.primary}
                        maxLength={3}
                    />
                </View>

                <Button
                    title="Create Reminder"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={!selectedPersonId || !message.trim()}
                    style={styles.submitButton}
                    size="lg"
                />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    // Person selection
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    searchInput: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        marginLeft: Spacing.sm,
    },
    personList: {
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    personOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
    },
    personOptionName: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
    },
    selectedPerson: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: `${Colors.primary}15`,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
    },
    selectedPersonName: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    // Message
    messageInput: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    // Frequency
    frequencyRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    frequencyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    frequencyChipActive: {
        backgroundColor: `${Colors.primary}20`,
        borderColor: Colors.primary,
    },
    frequencyText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    frequencyTextActive: {
        color: Colors.primary,
    },
    // Days
    daysRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    dayChip: {
        width: 40,
        height: 32,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayChipActive: {
        backgroundColor: `${Colors.accent}20`,
        borderColor: Colors.accent,
    },
    dayText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    dayTextActive: {
        color: Colors.accent,
    },
    customDayInput: {
        width: 50,
        height: 32,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    submitButton: {
        marginTop: Spacing.xxl,
    },
});
