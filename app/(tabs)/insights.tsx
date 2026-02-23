// Insights tab — analytics and relationship health overview
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Card } from '../../src/components/ui';
import type { WeeklyDataPoint } from '../../src/components/WeeklyChart';
import { WeeklyChart } from '../../src/components/WeeklyChart';
import { INTERACTION_TYPE_META } from '../../src/constants';
import { useInteractionsStore, usePeopleStore, useRemindersStore } from '../../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../src/theme/tokens';
import type { InteractionType } from '../../src/types';

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={22} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Card>
    );
}

export default function InsightsScreen() {
    const router = useRouter();
    const { people } = usePeopleStore();
    const { interactions } = useInteractionsStore();
    const { reminders, fetchReminders, getDueSoon } = useRemindersStore();

    useEffect(() => {
        fetchReminders();
    }, []);

    const stats = useMemo(() => {
        const totalPeople = people.length;
        const totalInteractions = interactions.length;

        // Interactions this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = interactions.filter(
            (i) => new Date(i.occurred_at) >= weekAgo
        ).length;

        // Average quality
        const avgQuality =
            interactions.length > 0
                ? (
                    interactions.reduce((sum, i) => sum + i.quality, 0) /
                    interactions.length
                ).toFixed(1)
                : '—';

        // Interaction type breakdown
        const typeBreakdown: Record<InteractionType, number> = {
            'in-person': 0,
            call: 0,
            text: 0,
            video: 0,
            'social-media': 0,
            email: 0,
        };
        interactions.forEach((i) => {
            typeBreakdown[i.type]++;
        });

        // People needing attention (no interaction in 30+ days)
        const needsAttention = people.filter((p) => {
            if (!p.last_interaction_at) return true;
            const daysSince = Math.floor(
                (Date.now() - new Date(p.last_interaction_at).getTime()) / 86_400_000
            );
            return daysSince > 30;
        });

        return {
            totalPeople,
            totalInteractions,
            thisWeek,
            avgQuality,
            typeBreakdown,
            needsAttention,
        };
    }, [people, interactions]);

    // ── Weekly trend data (last 8 weeks) ──────────────────
    const weeklyData: WeeklyDataPoint[] = useMemo(() => {
        const weeks: WeeklyDataPoint[] = [];
        const now = new Date();

        for (let w = 7; w >= 0; w--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - w * 7);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const count = interactions.filter((i) => {
                const d = new Date(i.occurred_at);
                return d >= weekStart && d < weekEnd;
            }).length;

            const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            weeks.push({ label, count });
        }
        return weeks;
    }, [interactions]);

    // ── Due-soon reminders ────────────────────────────────
    const dueSoon = useMemo(() => getDueSoon(7), [reminders]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Summary stats */}
            <View style={styles.statsGrid}>
                <StatCard
                    icon="people"
                    label="People"
                    value={stats.totalPeople}
                    color={Colors.primary}
                />
                <StatCard
                    icon="chatbubbles"
                    label="Interactions"
                    value={stats.totalInteractions}
                    color={Colors.accent}
                />
                <StatCard
                    icon="flash"
                    label="This Week"
                    value={stats.thisWeek}
                    color={Colors.success}
                />
                <StatCard
                    icon="star"
                    label="Avg Quality"
                    value={stats.avgQuality}
                    color={Colors.warning}
                />
            </View>

            {/* Interaction type breakdown */}
            <Text style={styles.sectionTitle}>Interaction Types</Text>
            <Card style={styles.breakdownCard}>
                {Object.entries(stats.typeBreakdown).map(([type, count]) => {
                    const meta = INTERACTION_TYPE_META[type as InteractionType];
                    const maxCount = Math.max(...Object.values(stats.typeBreakdown), 1);
                    const widthPercent = (count / maxCount) * 100;

                    return (
                        <View key={type} style={styles.breakdownRow}>
                            <View style={styles.breakdownLabel}>
                                <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                                <Text style={styles.breakdownText}>{meta.label}</Text>
                            </View>
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            width: `${Math.max(widthPercent, 2)}%`,
                                            backgroundColor: meta.color,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.breakdownCount}>{count}</Text>
                        </View>
                    );
                })}
            </Card>

            {/* Needs attention */}
            {stats.needsAttention.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>
                        Needs Attention ({stats.needsAttention.length})
                    </Text>
                    <Card style={styles.attentionCard}>
                        <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
                        <Text style={styles.attentionText}>
                            {stats.needsAttention.length} people haven't been contacted in 30+ days
                        </Text>
                    </Card>
                </>
            )}

            {/* Weekly Activity Chart */}
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <Card>
                <WeeklyChart data={weeklyData} barColor={Colors.primary} />
            </Card>

            {/* Due Soon Reminders */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Due Soon</Text>
                <Pressable onPress={() => router.push('/reminders' as any)}>
                    <Text style={styles.viewAllLink}>View All</Text>
                </Pressable>
            </View>
            {dueSoon.length > 0 ? (
                dueSoon.slice(0, 3).map((reminder) => {
                    const dueDate = new Date(reminder.next_due_at);
                    const diffDays = Math.floor((dueDate.getTime() - Date.now()) / 86_400_000);
                    const dueLabel =
                        diffDays < 0 ? `${Math.abs(diffDays)}d overdue`
                            : diffDays === 0 ? 'Today'
                                : diffDays === 1 ? 'Tomorrow'
                                    : `In ${diffDays}d`;
                    const dueColor = diffDays < 0 ? Colors.error : diffDays <= 1 ? Colors.warning : Colors.accent;

                    return (
                        <Card key={reminder.id} style={styles.reminderCard}>
                            <View style={styles.reminderRow}>
                                {reminder.person && (
                                    <Avatar name={reminder.person.name} uri={reminder.person.avatar_url} size={32} />
                                )}
                                <View style={styles.reminderContent}>
                                    <Text style={styles.reminderMessage}>{reminder.message}</Text>
                                    {reminder.person && (
                                        <Text style={styles.reminderPerson}>{reminder.person.name}</Text>
                                    )}
                                </View>
                                <Text style={[styles.reminderDue, { color: dueColor }]}>{dueLabel}</Text>
                            </View>
                        </Card>
                    );
                })
            ) : (
                <Card>
                    <Text style={styles.noReminders}>No upcoming reminders</Text>
                </Card>
            )}
        </ScrollView>
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        color: Colors.textPrimary,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    statLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginTop: Spacing.xxs,
    },
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginTop: Spacing.xxl,
        marginBottom: Spacing.md,
    },
    breakdownCard: {
        gap: Spacing.md,
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    breakdownLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        width: 110,
    },
    breakdownText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: Colors.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 4,
        opacity: 0.8,
    },
    breakdownCount: {
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        minWidth: 24,
        textAlign: 'right',
    },
    attentionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.warning,
    },
    attentionText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        flex: 1,
    },
    // Due-soon & chart styles
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewAllLink: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    reminderCard: {
        marginBottom: Spacing.sm,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    reminderMessage: {
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    reminderPerson: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    reminderDue: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        marginLeft: Spacing.sm,
    },
    noReminders: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
    },
});
