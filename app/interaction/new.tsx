// Log Interaction modal — form to record a new social interaction
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Avatar, Button, Input } from '../../src/components/ui';
import { INTERACTION_TYPE_META, QUALITY_LABELS } from '../../src/constants';
import { useInteractionsStore, usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { InteractionType, QualityRating } from '../../src/types';

const INTERACTION_TYPES: InteractionType[] = [
    'in-person',
    'call',
    'text',
    'video',
    'social-media',
    'email',
];

export default function NewInteractionScreen() {
    const router = useRouter();
    const addInteraction = useInteractionsStore((s) => s.addInteraction);
    const people = usePeopleStore((s) => s.people);

    const [type, setType] = useState<InteractionType>('in-person');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [quality, setQuality] = useState<QualityRating>(3);
    const [location, setLocation] = useState('');
    const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPeopleSelector, setShowPeopleSelector] = useState(false);

    const togglePerson = (personId: string) => {
        setSelectedPeopleIds((prev) =>
            prev.includes(personId)
                ? prev.filter((id) => id !== personId)
                : [...prev, personId]
        );
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a title for this interaction');
            return;
        }

        setIsSubmitting(true);
        const interaction = await addInteraction({
            type,
            title: title.trim(),
            notes: notes.trim() || undefined,
            quality,
            location: location.trim() || undefined,
            occurred_at: new Date().toISOString(),
            person_ids: selectedPeopleIds,
        });

        setIsSubmitting(false);
        if (interaction) {
            router.back();
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Interaction type selector */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeGrid}>
                {INTERACTION_TYPES.map((t) => {
                    const meta = INTERACTION_TYPE_META[t];
                    const isActive = type === t;
                    return (
                        <Pressable
                            key={t}
                            style={[
                                styles.typeCard,
                                isActive && {
                                    backgroundColor: `${meta.color}15`,
                                    borderColor: meta.color,
                                },
                            ]}
                            onPress={() => setType(t)}
                        >
                            <Ionicons
                                name={meta.icon as any}
                                size={22}
                                color={isActive ? meta.color : Colors.textTertiary}
                            />
                            <Text
                                style={[
                                    styles.typeLabel,
                                    isActive && { color: meta.color },
                                ]}
                            >
                                {meta.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Input
                label="Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Coffee with Sarah, Team standup"
            />

            {/* People selector */}
            <Text style={styles.label}>Who was involved?</Text>
            <Pressable
                style={styles.peopleSelectorToggle}
                onPress={() => setShowPeopleSelector(!showPeopleSelector)}
            >
                {selectedPeopleIds.length > 0 ? (
                    <View style={styles.selectedPeopleRow}>
                        {selectedPeopleIds.slice(0, 3).map((id) => {
                            const person = people.find((p) => p.id === id);
                            return person ? (
                                <Avatar key={id} name={person.name} size={28} />
                            ) : null;
                        })}
                        <Text style={styles.selectedCount}>
                            {selectedPeopleIds.length} selected
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.placeholderText}>Tap to select people</Text>
                )}
                <Ionicons
                    name={showPeopleSelector ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.textTertiary}
                />
            </Pressable>

            {showPeopleSelector && (
                <View style={styles.peopleList}>
                    {people.map((person) => {
                        const isSelected = selectedPeopleIds.includes(person.id);
                        return (
                            <Pressable
                                key={person.id}
                                style={[
                                    styles.personOption,
                                    isSelected && styles.personOptionSelected,
                                ]}
                                onPress={() => togglePerson(person.id)}
                            >
                                <Avatar name={person.name} size={32} />
                                <Text style={styles.personOptionName}>{person.name}</Text>
                                {isSelected && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={20}
                                        color={Colors.primary}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                    {people.length === 0 && (
                        <Text style={styles.noPeopleText}>
                            No people added yet. Add people first from the People tab.
                        </Text>
                    )}
                </View>
            )}

            {/* Quality rating */}
            <Text style={styles.label}>How was it?</Text>
            <View style={styles.qualityRow}>
                {([1, 2, 3, 4, 5] as QualityRating[]).map((level) => {
                    const isActive = quality >= level;
                    return (
                        <Pressable
                            key={level}
                            style={styles.qualityItem}
                            onPress={() => setQuality(level)}
                        >
                            <Ionicons
                                name={isActive ? 'star' : 'star-outline'}
                                size={28}
                                color={isActive ? Colors.warning : Colors.textTertiary}
                            />
                        </Pressable>
                    );
                })}
                <Text style={styles.qualityLabel}>{QUALITY_LABELS[quality]}</Text>
            </View>

            <Input
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Where did this happen?"
            />

            <Input
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="What did you talk about? How did it feel?"
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
            />

            <Button
                title="Log Interaction"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={!title.trim()}
                style={styles.submitButton}
                size="lg"
            />
        </ScrollView>
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
        marginLeft: Spacing.xxs,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    typeCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        minWidth: '30%',
        flex: 1,
        gap: Spacing.xs,
    },
    typeLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
    peopleSelectorToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    selectedPeopleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: -4,
    },
    selectedCount: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm + 4,
    },
    placeholderText: {
        color: Colors.textTertiary,
        fontSize: FontSize.md,
    },
    peopleList: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    personOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    personOptionSelected: {
        backgroundColor: `${Colors.primary}10`,
    },
    personOptionName: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        flex: 1,
    },
    noPeopleText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        padding: Spacing.xl,
        textAlign: 'center',
    },
    qualityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    qualityItem: {
        padding: Spacing.xxs,
    },
    qualityLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
});
