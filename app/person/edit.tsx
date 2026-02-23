// Edit Person — form pre-populated with existing person data
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button, Input } from '../../src/components/ui';
import { CLOSENESS_LABELS, RELATIONSHIP_TYPE_META } from '../../src/constants';
import { usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { ClosenessLevel, RelationshipType } from '../../src/types';

const RELATIONSHIP_TYPES: RelationshipType[] = [
    'family',
    'friend',
    'colleague',
    'acquaintance',
    'other',
];

export default function EditPersonScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const getPersonById = usePeopleStore((s) => s.getPersonById);
    const updatePerson = usePeopleStore((s) => s.updatePerson);

    const person = getPersonById(id);

    // Initialize form state from existing person
    const [name, setName] = useState(person?.name ?? '');
    const [nickname, setNickname] = useState(person?.nickname ?? '');
    const [phone, setPhone] = useState(person?.phone ?? '');
    const [email, setEmail] = useState(person?.email ?? '');
    const [relationshipType, setRelationshipType] = useState<RelationshipType>(
        person?.relationship_type ?? 'friend'
    );
    const [closenessLevel, setClosenessLevel] = useState<ClosenessLevel>(
        person?.closeness_level ?? 3
    );
    const [notes, setNotes] = useState(person?.notes ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!person) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Edit Person' }} />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Person not found</Text>
                </View>
            </View>
        );
    }

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter a name');
            return;
        }

        setIsSubmitting(true);
        const success = await updatePerson(person.id, {
            name: name.trim(),
            nickname: nickname.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            relationship_type: relationshipType,
            closeness_level: closenessLevel,
            notes: notes.trim() || undefined,
        });

        setIsSubmitting(false);
        if (success) {
            router.back();
        } else {
            Alert.alert('Error', 'Failed to update person. Please try again.');
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: `Edit ${person.name}` }} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Input
                    label="Name *"
                    value={name}
                    onChangeText={setName}
                    placeholder="Full name"
                    autoFocus
                />

                <Input
                    label="Nickname"
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="Optional nickname"
                />

                <Input
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                />

                <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {/* Relationship type selector */}
                <Text style={styles.label}>Relationship</Text>
                <View style={styles.chipGroup}>
                    {RELATIONSHIP_TYPES.map((type) => {
                        const meta = RELATIONSHIP_TYPE_META[type];
                        const isActive = relationshipType === type;
                        return (
                            <Pressable
                                key={type}
                                style={[
                                    styles.chip,
                                    isActive && { backgroundColor: `${meta.color}20`, borderColor: meta.color },
                                ]}
                                onPress={() => setRelationshipType(type)}
                            >
                                <Ionicons
                                    name={meta.icon as any}
                                    size={16}
                                    color={isActive ? meta.color : Colors.textTertiary}
                                />
                                <Text
                                    style={[
                                        styles.chipText,
                                        isActive && { color: meta.color },
                                    ]}
                                >
                                    {meta.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Closeness level */}
                <Text style={styles.label}>Closeness</Text>
                <View style={styles.closenessRow}>
                    {([1, 2, 3, 4, 5] as ClosenessLevel[]).map((level) => {
                        const isActive = closenessLevel >= level;
                        return (
                            <Pressable
                                key={level}
                                style={styles.closenessItem}
                                onPress={() => setClosenessLevel(level)}
                            >
                                <Ionicons
                                    name={isActive ? 'heart' : 'heart-outline'}
                                    size={24}
                                    color={isActive ? Colors.primary : Colors.textTertiary}
                                />
                            </Pressable>
                        );
                    })}
                    <Text style={styles.closenessLabel}>
                        {CLOSENESS_LABELS[closenessLevel]}
                    </Text>
                </View>

                <Input
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="How do you know this person?"
                    multiline
                    numberOfLines={3}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                <Button
                    title="Save Changes"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={!name.trim()}
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
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xxs,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    chipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    closenessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    closenessItem: {
        padding: Spacing.xs,
    },
    closenessLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
});
