import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useInteractionsStore } from '../../stores/interactionsStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme/tokens';
import { applyHighlight, buildGraphData } from '../../utils/graphTransform';
import { GraphEdge } from './GraphEdge';
import { GraphNode } from './GraphNode';

const CANVAS_W = 600;
const CANVAS_H = 500;
const GRAPH_HEIGHT = 380;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.25;

export function RelationshipGraph() {
    const { people } = usePeopleStore();
    const { interactions } = useInteractionsStore();
    const { width: screenWidth } = useWindowDimensions();

    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [scale, setScale] = useState(1.0);

    // Build and run simulation — only re-runs when data changes
    const graphData = useMemo(
        () => buildGraphData(people, interactions),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [people.length, interactions.length]
    );

    // Apply highlight — re-runs when selection changes
    const { nodes, edges } = useMemo(
        () => applyHighlight(graphData.nodes, graphData.edges, selectedPersonId),
        [graphData, selectedPersonId]
    );

    const handleNodePress = (id: string, type: 'person' | 'interaction') => {
        if (type !== 'person') return;
        const personId = id.replace('person-', '');
        setSelectedPersonId((prev) => (prev === personId ? null : personId));
    };

    const zoomIn = () => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
    const zoomOut = () => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE));

    // ViewBox centers on canvas midpoint, adjusted by scale
    const halfW = (CANVAS_W / 2) / scale;
    const halfH = (CANVAS_H / 2) / scale;
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    const viewBox = `${cx - halfW} ${cy - halfH} ${CANVAS_W / scale} ${CANVAS_H / scale}`;

    if (people.length === 0) {
        return (
            <View style={[styles.container, styles.empty]}>
                <Ionicons name="git-network-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Add people to see your relationship network</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Svg width={screenWidth - Spacing.lg * 2} height={GRAPH_HEIGHT} viewBox={viewBox}>
                {/* Dark canvas background */}
                <Rect
                    x={0}
                    y={0}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    fill={Colors.backgroundElevated}
                />
                {/* Edges rendered first (below nodes) */}
                {edges.map((edge) => {
                    const source = nodes.find((n) => n.id === edge.sourceId);
                    const target = nodes.find((n) => n.id === edge.targetId);
                    if (!source || !target) return null;
                    return (
                        <GraphEdge
                            key={edge.id}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            opacity={edge.opacity}
                        />
                    );
                })}
                {/* Nodes rendered on top */}
                {nodes.map((node) => (
                    <GraphNode key={node.id} node={node} onPress={handleNodePress} />
                ))}
            </Svg>

            {/* Zoom controls */}
            <View style={styles.zoomControls}>
                <Pressable
                    style={styles.zoomButton}
                    onPress={zoomIn}
                    disabled={scale >= MAX_SCALE}
                >
                    <Ionicons
                        name="add"
                        size={18}
                        color={scale >= MAX_SCALE ? Colors.textTertiary : Colors.textPrimary}
                    />
                </Pressable>
                <Pressable
                    style={styles.zoomButton}
                    onPress={zoomOut}
                    disabled={scale <= MIN_SCALE}
                >
                    <Ionicons
                        name="remove"
                        size={18}
                        color={scale <= MIN_SCALE ? Colors.textTertiary : Colors.textPrimary}
                    />
                </Pressable>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <Text style={styles.legendTitle}>People</Text>
                <Text style={styles.legendSub}>● Interaction</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: GRAPH_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.backgroundElevated,
    },
    emptyText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        textAlign: 'center',
        maxWidth: 200,
    },
    zoomControls: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        gap: Spacing.xs,
    },
    zoomButton: {
        width: 32,
        height: 32,
        backgroundColor: `${Colors.backgroundCard}CC`,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    legend: {
        position: 'absolute',
        bottom: Spacing.md,
        left: Spacing.md,
    },
    legendTitle: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    legendSub: {
        color: Colors.textTertiary,
        fontSize: FontSize.xs,
    },
});
