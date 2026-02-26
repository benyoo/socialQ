// Converts domain data (people + interactions) into graph primitives for rendering.
// Also computes highlight state (selected node dims unrelated nodes).

import { RELATIONSHIP_TYPE_META } from '../constants';
import { Colors } from '../theme/tokens';
import type { InteractionWithPeople, Person } from '../types';
import { runSimulation } from './graphPhysics';
import type { PhysicsEdge, PhysicsNode } from './graphPhysics';

export interface GraphNode {
    id: string;
    type: 'person' | 'interaction';
    label: string;
    color: string;
    radius: number;
    opacity: number;
    x: number;
    y: number;
}

export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    opacity: number;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const MAX_INTERACTIONS = 50;
const CANVAS_W = 600;
const CANVAS_H = 500;

const SENTIMENT_COLORS: Record<number, string> = {
    1: Colors.bad,
    2: Colors.poor,
    3: Colors.neutral,
    4: Colors.good,
    5: Colors.excellent,
};

function personRadius(closenessLevel: number): number {
    return 14 + (closenessLevel - 1) * 4; // 14–30 px
}

function sentimentColor(sentiment: number): string {
    return SENTIMENT_COLORS[sentiment] ?? Colors.neutral;
}

export function buildGraphData(
    people: Person[],
    interactions: InteractionWithPeople[],
): GraphData {
    if (people.length === 0) return { nodes: [], edges: [] };

    // Cap interactions to keep simulation fast
    const recentInteractions = [...interactions]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, MAX_INTERACTIONS);

    // Collect which people actually appear in these interactions
    const activePeopleIds = new Set<string>();
    recentInteractions.forEach((i) => i.people.forEach((p) => activePeopleIds.add(p.id)));

    // Use all people (so isolated nodes show) — but filter to those in the interaction set
    // if we have many people; always include all if ≤ 50 total
    const activePeople = people.length <= MAX_INTERACTIONS
        ? people
        : people.filter((p) => activePeopleIds.has(p.id));

    // Build node lists
    const personNodes: GraphNode[] = activePeople.map((p) => ({
        id: `person-${p.id}`,
        type: 'person',
        label: p.nickname ?? p.name,
        color: RELATIONSHIP_TYPE_META[p.relationship_type].color,
        radius: personRadius(p.closeness_level),
        opacity: 1,
        x: 0,
        y: 0,
    }));

    const interactionNodes: GraphNode[] = recentInteractions
        .filter((i) => i.people.length > 0)
        .map((i) => ({
            id: `interaction-${i.id}`,
            type: 'interaction',
            label: '',
            color: sentimentColor(i.sentiment),
            radius: 6,
            opacity: 1,
            x: 0,
            y: 0,
        }));

    const nodes = [...personNodes, ...interactionNodes];

    // Build edges: interaction → each of its people
    const edges: GraphEdge[] = recentInteractions.flatMap((i) =>
        i.people
            .filter((p) => activePeople.some((ap) => ap.id === p.id))
            .map((p) => ({
                id: `edge-${i.id}-${p.id}`,
                sourceId: `interaction-${i.id}`,
                targetId: `person-${p.id}`,
                opacity: 1,
            }))
    );

    // Run physics simulation
    const physicsNodes: PhysicsNode[] = nodes.map((n) => ({
        id: n.id,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: n.radius,
    }));

    const physicsEdges: PhysicsEdge[] = edges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
    }));

    const positioned = runSimulation(physicsNodes, physicsEdges, CANVAS_W, CANVAS_H);
    const posMap = new Map(positioned.map((n) => [n.id, { x: n.x, y: n.y }]));

    const positionedNodes: GraphNode[] = nodes.map((n) => ({
        ...n,
        x: posMap.get(n.id)?.x ?? CANVAS_W / 2,
        y: posMap.get(n.id)?.y ?? CANVAS_H / 2,
    }));

    return { nodes: positionedNodes, edges };
}

export function applyHighlight(
    nodes: GraphNode[],
    edges: GraphEdge[],
    selectedPersonId: string | null,
): GraphData {
    if (selectedPersonId === null) return { nodes, edges };

    const selectedNodeId = `person-${selectedPersonId}`;

    // Find interaction nodes directly connected to the selected person
    const connectedInteractionIds = new Set<string>(
        edges
            .filter((e) => e.sourceId === selectedNodeId || e.targetId === selectedNodeId)
            .map((e) => (e.sourceId === selectedNodeId ? e.targetId : e.sourceId))
    );

    const highlightedNodes = nodes.map((n) => ({
        ...n,
        opacity:
            n.id === selectedNodeId || connectedInteractionIds.has(n.id) ? 1 : 0.1,
    }));

    const highlightedEdges = edges.map((e) => ({
        ...e,
        opacity:
            e.sourceId === selectedNodeId || e.targetId === selectedNodeId ? 1 : 0.05,
    }));

    return { nodes: highlightedNodes, edges: highlightedEdges };
}
