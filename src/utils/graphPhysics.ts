// Pure force-directed layout simulation — no React, no external deps.
// Uses Velocity Verlet integration with three forces:
//   1. Coulomb repulsion between all node pairs
//   2. Spring attraction along edges
//   3. Weak center gravity to prevent drift

export interface PhysicsNode {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

export interface PhysicsEdge {
    sourceId: string;
    targetId: string;
}

const REPULSION_STRENGTH = 6000;
const SPRING_STRENGTH = 0.06;
const SPRING_REST_LENGTH = 110;
const GRAVITY_ALPHA = 0.015;
const DAMPING = 0.85;
const MIN_DIST = 1;

function seedCircle(count: number, cx: number, cy: number, radius: number): Array<{ x: number; y: number }> {
    return Array.from({ length: count }, (_, i) => {
        const angle = (2 * Math.PI * i) / count;
        return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
}

export function runSimulation(
    nodes: PhysicsNode[],
    edges: PhysicsEdge[],
    width: number,
    height: number,
    iterations = 300,
): PhysicsNode[] {
    if (nodes.length === 0) return [];

    const cx = width / 2;
    const cy = height / 2;
    const seedRadius = Math.min(width, height) * 0.3;
    const seeds = seedCircle(nodes.length, cx, cy, seedRadius);

    // Clone nodes so we never mutate the caller's array
    const ns: PhysicsNode[] = nodes.map((n, i) => ({
        ...n,
        x: seeds[i]?.x ?? cx,
        y: seeds[i]?.y ?? cy,
        vx: 0,
        vy: 0,
    }));

    // Build id → index map for O(1) edge lookups
    const idxById = new Map<string, number>();
    ns.forEach((n, i) => idxById.set(n.id, i));

    // Pre-parse edges into index pairs
    const edgePairs: Array<[number, number]> = [];
    for (const e of edges) {
        const si = idxById.get(e.sourceId);
        const ti = idxById.get(e.targetId);
        if (si !== undefined && ti !== undefined) edgePairs.push([si, ti]);
    }

    for (let iter = 0; iter < iterations; iter++) {
        const fx = new Float64Array(ns.length);
        const fy = new Float64Array(ns.length);

        // 1. Repulsion — all pairs O(n²)
        for (let i = 0; i < ns.length; i++) {
            for (let j = i + 1; j < ns.length; j++) {
                const dx = ns[i].x - ns[j].x;
                const dy = ns[i].y - ns[j].y;
                const distSq = Math.max(dx * dx + dy * dy, MIN_DIST);
                const dist = Math.sqrt(distSq);
                const force = REPULSION_STRENGTH / distSq;
                const ux = dx / dist;
                const uy = dy / dist;
                fx[i] += force * ux;
                fy[i] += force * uy;
                fx[j] -= force * ux;
                fy[j] -= force * uy;
            }
        }

        // 2. Spring attraction — edges only
        for (const [si, ti] of edgePairs) {
            const dx = ns[ti].x - ns[si].x;
            const dy = ns[ti].y - ns[si].y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
            const force = SPRING_STRENGTH * (dist - SPRING_REST_LENGTH);
            const ux = dx / dist;
            const uy = dy / dist;
            fx[si] += force * ux;
            fy[si] += force * uy;
            fx[ti] -= force * ux;
            fy[ti] -= force * uy;
        }

        // 3. Center gravity
        for (let i = 0; i < ns.length; i++) {
            fx[i] += GRAVITY_ALPHA * (cx - ns[i].x);
            fy[i] += GRAVITY_ALPHA * (cy - ns[i].y);
        }

        // Integrate velocity + position
        for (let i = 0; i < ns.length; i++) {
            ns[i].vx = (ns[i].vx + fx[i]) * DAMPING;
            ns[i].vy = (ns[i].vy + fy[i]) * DAMPING;
            ns[i].x += ns[i].vx;
            ns[i].y += ns[i].vy;
        }
    }

    return ns;
}
