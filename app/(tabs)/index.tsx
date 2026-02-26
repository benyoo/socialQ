// Timeline — main dashboard showing recent interactions
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar, Badge, Card } from '../../src/components/ui';
import { INTERACTION_TYPE_META } from '../../src/constants';
import { useInteractionsStore, usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../../src/theme/tokens';
import type { InteractionType, InteractionWithPeople } from '../../src/types';

// ─── Filter types ────────────────────────────────────────

type DateRange = 'all' | 'today' | 'week' | 'month';
type SortBy = 'occurred_at' | 'created_at';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'occurred_at', label: 'When happened' },
  { value: 'created_at', label: 'Date logged' },
];

const TYPE_FILTER_OPTIONS: (InteractionType | 'all')[] = [
  'all',
  'in-person',
  'call',
  'text',
  'video',
  'social-media',
  'email',
];

// ─── Helpers ────────────────────────────────────────────

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateRangeStart(range: DateRange): Date | null {
  if (range === 'all') return null;

  const now = new Date();
  switch (range) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    case 'month': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
  }
}

// ─── InteractionCard ────────────────────────────────────

function InteractionCard({ interaction }: { interaction: InteractionWithPeople }) {
  const router = useRouter();
  const meta = INTERACTION_TYPE_META[interaction.type];

  return (
    <Card
      style={styles.interactionCard}
      onPress={() => router.push(`/interaction/${interaction.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${meta.color}20` }]}>
          <Ionicons name={meta.icon as any} size={18} color={meta.color} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {interaction.title}
          </Text>
          <Text style={styles.cardTime}>
            {formatRelativeTime(interaction.occurred_at)}
          </Text>
        </View>
        <Badge label={meta.label} color={meta.color} size="sm" />
      </View>

      {interaction.notes && (
        <Text style={styles.cardNotes} numberOfLines={2}>
          {interaction.notes}
        </Text>
      )}

      {interaction.people.length > 0 && (
        <View style={styles.peopleRow}>
          {interaction.people.slice(0, 4).map((person) => (
            <Avatar key={person.id} name={person.name} size={28} />
          ))}
          {interaction.people.length > 4 && (
            <View style={styles.morePeople}>
              <Text style={styles.morePeopleText}>
                +{interaction.people.length - 4}
              </Text>
            </View>
          )}
          <Text style={styles.peopleNames} numberOfLines={1}>
            {interaction.people.map((p) => p.name).join(', ')}
          </Text>
        </View>
      )}

      {/* Quality dots */}
      <View style={styles.qualityRow}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.qualityDot,
              level <= interaction.sentiment && styles.qualityDotActive,
            ]}
          />
        ))}
      </View>
    </Card>
  );
}

// ─── TimelineScreen ─────────────────────────────────────

export default function TimelineScreen() {
  const router = useRouter();
  const { interactions, isLoading, fetchInteractions } = useInteractionsStore();
  const { fetchPeople } = usePeopleStore();

  // Filter + sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<InteractionType | 'all'>('all');
  const [activeDateRange, setActiveDateRange] = useState<DateRange>('all');
  const [sortBy, setSortBy] = useState<SortBy>('occurred_at');

  useEffect(() => {
    fetchInteractions();
    fetchPeople();
  }, []);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    let result = interactions;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q) ||
          i.people.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (activeType !== 'all') {
      result = result.filter((i) => i.type === activeType);
    }

    // Date range filter
    const rangeStart = getDateRangeStart(activeDateRange);
    if (rangeStart) {
      result = result.filter(
        (i) => new Date(i.occurred_at) >= rangeStart
      );
    }

    return [...result].sort(
      (a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
    );
  }, [interactions, searchQuery, activeType, activeDateRange, sortBy]);

  const hasActiveFilters = searchQuery || activeType !== 'all' || activeDateRange !== 'all';

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search interactions..."
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

      {/* Type filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterList}
      >
        {TYPE_FILTER_OPTIONS.map((item) => {
          const isActive = activeType === item;
          const label = item === 'all' ? 'All' : INTERACTION_TYPE_META[item].label;
          const icon = item === 'all' ? 'apps' : INTERACTION_TYPE_META[item].icon;
          const color = item === 'all' ? Colors.primary : INTERACTION_TYPE_META[item].color;
          return (
            <Pressable
              key={item}
              style={[styles.filterChip, isActive && { backgroundColor: `${color}20`, borderColor: color }]}
              onPress={() => setActiveType(item)}
            >
              <Ionicons
                name={icon as any}
                size={13}
                color={isActive ? color : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && { color },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Date range presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.dateFilterList}
      >
        {DATE_RANGE_OPTIONS.map((item) => {
          const isActive = activeDateRange === item.value;
          return (
            <Pressable
              key={item.value}
              style={[styles.dateChip, isActive && styles.dateChipActive]}
              onPress={() => setActiveDateRange(item.value)}
            >
              <Text
                style={[
                  styles.dateChipText,
                  isActive && styles.dateChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort toggle */}
      <View style={styles.sortRow}>
        <Ionicons name="swap-vertical" size={13} color={Colors.textTertiary} />
        <Text style={styles.sortLabel}>Sort:</Text>
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.sortChip, isActive && styles.sortChipActive]}
              onPress={() => setSortBy(opt.value)}
            >
              <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Interactions list */}
      <FlatList
        data={filteredInteractions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InteractionCard interaction={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchInteractions}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={hasActiveFilters ? 'funnel-outline' : 'chatbubbles-outline'}
              size={64}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>
              {hasActiveFilters ? 'No matching interactions' : 'No interactions yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Tap the + button to log your first social interaction'}
            </Text>
            {hasActiveFilters && (
              <Pressable
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setActiveType('all');
                  setActiveDateRange('all');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* FAB — Log new interaction */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push('/interaction/new' as any)}
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
  // Search
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
  // Type filter chips
  filterList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  // Date range chips
  dateFilterList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dateChip: {
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  dateChipActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  dateChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  dateChipTextActive: {
    color: Colors.accent,
  },
  // Sort row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sortLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  sortChip: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sortChipActive: {
    backgroundColor: `${Colors.primary}20`,
    borderColor: Colors.primary,
  },
  sortChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  sortChipTextActive: {
    color: Colors.primary,
  },
  // List
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  interactionCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  cardTime: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  cardNotes: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: -6,
  },
  morePeople: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePeopleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  peopleNames: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginLeft: Spacing.sm + 6,
    flex: 1,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.md,
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceBorder,
  },
  qualityDotActive: {
    backgroundColor: Colors.primary,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
  clearFiltersButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}15`,
  },
  clearFiltersText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  // FAB
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
