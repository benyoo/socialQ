// People tab — list of all contacts with search and filtering
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Avatar, Badge, Card } from '../../src/components/ui';
import { CLOSENESS_LABELS, RELATIONSHIP_TYPE_META } from '../../src/constants';
import { usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../../src/theme/tokens';
import type { Person, RelationshipType } from '../../src/types';

const FILTER_OPTIONS: (RelationshipType | 'all')[] = [
    'all',
    'family',
    'friend',
    'colleague',
    'acquaintance',
    'other',
];

function PersonCard({ person }: { person: Person }) {
    const router = useRouter();
    const relMeta = RELATIONSHIP_TYPE_META[person.relationship_type];

    const daysSinceContact = person.last_interaction_at
        ? Math.floor(
            (Date.now() - new Date(person.last_interaction_at).getTime()) / 86_400_000
        )
        : null;

    return (
        <Card
            style={styles.personCard}
            onPress={() => router.push(`/person/${person.id}` as any)}
        >
            <View style={styles.cardRow}>
                <Avatar name={person.name} uri={person.avatar_url} size={48} />
                <View style={styles.cardContent}>
                    <View style={styles.nameRow}>
                        <Text style={styles.personName}>{person.name}</Text>
                        {person.nickname && (
                            <Text style={styles.nickname}>({person.nickname})</Text>
                        )}
                    </View>
                    <View style={styles.metaRow}>
                        <Badge
                            label={relMeta.label}
                            color={relMeta.color}
                            size="sm"
                        />
                        <Text style={styles.closeness}>
                            {CLOSENESS_LABELS[person.closeness_level]}
                        </Text>
                    </View>
                </View>
                <View style={styles.lastContact}>
                    {daysSinceContact !== null ? (
                        <>
                            <Text style={[
                                styles.daysCount,
                                daysSinceContact > 30 && { color: Colors.warning },
                                daysSinceContact > 60 && { color: Colors.error },
                            ]}>
                                {daysSinceContact}
                            </Text>
                            <Text style={styles.daysLabel}>days</Text>
                        </>
                    ) : (
                        <Text style={styles.neverContacted}>—</Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

export default function PeopleScreen() {
    const router = useRouter();
    const { people, isLoading, fetchPeople } = usePeopleStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<RelationshipType | 'all'>('all');

    useEffect(() => {
        fetchPeople();
    }, []);

    const filteredPeople = useMemo(() => {
        let result = people;
        if (activeFilter !== 'all') {
            result = result.filter((p) => p.relationship_type === activeFilter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.nickname?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [people, activeFilter, searchQuery]);

    return (
        <View style={styles.container}>
            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search people..."
                    placeholderTextColor={Colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    selectionColor={Colors.primary}
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                    </Pressable>
                )}
            </View>

            {/* Filter chips */}
            <FlatList
                horizontal
                data={FILTER_OPTIONS}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => {
                    const isActive = activeFilter === item;
                    const label = item === 'all' ? 'All' : RELATIONSHIP_TYPE_META[item].label;
                    return (
                        <Pressable
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                            onPress={() => setActiveFilter(item)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            {/* People list */}
            <FlatList
                data={filteredPeople}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PersonCard person={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="person-add-outline" size={64} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No people yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add the people in your life to start tracking interactions
                        </Text>
                    </View>
                }
            />

            {/* FAB — Add person */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    pressed && styles.fabPressed,
                ]}
                onPress={() => router.push('/person/new' as any)}
            >
                <Ionicons name="person-add" size={24} color={Colors.white} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
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
        paddingVertical: Spacing.xs,
    },
    filterList: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    filterChipActive: {
        backgroundColor: `${Colors.primary}20`,
        borderColor: Colors.primary,
    },
    filterChipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    filterChipTextActive: {
        color: Colors.primary,
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
        paddingBottom: 100,
    },
    personCard: {
        marginBottom: Spacing.sm,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.xs,
    },
    personName: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    nickname: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    closeness: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
    },
    lastContact: {
        alignItems: 'center',
        minWidth: 40,
    },
    daysCount: {
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    daysLabel: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
    },
    neverContacted: {
        color: Colors.textTertiary,
        fontSize: FontSize.xl,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: Spacing.xxxl,
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
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.lg,
        ...Shadow.glow(Colors.accent),
    },
    fabPressed: {
        transform: [{ scale: 0.92 }],
        opacity: 0.9,
    },
});
