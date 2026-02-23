// WeeklyChart — simple bar chart showing interaction counts per week
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../theme/tokens';

export interface WeeklyDataPoint {
    label: string;   // e.g. "Feb 10"
    count: number;
}

interface WeeklyChartProps {
    data: WeeklyDataPoint[];
    barColor?: string;
}

export function WeeklyChart({ data, barColor = Colors.primary }: WeeklyChartProps) {
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    if (data.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No data yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.barsRow}>
                {data.map((point, index) => {
                    const heightPercent = (point.count / maxCount) * 100;
                    return (
                        <View key={index} style={styles.barColumn}>
                            <Text style={styles.countLabel}>
                                {point.count > 0 ? point.count : ''}
                            </Text>
                            <View style={styles.barTrack}>
                                <View
                                    style={[
                                        styles.barFill,
                                        {
                                            height: `${Math.max(heightPercent, 4)}%`,
                                            backgroundColor: barColor,
                                            opacity: point.count > 0 ? 1 : 0.2,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.weekLabel}>{point.label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const BAR_HEIGHT = 100;

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
    },
    barsRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: Spacing.xs,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    countLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        marginBottom: 4,
        minHeight: 14,
    },
    barTrack: {
        width: '100%',
        height: BAR_HEIGHT,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    barFill: {
        width: '70%',
        borderRadius: BorderRadius.sm,
        minHeight: 4,
    },
    weekLabel: {
        color: Colors.textTertiary,
        fontSize: 9,
        fontWeight: FontWeight.medium,
        marginTop: 6,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
    },
});
