// Timeline — main dashboard showing recent interactions
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar, Badge, Card } from '../../src/components/ui';
import { INTERACTION_TYPE_META } from '../../src/constants';
import { useInteractionsStore, usePeopleStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../../src/theme/tokens';
import type { InteractionWithPeople } from '../../src/types';

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
              level <= interaction.quality && styles.qualityDotActive,
            ]}
          />
        ))}
      </View>
    </Card>
  );
}

export default function TimelineScreen() {
  const router = useRouter();
  const { interactions, isLoading, fetchInteractions } = useInteractionsStore();
  const { fetchPeople } = usePeopleStore();

  useEffect(() => {
    fetchInteractions();
    fetchPeople();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={interactions}
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
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No interactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to log your first social interaction
            </Text>
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
  listContent: {
    padding: Spacing.lg,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
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
