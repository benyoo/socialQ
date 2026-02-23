// Interaction detail — shows full details of a logged interaction
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
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
    INTERACTION_TYPE_META,
    QUALITY_LABELS,
} from '../../src/constants';
import { useInteractionsStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function InteractionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const interactions = useInteractionsStore((s) => s.interactions);
    const deleteInteraction = useInteractionsStore((s) => s.deleteInteraction);

    const interaction = interactions.find((i) => i.id === id);

    if (!interaction) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Interaction' }} />
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>Interaction not found</Text>
                </View>
            </View>
        );
    }

    const meta = INTERACTION_TYPE_META[interaction.type];
    const qualityLabel = QUALITY_LABELS[interaction.quality];

    const handleDelete = () => {
        const doDelete = async () => {
            const success = await deleteInteraction(interaction.id);
            if (success) {
                router.back();
            } else {
                const msg = useInteractionsStore.getState().error || 'Delete failed';
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Error', msg);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this interaction? This cannot be undone.')) {
                doDelete();
            }
        } else {
            Alert.alert(
                'Delete Interaction',
                'Are you sure you want to delete this interaction? This cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: interaction.title }} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.typeIconLarge, { backgroundColor: `${meta.color}20` }]}>
                        <Ionicons name={meta.icon as any} size={32} color={meta.color} />
                    </View>
                    <Text style={styles.title}>{interaction.title}</Text>
                    <View style={styles.headerMeta}>
                        <Badge label={meta.label} color={meta.color} />
                        <Text style={styles.relativeTime}>
                            {formatRelativeTime(interaction.occurred_at)}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {interaction.notes && (
                    <Card style={styles.notesCard}>
                        <Text style={styles.sectionLabel}>Notes</Text>
                        <Text style={styles.notesText}>{interaction.notes}</Text>
                    </Card>
                )}

                {/* People */}
                {interaction.people.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                            People ({interaction.people.length})
                        </Text>
                        <View style={styles.peopleList}>
                            {interaction.people.map((person) => (
                                <Pressable
                                    key={person.id}
                                    style={styles.personChip}
                                    onPress={() => router.push(`/person/${person.id}` as any)}
                                >
                                    <Avatar name={person.name} size={32} />
                                    <Text style={styles.personName}>{person.name}</Text>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color={Colors.textTertiary}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Details card */}
                <Card style={styles.detailsCard}>
                    <Text style={styles.sectionLabel}>Details</Text>

                    {/* Date & Time */}
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={18} color={Colors.textTertiary} />
                        <Text style={styles.detailText}>
                            {formatDateTime(interaction.occurred_at)}
                        </Text>
                    </View>

                    {/* Location */}
                    {interaction.location && (
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={18} color={Colors.textTertiary} />
                            <Text style={styles.detailText}>{interaction.location}</Text>
                        </View>
                    )}

                    {/* Duration */}
                    {interaction.duration_minutes && (
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={18} color={Colors.textTertiary} />
                            <Text style={styles.detailText}>
                                {interaction.duration_minutes >= 60
                                    ? `${Math.floor(interaction.duration_minutes / 60)}h ${interaction.duration_minutes % 60}m`
                                    : `${interaction.duration_minutes} minutes`}
                            </Text>
                        </View>
                    )}

                    {/* Quality */}
                    <View style={styles.detailRow}>
                        <Ionicons name="star-outline" size={18} color={Colors.textTertiary} />
                        <View style={styles.qualityContainer}>
                            <View style={styles.qualityStars}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <Ionicons
                                        key={level}
                                        name={level <= interaction.quality ? 'star' : 'star-outline'}
                                        size={16}
                                        color={level <= interaction.quality ? Colors.warning : Colors.textTertiary}
                                    />
                                ))}
                            </View>
                            <Text style={styles.qualityLabel}>{qualityLabel}</Text>
                        </View>
                    </View>
                </Card>

                {/* Delete action */}
                <Pressable style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    <Text style={styles.deleteButtonText}>Delete Interaction</Text>
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
        padding: Spacing.xl,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    typeIconLarge: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    relativeTime: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
    },

    // Notes
    notesCard: {
        marginBottom: Spacing.xl,
    },
    notesText: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        lineHeight: 24,
        marginTop: Spacing.sm,
    },

    // Section
    section: {
        marginBottom: Spacing.xl,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
    },

    // People
    peopleList: {
        gap: Spacing.sm,
    },
    personChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.md,
    },
    personName: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },

    // Details card
    detailsCard: {
        marginBottom: Spacing.xl,
        gap: Spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    detailText: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        flex: 1,
    },
    qualityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    qualityStars: {
        flexDirection: 'row',
        gap: 2,
    },
    qualityLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
    },

    // Delete
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.md,
    },
    deleteButtonText: {
        color: Colors.error,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
});
