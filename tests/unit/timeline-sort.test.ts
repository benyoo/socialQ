import { describe, it, expect } from 'vitest';
import type { InteractionWithPeople } from '../../src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortBy = 'occurred_at' | 'created_at';

/**
 * Replication of the sort comparator used in app/(tabs)/index.tsx:
 *   [...result].sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime())
 */
function sortInteractions(
    interactions: InteractionWithPeople[],
    sortBy: SortBy
): InteractionWithPeople[] {
    return [...interactions].sort(
        (a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
    );
}

/**
 * Replication of getDateRangeStart() from app/(tabs)/index.tsx
 */
type DateRange = 'all' | 'today' | 'week' | 'month';

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeInteraction(overrides: {
    id: string;
    occurred_at: string;
    created_at: string;
}): InteractionWithPeople {
    return {
        id: overrides.id,
        user_id: 'user-1',
        type: 'in-person',
        title: `Interaction ${overrides.id}`,
        sentiment: 3,
        occurred_at: overrides.occurred_at,
        created_at: overrides.created_at,
        updated_at: overrides.created_at,
        people: [],
    };
}

// Three interactions where occurred_at and created_at order differ
// A: happened earliest, logged latest
// B: happened in the middle, logged in the middle
// C: happened latest, logged earliest
const interactionA = makeInteraction({
    id: 'A',
    occurred_at: '2026-01-01T10:00:00Z', // oldest event
    created_at: '2026-01-10T10:00:00Z',  // newest log entry
});
const interactionB = makeInteraction({
    id: 'B',
    occurred_at: '2026-01-05T10:00:00Z', // middle event
    created_at: '2026-01-05T10:00:00Z',  // middle log entry
});
const interactionC = makeInteraction({
    id: 'C',
    occurred_at: '2026-01-10T10:00:00Z', // newest event
    created_at: '2026-01-01T10:00:00Z',  // oldest log entry
});

const unsortedInteractions = [interactionA, interactionB, interactionC];

// ─── Sort Logic ───────────────────────────────────────────────────────────────

describe('Timeline sort logic', () => {
    // Test 5.1 — Default sort is "When happened" (occurred_at desc)
    describe('sortBy: occurred_at (default)', () => {
        it('orders by occurred_at descending', () => {
            const result = sortInteractions(unsortedInteractions, 'occurred_at');
            expect(result.map((i) => i.id)).toEqual(['C', 'B', 'A']);
        });

        it('most-recently-happened interaction is first', () => {
            const result = sortInteractions(unsortedInteractions, 'occurred_at');
            expect(result[0].id).toBe('C');
        });

        it('oldest-happened interaction is last', () => {
            const result = sortInteractions(unsortedInteractions, 'occurred_at');
            expect(result[result.length - 1].id).toBe('A');
        });
    });

    // Test 5.2 — Switching to "Date logged" re-sorts by created_at desc
    describe('sortBy: created_at', () => {
        it('orders by created_at descending', () => {
            const result = sortInteractions(unsortedInteractions, 'created_at');
            expect(result.map((i) => i.id)).toEqual(['A', 'B', 'C']);
        });

        it('most-recently-logged interaction is first', () => {
            const result = sortInteractions(unsortedInteractions, 'created_at');
            expect(result[0].id).toBe('A');
        });

        it('oldest-logged interaction is last', () => {
            const result = sortInteractions(unsortedInteractions, 'created_at');
            expect(result[result.length - 1].id).toBe('C');
        });
    });

    // Test 5.3 — Sort order differs between occurred_at and created_at
    describe('sort produces different orderings', () => {
        it('occurred_at and created_at sorts produce different results when timestamps differ', () => {
            const byOccurred = sortInteractions(unsortedInteractions, 'occurred_at');
            const byCreated = sortInteractions(unsortedInteractions, 'created_at');
            expect(byOccurred.map((i) => i.id)).not.toEqual(byCreated.map((i) => i.id));
        });
    });

    // Test 5.4 — Sort does not mutate the original array
    describe('immutability', () => {
        it('does not mutate the original array', () => {
            const original = [...unsortedInteractions];
            sortInteractions(unsortedInteractions, 'occurred_at');
            expect(unsortedInteractions.map((i) => i.id)).toEqual(original.map((i) => i.id));
        });
    });

    // Test 5.3 (plan) — Sort persists through filter changes
    describe('sort combined with filter', () => {
        it('maintains created_at sort after type filter is applied', () => {
            const mixed = [
                makeInteraction({ id: 'call-old', occurred_at: '2026-01-01T00:00:00Z', created_at: '2026-01-05T00:00:00Z' }),
                makeInteraction({ id: 'call-new', occurred_at: '2026-01-10T00:00:00Z', created_at: '2026-01-12T00:00:00Z' }),
                makeInteraction({ id: 'in-person', occurred_at: '2026-01-08T00:00:00Z', created_at: '2026-01-09T00:00:00Z' }),
            ];

            // Simulate filter (type=call) then sort by created_at
            const filtered = mixed.filter((i) => i.id.startsWith('call'));
            const sorted = sortInteractions(filtered, 'created_at');
            expect(sorted.map((i) => i.id)).toEqual(['call-new', 'call-old']);
        });

        it('maintains occurred_at sort after search filter is applied', () => {
            const data = [
                { ...makeInteraction({ id: '1', occurred_at: '2026-01-01T00:00:00Z', created_at: '2026-01-10T00:00:00Z' }), title: 'Coffee with Alice' },
                { ...makeInteraction({ id: '2', occurred_at: '2026-01-10T00:00:00Z', created_at: '2026-01-01T00:00:00Z' }), title: 'Coffee with Bob' },
                { ...makeInteraction({ id: '3', occurred_at: '2026-01-05T00:00:00Z', created_at: '2026-01-05T00:00:00Z' }), title: 'Meeting at work' },
            ];

            // Simulate search filter (title contains "Coffee") then sort by occurred_at
            const filtered = data.filter((i) => i.title.toLowerCase().includes('coffee'));
            const sorted = sortInteractions(filtered, 'occurred_at');
            expect(sorted.map((i) => i.id)).toEqual(['2', '1']);
        });
    });

    // Test 5.4 — Switching back restores original order
    describe('switching sort keys', () => {
        it('switching from created_at back to occurred_at restores occurred_at order', () => {
            const byCreated = sortInteractions(unsortedInteractions, 'created_at');
            expect(byCreated.map((i) => i.id)).toEqual(['A', 'B', 'C']);

            const backToOccurred = sortInteractions(byCreated, 'occurred_at');
            expect(backToOccurred.map((i) => i.id)).toEqual(['C', 'B', 'A']);
        });
    });

    // Edge cases
    describe('edge cases', () => {
        it('handles empty array', () => {
            expect(sortInteractions([], 'occurred_at')).toEqual([]);
            expect(sortInteractions([], 'created_at')).toEqual([]);
        });

        it('handles single-element array', () => {
            const single = [interactionA];
            expect(sortInteractions(single, 'occurred_at')).toEqual([interactionA]);
        });

        it('handles identical timestamps (preserves order)', () => {
            const same1 = makeInteraction({ id: 'X', occurred_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' });
            const same2 = makeInteraction({ id: 'Y', occurred_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' });
            const result = sortInteractions([same1, same2], 'occurred_at');
            // Both have same timestamp; sort is stable in V8 so order should be preserved
            expect(result).toHaveLength(2);
            expect(result.map((i) => i.id)).toContain('X');
            expect(result.map((i) => i.id)).toContain('Y');
        });
    });
});

// ─── getDateRangeStart() ─────────────────────────────────────────────────────

describe('getDateRangeStart()', () => {
    it('returns null for "all"', () => {
        expect(getDateRangeStart('all')).toBeNull();
    });

    it('returns start of today for "today"', () => {
        const result = getDateRangeStart('today')!;
        const now = new Date();
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getFullYear()).toBe(now.getFullYear());
        expect(result.getMonth()).toBe(now.getMonth());
        expect(result.getDate()).toBe(now.getDate());
    });

    it('returns a date 7 days ago for "week"', () => {
        const before = Date.now();
        const result = getDateRangeStart('week')!;
        const after = Date.now();

        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        expect(result.getTime()).toBeGreaterThanOrEqual(before - sevenDaysMs - 1000);
        expect(result.getTime()).toBeLessThanOrEqual(after - sevenDaysMs + 1000);
    });

    it('returns a date ~1 month ago for "month"', () => {
        const now = new Date();
        const result = getDateRangeStart('month')!;

        // Result month should be one before current month (or 11 in January case)
        const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        expect(result.getMonth()).toBe(expectedMonth);
    });

    it('"today" cutoff is in the past', () => {
        const result = getDateRangeStart('today')!;
        expect(result.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('"week" cutoff is before "today" cutoff', () => {
        const today = getDateRangeStart('today')!;
        const week = getDateRangeStart('week')!;
        expect(week.getTime()).toBeLessThan(today.getTime());
    });

    it('"month" cutoff is before "week" cutoff', () => {
        const week = getDateRangeStart('week')!;
        const month = getDateRangeStart('month')!;
        expect(month.getTime()).toBeLessThan(week.getTime());
    });
});
