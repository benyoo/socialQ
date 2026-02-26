import { describe, expect, it } from 'vitest';
import { Colors } from '../../src/theme/tokens';
import type { InteractionWithPeople, Person } from '../../src/types';
import { applyHighlight, buildGraphData } from '../../src/utils/graphTransform';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePerson(overrides: Partial<Person> = {}): Person {
    return {
        id: 'p1',
        user_id: 'u1',
        name: 'Alice',
        relationship_type: 'friend',
        closeness_level: 3,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

function makeInteraction(overrides: Partial<InteractionWithPeople> = {}): InteractionWithPeople {
    return {
        id: 'i1',
        user_id: 'u1',
        type: 'call',
        title: 'Catch up',
        sentiment: 4,
        occurred_at: '2026-01-15T00:00:00Z',
        created_at: '2026-01-15T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
        people: [],
        ...overrides,
    };
}

// ── buildGraphData ─────────────────────────────────────────────────────────────

describe('buildGraphData', () => {
    it('returns empty nodes and edges when people is empty', () => {
        const result = buildGraphData([], []);
        expect(result.nodes).toHaveLength(0);
        expect(result.edges).toHaveLength(0);
    });

    it('returns person node when there are people but no interactions', () => {
        const alice = makePerson();
        const result = buildGraphData([alice], []);
        const personNode = result.nodes.find((n) => n.id === 'person-p1');
        expect(personNode).toBeDefined();
        expect(personNode?.type).toBe('person');
        expect(personNode?.label).toBe('Alice');
    });

    it('uses nickname as label when available', () => {
        const alice = makePerson({ nickname: 'Ali' });
        const result = buildGraphData([alice], []);
        const personNode = result.nodes.find((n) => n.id === 'person-p1');
        expect(personNode?.label).toBe('Ali');
    });

    it('computes correct person node radius from closeness_level', () => {
        // radius = 14 + (closeness_level - 1) * 4
        const cases: Array<[1 | 2 | 3 | 4 | 5, number]> = [
            [1, 14],
            [2, 18],
            [3, 22],
            [4, 26],
            [5, 30],
        ];
        for (const [level, expected] of cases) {
            const person = makePerson({ id: `p${level}`, closeness_level: level });
            const result = buildGraphData([person], []);
            const node = result.nodes.find((n) => n.id === `person-p${level}`);
            expect(node?.radius).toBe(expected);
        }
    });

    it('creates an interaction node when interaction has people', () => {
        const alice = makePerson();
        const interaction = makeInteraction({ people: [alice] });
        const result = buildGraphData([alice], [interaction]);
        const iNode = result.nodes.find((n) => n.id === 'interaction-i1');
        expect(iNode).toBeDefined();
        expect(iNode?.type).toBe('interaction');
        expect(iNode?.radius).toBe(6);
    });

    it('does not create interaction node when interaction has no people', () => {
        const alice = makePerson();
        const interaction = makeInteraction({ people: [] });
        const result = buildGraphData([alice], [interaction]);
        const iNode = result.nodes.find((n) => n.id === 'interaction-i1');
        expect(iNode).toBeUndefined();
    });

    it('maps sentiment to correct color token', () => {
        const alice = makePerson();
        const sentimentColors = [
            { sentiment: 1 as const, colorKey: 'bad' },
            { sentiment: 2 as const, colorKey: 'poor' },
            { sentiment: 3 as const, colorKey: 'neutral' },
            { sentiment: 4 as const, colorKey: 'good' },
            { sentiment: 5 as const, colorKey: 'excellent' },
        ];

        for (const { sentiment, colorKey } of sentimentColors) {
            const interaction = makeInteraction({
                id: `i${sentiment}`,
                sentiment,
                people: [alice],
            });
            const result = buildGraphData([alice], [interaction]);
            const iNode = result.nodes.find((n) => n.id === `interaction-i${sentiment}`);
            expect(iNode).toBeDefined();
            // The color should be a non-empty hex string
            expect(iNode?.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            // Each sentiment should map to a different color
            expect(iNode?.color).toBe((Colors as Record<string, string>)[colorKey]);
        }
    });

    it('creates an edge between interaction and its people', () => {
        const alice = makePerson();
        const interaction = makeInteraction({ people: [alice] });
        const result = buildGraphData([alice], [interaction]);
        const edge = result.edges.find(
            (e) => e.sourceId === 'interaction-i1' && e.targetId === 'person-p1'
        );
        expect(edge).toBeDefined();
    });

    it('creates multiple edges for multi-person interaction', () => {
        const alice = makePerson({ id: 'p1' });
        const bob = makePerson({ id: 'p2', name: 'Bob' });
        const interaction = makeInteraction({ people: [alice, bob] });
        const result = buildGraphData([alice, bob], [interaction]);
        const aliceEdge = result.edges.find((e) => e.targetId === 'person-p1');
        const bobEdge = result.edges.find((e) => e.targetId === 'person-p2');
        expect(aliceEdge).toBeDefined();
        expect(bobEdge).toBeDefined();
    });

    it('positions nodes within reasonable canvas bounds after simulation', () => {
        const people = [1, 2, 3].map((i) =>
            makePerson({ id: `p${i}`, name: `Person ${i}` })
        );
        const interaction = makeInteraction({ people });
        const result = buildGraphData(people, [interaction]);
        for (const node of result.nodes) {
            // Nodes should land somewhere on the 600×500 canvas (with some margin)
            expect(node.x).toBeGreaterThan(-100);
            expect(node.x).toBeLessThan(700);
            expect(node.y).toBeGreaterThan(-100);
            expect(node.y).toBeLessThan(600);
        }
    });

    it('caps interactions at 50 most recent', () => {
        const alice = makePerson();
        const manyInteractions = Array.from({ length: 60 }, (_, i) =>
            makeInteraction({
                id: `i${i}`,
                people: [alice],
                occurred_at: new Date(2026, 0, i + 1).toISOString(),
            })
        );
        const result = buildGraphData([alice], manyInteractions);
        const iNodes = result.nodes.filter((n) => n.type === 'interaction');
        expect(iNodes.length).toBeLessThanOrEqual(50);
    });

    it('all nodes default to opacity 1', () => {
        const alice = makePerson();
        const interaction = makeInteraction({ people: [alice] });
        const result = buildGraphData([alice], [interaction]);
        for (const node of result.nodes) {
            expect(node.opacity).toBe(1);
        }
    });
});

// ── applyHighlight ─────────────────────────────────────────────────────────────

describe('applyHighlight', () => {
    function buildSmallGraph() {
        const alice = makePerson({ id: 'p1' });
        const bob = makePerson({ id: 'p2', name: 'Bob' });
        const interaction = makeInteraction({ people: [alice, bob] });
        return buildGraphData([alice, bob], [interaction]);
    }

    it('returns nodes and edges unchanged when selectedPersonId is null', () => {
        const graph = buildSmallGraph();
        const result = applyHighlight(graph.nodes, graph.edges, null);
        expect(result.nodes).toBe(graph.nodes); // same reference
        expect(result.edges).toBe(graph.edges);
    });

    it('sets selected person node to opacity 1', () => {
        const graph = buildSmallGraph();
        const result = applyHighlight(graph.nodes, graph.edges, 'p1');
        const alice = result.nodes.find((n) => n.id === 'person-p1');
        expect(alice?.opacity).toBe(1);
    });

    it('sets connected interaction nodes to opacity 1', () => {
        const graph = buildSmallGraph();
        const result = applyHighlight(graph.nodes, graph.edges, 'p1');
        const iNode = result.nodes.find((n) => n.id === 'interaction-i1');
        expect(iNode?.opacity).toBe(1);
    });

    it('dims unrelated nodes (opacity < 0.5)', () => {
        const alice = makePerson({ id: 'p1' });
        const bob = makePerson({ id: 'p2', name: 'Bob' });
        const carol = makePerson({ id: 'p3', name: 'Carol' });
        // Interaction only involves alice and bob, not carol
        const aliceBobInteraction = makeInteraction({ id: 'i1', people: [alice, bob] });
        const graph = buildGraphData([alice, bob, carol], [aliceBobInteraction]);
        const result = applyHighlight(graph.nodes, graph.edges, 'p1');
        const carolNode = result.nodes.find((n) => n.id === 'person-p3');
        expect(carolNode?.opacity).toBeLessThan(0.5);
    });

    it('dims unrelated edges (opacity < 0.5)', () => {
        const alice = makePerson({ id: 'p1' });
        const bob = makePerson({ id: 'p2', name: 'Bob' });
        const carol = makePerson({ id: 'p3', name: 'Carol' });
        const aliceBobInteraction = makeInteraction({ id: 'i1', people: [alice, bob] });
        const carolInteraction = makeInteraction({
            id: 'i2',
            people: [carol],
            occurred_at: '2026-01-20T00:00:00Z',
        });
        const graph = buildGraphData([alice, bob, carol], [aliceBobInteraction, carolInteraction]);
        const result = applyHighlight(graph.nodes, graph.edges, 'p1');
        const carolEdge = result.edges.find(
            (e) => e.sourceId === 'interaction-i2' && e.targetId === 'person-p3'
        );
        expect(carolEdge?.opacity).toBeLessThan(0.5);
    });

    it('keeps edges connected to selected person at opacity 1', () => {
        const graph = buildSmallGraph();
        const result = applyHighlight(graph.nodes, graph.edges, 'p1');
        const aliceEdge = result.edges.find((e) => e.targetId === 'person-p1');
        expect(aliceEdge?.opacity).toBe(1);
    });

    it('does not mutate the original nodes array', () => {
        const graph = buildSmallGraph();
        const originalOpacities = graph.nodes.map((n) => n.opacity);
        applyHighlight(graph.nodes, graph.edges, 'p1');
        const currentOpacities = graph.nodes.map((n) => n.opacity);
        expect(currentOpacities).toEqual(originalOpacities);
    });
});
