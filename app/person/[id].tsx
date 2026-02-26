// Person detail — shows a person's info and interaction history
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Avatar, Badge, Card } from '../../src/components/ui';
import {
    CLOSENESS_LABELS,
    INTERACTION_TYPE_META,
    RELATIONSHIP_TYPE_META,
} from '../../src/constants';
import { useInteractionsStore, usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../../src/theme/tokens';
import type { InteractionWithPeople } from '../../src/types';

export default function PersonDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const getPersonById = usePeopleStore((s) => s.getPersonById);
    const deletePerson = usePeopleStore((s) => s.deletePerson);
    const fetchInteractionsForPerson = useInteractionsStore(
        (s) => s.fetchInteractionsForPerson
    );

    const person = getPersonById(id);
    const [interactions, setInteractions] = useState<InteractionWithPeople[]>([]);

    useEffect(() => {
        if (id) {
            fetchInteractionsForPerson(id).then(setInteractions);
        }
    }, [id]);

    if (!person) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Person not found</Text>
            </View>
        );
    }

    const relMeta = RELATIONSHIP_TYPE_META[person.relationship_type];

    const handleDelete = () => {
        const doDelete = async () => {
            const success = await deletePerson(person.id);
            if (success) {
                router.back();
            } else {
                const msg = usePeopleStore.getState().error || 'Delete failed';
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Error', msg);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete ${person.name}? This will also remove their interaction history.`)) {
                doDelete();
            }
        } else {
            Alert.alert(
                'Delete Contact',
                `Are you sure you want to delete ${person.name}? This will also remove their interaction history.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: person.name }} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
            >
                {/* Profile header */}
                <View style={styles.profileHeader}>
                    <Avatar name={person.name} uri={person.avatar_url} size={80} />
                    <Text style={styles.profileName}>{person.name}</Text>
                    {person.nickname && (
                        <Text style={styles.profileNickname}>"{person.nickname}"</Text>
                    )}
                    <View style={styles.profileBadges}>
                        <Badge label={relMeta.label} color={relMeta.color} />
                        <Badge
                            label={CLOSENESS_LABELS[person.closeness_level]}
                            color={Colors.primary}
                        />
                    </View>
                </View>

                {/* Contact info */}
                <Card style={styles.infoCard}>
                    {person.phone && (
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color={Colors.textTertiary} />
                            <Text style={styles.infoText}>{person.phone}</Text>
                        </View>
                    )}
                    {person.email && (
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
                            <Text style={styles.infoText}>{person.email}</Text>
                        </View>
                    )}
                    {person.birthday && (
                        <View style={styles.infoRow}>
                            <Ionicons name="gift-outline" size={18} color={Colors.textTertiary} />
                            <Text style={styles.infoText}>
                                {new Date(person.birthday).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    )}
                    {person.notes && (
                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>Notes</Text>
                            <Text style={styles.notesText}>{person.notes}</Text>
                        </View>
                    )}
                </Card>

                {/* Edit button */}
                <Pressable
                    style={styles.editButton}
                    onPress={() => router.push(`/person/edit?id=${person.id}` as any)}
                >
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                    <Text style={styles.editButtonText}>Edit Contact</Text>
                </Pressable>

                {/* Interaction history */}
                <Text style={styles.sectionTitle}>
                    Interaction History ({interactions.length})
                </Text>
                {interactions.length > 0 ? (
                    interactions.map((interaction) => {
                        const meta = INTERACTION_TYPE_META[interaction.type];
                        return (
                            <Card key={interaction.id} style={styles.interactionItem}>
                                <View style={styles.interactionRow}>
                                    <View
                                        style={[
                                            styles.interactionIcon,
                                            { backgroundColor: `${meta.color}20` },
                                        ]}
                                    >
                                        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                                    </View>
                                    <View style={styles.interactionContent}>
                                        <Text style={styles.interactionTitle}>
                                            {interaction.title}
                                        </Text>
                                        <Text style={styles.interactionDate}>
                                            {new Date(interaction.occurred_at).toLocaleDateString(
                                                'en-US',
                                                { month: 'short', day: 'numeric', year: 'numeric' }
                                            )}
                                        </Text>
                                    </View>
                                    <View style={styles.qualityDots}>
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <View
                                                key={level}
                                                style={[
                                                    styles.dot,
                                                    level <= interaction.sentiment && styles.dotActive,
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </View>
                                {interaction.notes && (
                                    <Text style={styles.interactionNotes} numberOfLines={2}>
                                        {interaction.notes}
                                    </Text>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <View style={styles.noInteractions}>
                        <Text style={styles.noInteractionsText}>
                            No interactions recorded yet
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <Pressable style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    <Text style={styles.deleteButtonText}>Delete Contact</Text>
                </Pressable>
            </ScrollView>

            {/* FAB — Quick log interaction */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    pressed && styles.fabPressed,
                ]}
                onPress={() => router.push('/interaction/new' as any)}
            >
                <Ionicons name="add" size={28} color={Colors.white} />
            </Pressable>
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
        paddingBottom: 100,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 100,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    profileName: {
        color: Colors.textPrimary,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        marginTop: Spacing.lg,
    },
    profileNickname: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    profileBadges: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    infoCard: {
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    infoText: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
    },
    notesSection: {
        marginTop: Spacing.sm,
    },
    notesLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.xs,
    },
    notesText: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        lineHeight: 22,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    interactionItem: {
        marginBottom: Spacing.sm,
    },
    interactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    interactionIcon: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    interactionContent: {
        flex: 1,
    },
    interactionTitle: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    interactionDate: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    qualityDots: {
        flexDirection: 'row',
        gap: 3,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.surfaceBorder,
    },
    dotActive: {
        backgroundColor: Colors.primary,
    },
    interactionNotes: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginTop: Spacing.sm,
        lineHeight: 20,
    },
    noInteractions: {
        paddingVertical: Spacing.xxl,
        alignItems: 'center',
    },
    noInteractionsText: {
        color: Colors.textTertiary,
        fontSize: FontSize.md,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.xl,
        backgroundColor: `${Colors.primary}10`,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: `${Colors.primary}30`,
    },
    editButtonText: {
        color: Colors.primary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.xxl,
    },
    deleteButtonText: {
        color: Colors.error,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
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
