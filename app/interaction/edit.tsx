// Edit Interaction — form to edit an existing interaction
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { PeoplePicker } from '../../src/components/PeoplePicker';
import { INTERACTION_TYPE_META, SENTIMENT_LABELS } from '../../src/constants';
import { useInteractionsStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { InteractionType, QualityRating } from '../../src/types';

const INTERACTION_TYPES: InteractionType[] = [
    'in-person', 'call', 'text', 'video', 'social-media', 'email',
];

export default function EditInteractionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const interactions = useInteractionsStore((s) => s.interactions);
    const updateInteraction = useInteractionsStore((s) => s.updateInteraction);

    const interaction = interactions.find((i) => i.id === id);

    // Local state initialized from existing interaction
    const [title, setTitle] = useState(interaction?.title ?? '');
    const [notes, setNotes] = useState(interaction?.notes ?? '');
    const [type, setType] = useState<InteractionType>(interaction?.type ?? 'in-person');
    const [sentiment, setSentiment] = useState<QualityRating>(interaction?.sentiment ?? 3);
    const [location, setLocation] = useState(interaction?.location ?? '');
    const [personIds, setPersonIds] = useState<string[]>(
        (interaction as any)?.people?.map((p: any) => p.id) ?? []
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!interaction) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Edit Interaction' }} />
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>Interaction not found</Text>
                </View>
            </View>
        );
    }

    const handleSave = async () => {
        if (!title.trim()) {
            const msg = 'Title is required';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Required', msg);
            return;
        }

        setIsSaving(true);
        const success = await updateInteraction(interaction.id, {
            title: title.trim(),
            notes: notes.trim() || undefined,
            type,
            sentiment,
            location: location.trim() || undefined,
            person_ids: personIds,
        });
        setIsSaving(false);

        if (success) {
            router.back();
        } else {
            const msg = useInteractionsStore.getState().error || 'Save failed';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Error', msg);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Edit Interaction' }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Title */}
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Interaction title"
                    placeholderTextColor={Colors.textTertiary}
                />

                {/* Notes */}
                <Text style={styles.label}>Notes</Text>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    textAlignVertical="top"
                />

                {/* People */}
                <Text style={styles.label}>People</Text>
                <PeoplePicker
                    selectedIds={personIds}
                    onToggle={(pid: string) => {
                        setPersonIds((prev) =>
                            prev.includes(pid)
                                ? prev.filter((x) => x !== pid)
                                : [...prev, pid]
                        );
                    }}
                />

                {/* Type */}
                <Text style={styles.label}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollRow}>
                    <View style={styles.typeRow}>
                        {INTERACTION_TYPES.map((t) => {
                            const meta = INTERACTION_TYPE_META[t];
                            const isSelected = t === type;
                            return (
                                <Pressable
                                    key={t}
                                    style={[
                                        styles.typePill,
                                        isSelected && { backgroundColor: `${meta.color}20`, borderColor: meta.color },
                                    ]}
                                    onPress={() => setType(t)}
                                >
                                    <Ionicons name={meta.icon as any} size={14} color={isSelected ? meta.color : Colors.textTertiary} />
                                    <Text style={[styles.typePillText, isSelected && { color: meta.color }]}>
                                        {meta.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Sentiment */}
                <Text style={styles.label}>Sentiment</Text>
                <View style={styles.qualityRow}>
                    {([1, 2, 3, 4, 5] as QualityRating[]).map((q) => (
                        <Pressable key={q} style={styles.qualityItem} onPress={() => setSentiment(q)}>
                            <Ionicons
                                name={q <= sentiment ? 'star' : 'star-outline'}
                                size={28}
                                color={q <= sentiment ? Colors.warning : Colors.textTertiary}
                            />
                        </Pressable>
                    ))}
                    <Text style={styles.qualityLabel}>
                        {SENTIMENT_LABELS[sentiment]}
                    </Text>
                </View>

                {/* Location */}
                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Where did this happen?"
                    placeholderTextColor={Colors.textTertiary}
                />

                {/* Save button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        pressed && styles.saveButtonPressed,
                        isSaving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </Pressable>
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
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        color: Colors.textTertiary,
        fontSize: FontSize.md,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xxs,
        marginTop: Spacing.lg,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        padding: Spacing.md,
    },
    notesInput: {
        minHeight: 100,
    },
    typeScrollRow: {
        marginBottom: Spacing.sm,
    },
    typeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingRight: Spacing.xl,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    typePillText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    qualityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    qualityItem: {
        padding: Spacing.xxs,
    },
    qualityLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.xxl,
    },
    saveButtonPressed: {
        opacity: 0.8,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveText: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
});
