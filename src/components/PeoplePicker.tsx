// PeoplePicker — searchable list of existing contacts for manual selection
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { usePeopleStore } from '../stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../theme/tokens';
import { Avatar } from './ui';

interface PeoplePickerProps {
    selectedIds: string[];
    onToggle: (personId: string) => void;
}

export function PeoplePicker({ selectedIds, onToggle }: PeoplePickerProps) {
    const people = usePeopleStore((s) => s.people);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return people;
        const q = search.toLowerCase();
        return people.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.nickname?.toLowerCase().includes(q)
        );
    }, [people, search]);

    // Selected people (always visible)
    const selectedPeople = useMemo(
        () => people.filter((p) => selectedIds.includes(p.id)),
        [people, selectedIds]
    );

    // Unselected people shown in the picker
    const unselectedFiltered = useMemo(
        () => filtered.filter((p) => !selectedIds.includes(p.id)),
        [filtered, selectedIds]
    );

    return (
        <View style={styles.container}>
            {/* Selected people chips */}
            {selectedPeople.length > 0 && (
                <View style={styles.selectedRow}>
                    {selectedPeople.map((person) => (
                        <Pressable
                            key={person.id}
                            style={styles.selectedChip}
                            onPress={() => onToggle(person.id)}
                        >
                            <Avatar name={person.name} size={20} />
                            <Text style={styles.selectedChipText}>{person.name}</Text>
                            <Ionicons name="close-circle" size={14} color={Colors.textTertiary} />
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Add button / expanded picker */}
            {!expanded ? (
                <Pressable style={styles.addButton} onPress={() => setExpanded(true)}>
                    <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
                    <Text style={styles.addButtonText}>Add People</Text>
                </Pressable>
            ) : (
                <View style={styles.picker}>
                    <View style={styles.searchRow}>
                        <Ionicons name="search" size={16} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search contacts..."
                            placeholderTextColor={Colors.textTertiary}
                            autoFocus
                        />
                        <Pressable onPress={() => { setExpanded(false); setSearch(''); }}>
                            <Ionicons name="close" size={18} color={Colors.textTertiary} />
                        </Pressable>
                    </View>

                    {unselectedFiltered.length > 0 ? (
                        <View style={styles.resultsList}>
                            {unselectedFiltered.slice(0, 8).map((person) => (
                                <Pressable
                                    key={person.id}
                                    style={({ pressed }) => [
                                        styles.resultRow,
                                        pressed && styles.resultRowPressed,
                                    ]}
                                    onPress={() => onToggle(person.id)}
                                >
                                    <Avatar name={person.name} size={28} />
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultName}>{person.name}</Text>
                                        {person.nickname && (
                                            <Text style={styles.resultNickname}>{person.nickname}</Text>
                                        )}
                                    </View>
                                    <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noResults}>
                            {search.trim() ? 'No contacts found' : 'No more contacts'}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    selectedRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: `${Colors.primary}15`,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.xxs + 1,
        paddingHorizontal: Spacing.sm,
    },
    selectedChipText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
    },
    addButtonText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    picker: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        overflow: 'hidden',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.surfaceBorder,
    },
    searchInput: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        padding: 0,
    },
    resultsList: {
        maxHeight: 250,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    resultRowPressed: {
        backgroundColor: Colors.backgroundCardHover,
    },
    resultInfo: {
        flex: 1,
    },
    resultName: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    resultNickname: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
    },
    noResults: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
    },
});
