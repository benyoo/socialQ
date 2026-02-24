// Log Interaction — single natural language input with smart extraction
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { PeoplePicker } from '../../src/components/PeoplePicker';
import { Avatar } from '../../src/components/ui';
import { INTERACTION_TYPE_META, QUALITY_LABELS } from '../../src/constants';
import { parseLogEntry } from '../../src/services/logParser';
import { useInteractionsStore, usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { InteractionType, QualityRating } from '../../src/types';
import type { ParsedLogEntry } from '../../src/types/parsed';

const INTERACTION_TYPES: InteractionType[] = [
    'in-person', 'call', 'text', 'video', 'social-media', 'email',
];

export default function NewInteractionScreen() {
    const router = useRouter();
    const addInteraction = useInteractionsStore((s) => s.addInteraction);
    const people = usePeopleStore((s) => s.people);
    const quickAddPerson = usePeopleStore((s) => s.quickAddPerson);

    const [text, setText] = useState('');
    const [quality, setQuality] = useState<QualityRating>(3);
    const [typeOverride, setTypeOverride] = useState<InteractionType | null>(null);
    const [addedPeopleIds, setAddedPeopleIds] = useState<string[]>([]);
    const [resolvedAmbiguous, setResolvedAmbiguous] = useState<Record<string, string>>({}); // name -> chosen person id
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parse the text input in real-time
    const parsed: ParsedLogEntry = useMemo(
        () => parseLogEntry(text, people),
        [text, people]
    );

    // Effective type: user override > parser inference > default
    const effectiveType = typeOverride ?? parsed.inferredType ?? 'in-person';

    // All person IDs: matched from text + manually added + resolved ambiguous
    const allPersonIds = useMemo(() => {
        const ids = new Set(parsed.matchedPeople.map((p) => p.id));
        addedPeopleIds.forEach((id) => ids.add(id));
        Object.values(resolvedAmbiguous).forEach((id) => ids.add(id));
        return [...ids];
    }, [parsed.matchedPeople, addedPeopleIds, resolvedAmbiguous]);

    const handleAddUnmatchedPerson = useCallback(async (name: string) => {
        const person = await quickAddPerson(name);
        if (person) {
            setAddedPeopleIds((prev) => [...prev, person.id]);
        }
    }, [quickAddPerson]);

    const handleRemovePerson = useCallback((personId: string) => {
        setAddedPeopleIds((prev) => prev.filter((id) => id !== personId));
    }, []);

    const handleResolveAmbiguous = useCallback((firstName: string, personId: string) => {
        setResolvedAmbiguous((prev) => ({ ...prev, [firstName]: personId }));
    }, []);

    const handleSubmit = async () => {
        if (!text.trim()) {
            Alert.alert('Required', 'Describe what happened');
            return;
        }

        setIsSubmitting(true);

        try {
            // Auto-create any unmatched people mentioned in the text
            const autoCreatedIds: string[] = [];
            for (const name of parsed.unmatchedNames) {
                // Skip if already manually added during this session
                if (addedPeopleIds.some((id) => {
                    const person = people.find((p) => p.id === id);
                    return person?.name.toLowerCase() === name.toLowerCase();
                })) continue;

                const person = await quickAddPerson(name);
                if (person) {
                    autoCreatedIds.push(person.id);
                }
            }

            // Combine all person IDs: matched + manually added + auto-created
            const finalPersonIds = [...new Set([...allPersonIds, ...autoCreatedIds])];

            const interaction = await addInteraction({
                type: effectiveType,
                title: parsed.title,
                notes: parsed.notes,
                quality,
                location: parsed.location ?? undefined,
                occurred_at: parsed.occurredAt.toISOString(),
                person_ids: finalPersonIds,
            });

            setIsSubmitting(false);

            if (interaction) {
                router.back();
            } else {
                const storeError = useInteractionsStore.getState().error;
                const msg = storeError || 'Failed to save. Check Supabase config and database tables.';
                Alert.alert('Error', msg);
            }
        } catch (err) {
            console.error('Error submitting interaction:', err);
            setIsSubmitting(false);
            Alert.alert('Error', String(err));
        }
    };

    const hasContent = text.trim().length > 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Hero text input */}
            <View style={styles.heroInputContainer}>
                <TextInput
                    style={styles.heroInput}
                    placeholder={"What happened?\ne.g. Had coffee with Sarah yesterday"}
                    placeholderTextColor={Colors.textTertiary}
                    value={text}
                    onChangeText={setText}
                    multiline
                    autoFocus
                    selectionColor={Colors.primary}
                    textAlignVertical="top"
                />
            </View>

            {/* Extraction preview — only shows when there's content */}
            {hasContent && (
                <View style={styles.extractionPreview}>
                    <Text style={styles.previewLabel}>Detected</Text>

                    {/* Matched people */}
                    {parsed.matchedPeople.length > 0 && (
                        <View style={styles.extractionRow}>
                            <Ionicons name="people" size={16} color={Colors.primary} />
                            <View style={styles.chipRow}>
                                {parsed.matchedPeople.map((person) => (
                                    <View key={person.id} style={styles.personChip}>
                                        <Avatar name={person.name} size={20} />
                                        <Text style={styles.personChipText}>{person.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Unmatched names — offer to add */}
                    {parsed.unmatchedNames.length > 0 && (
                        <View style={styles.extractionRow}>
                            <Ionicons name="person-add" size={16} color={Colors.accent} />
                            <View style={styles.chipRow}>
                                {parsed.unmatchedNames.map((name) => {
                                    // Check if already added
                                    const alreadyAdded = people.some(
                                        (p) => p.name.toLowerCase() === name.toLowerCase()
                                            && addedPeopleIds.includes(p.id)
                                    );
                                    return (
                                        <Pressable
                                            key={name}
                                            style={[
                                                styles.unmatchedChip,
                                                alreadyAdded && styles.unmatchedChipAdded,
                                            ]}
                                            onPress={() => !alreadyAdded && handleAddUnmatchedPerson(name)}
                                        >
                                            <Text style={styles.unmatchedChipText}>
                                                {alreadyAdded ? '✓ ' : '+ '}{name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Ambiguous first-name matches — ask user to pick */}
                    {parsed.ambiguousMatches.length > 0 && parsed.ambiguousMatches.map((match) => {
                        const chosen = resolvedAmbiguous[match.name];
                        return (
                            <View key={match.name} style={styles.ambiguousSection}>
                                <View style={styles.extractionRow}>
                                    <Ionicons name="help-circle" size={16} color={Colors.warning} />
                                    <Text style={styles.extractionText}>
                                        Which <Text style={{ fontWeight: '700' }}>{match.name}</Text>?
                                    </Text>
                                </View>
                                <View style={styles.chipRow}>
                                    {match.candidates.map((person) => {
                                        const isChosen = chosen === person.id;
                                        return (
                                            <Pressable
                                                key={person.id}
                                                style={[
                                                    styles.ambiguousChip,
                                                    isChosen && styles.ambiguousChipSelected,
                                                ]}
                                                onPress={() => handleResolveAmbiguous(match.name, person.id)}
                                            >
                                                <Avatar name={person.name} size={20} />
                                                <Text style={[
                                                    styles.ambiguousChipText,
                                                    isChosen && styles.ambiguousChipTextSelected,
                                                ]}>
                                                    {person.name}
                                                </Text>
                                                {isChosen && (
                                                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}

                    {/* Parsed date */}
                    {parsed.dateSource && (
                        <View style={styles.extractionRow}>
                            <Ionicons name="time" size={16} color={Colors.success} />
                            <Text style={styles.extractionText}>
                                {parsed.occurredAt.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </Text>
                            <Text style={styles.extractionSource}>
                                from "{parsed.dateSource}"
                            </Text>
                        </View>
                    )}

                    {/* Location */}
                    {parsed.location && (
                        <View style={styles.extractionRow}>
                            <Ionicons name="location" size={16} color={Colors.warning} />
                            <Text style={styles.extractionText}>{parsed.location}</Text>
                        </View>
                    )}

                    {/* Inferred type */}
                    {parsed.inferredType && !typeOverride && (
                        <View style={styles.extractionRow}>
                            <Ionicons
                                name={INTERACTION_TYPE_META[parsed.inferredType].icon as any}
                                size={16}
                                color={INTERACTION_TYPE_META[parsed.inferredType].color}
                            />
                            <Text style={styles.extractionText}>
                                {INTERACTION_TYPE_META[parsed.inferredType].label}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Manual people picker */}
            {hasContent && (
                <>
                    <Text style={styles.sectionLabel}>People</Text>
                    <PeoplePicker
                        selectedIds={allPersonIds}
                        onToggle={(personId) => {
                            if (addedPeopleIds.includes(personId)) {
                                handleRemovePerson(personId);
                            } else {
                                setAddedPeopleIds((prev) => [...prev, personId]);
                            }
                        }}
                    />
                </>
            )}

            {/* Interaction type — compact pills */}
            {hasContent && (
                <>
                    <Text style={styles.sectionLabel}>Type</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.typePillRow}
                    >
                        {INTERACTION_TYPES.map((t) => {
                            const meta = INTERACTION_TYPE_META[t];
                            const isActive = effectiveType === t;
                            return (
                                <Pressable
                                    key={t}
                                    style={[
                                        styles.typePill,
                                        isActive && {
                                            backgroundColor: `${meta.color}20`,
                                            borderColor: meta.color,
                                        },
                                    ]}
                                    onPress={() => setTypeOverride(t)}
                                >
                                    <Ionicons
                                        name={meta.icon as any}
                                        size={14}
                                        color={isActive ? meta.color : Colors.textTertiary}
                                    />
                                    <Text
                                        style={[
                                            styles.typePillText,
                                            isActive && { color: meta.color },
                                        ]}
                                    >
                                        {meta.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </>
            )}

            {/* Quality rating */}
            {hasContent && (
                <>
                    <Text style={styles.sectionLabel}>How was it?</Text>
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
                </>
            )}

            {/* Submit */}
            <Pressable
                onPress={() => {
                    console.log('[LOG] Submit button pressed!');
                    handleSubmit();
                }}
                disabled={!text.trim() || isSubmitting}
                style={[styles.submitButton, styles.submitPressable, (!text.trim() || isSubmitting) && { opacity: 0.5 }]}
            >
                <Text style={styles.submitText}>
                    {isSubmitting ? 'Saving...' : 'Log it ✓'}
                </Text>
            </Pressable>
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
    heroInputContainer: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        padding: Spacing.lg,
        minHeight: 140,
        marginBottom: Spacing.lg,
    },
    heroInput: {
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        lineHeight: 26,
        minHeight: 110,
        textAlignVertical: 'top',
    },
    extractionPreview: {
        backgroundColor: `${Colors.primary}08`,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: `${Colors.primary}20`,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    previewLabel: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.xxs,
    },
    extractionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    extractionText: {
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
    },
    extractionSource: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        fontStyle: 'italic',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        flex: 1,
    },
    personChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: `${Colors.primary}15`,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.xxs + 1,
        paddingHorizontal: Spacing.sm,
    },
    personChipText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    unmatchedChip: {
        backgroundColor: `${Colors.accent}15`,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.xxs + 1,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: `${Colors.accent}30`,
    },
    unmatchedChipAdded: {
        backgroundColor: `${Colors.success}15`,
        borderColor: `${Colors.success}30`,
    },
    unmatchedChipText: {
        color: Colors.accent,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xxs,
    },
    typePillRow: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
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
        marginTop: Spacing.md,
    },
    submitPressable: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    submitText: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    ambiguousSection: {
        marginTop: Spacing.xs,
        marginLeft: Spacing.xl,
    },
    ambiguousChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: `${Colors.warning}12`,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.xxs + 1,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: `${Colors.warning}30`,
    },
    ambiguousChipSelected: {
        backgroundColor: `${Colors.success}15`,
        borderColor: `${Colors.success}50`,
    },
    ambiguousChipText: {
        color: Colors.warning,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    ambiguousChipTextSelected: {
        color: Colors.success,
    },
});
