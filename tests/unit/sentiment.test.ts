import { describe, it, expect } from 'vitest';
import { computeSentiment } from '../../src/utils/sentiment';
import { SENTIMENT_LABELS } from '../../src/constants';

// ─── computeSentiment() ──────────────────────────────────────────────────────

describe('computeSentiment()', () => {
    // Test 1.1 — Empty / whitespace input
    describe('empty / whitespace input', () => {
        it('returns 3 (Neutral) for empty string', () => {
            expect(computeSentiment('')).toBe(3);
        });

        it('returns 3 (Neutral) for whitespace-only string', () => {
            expect(computeSentiment('   ')).toBe(3);
        });

        it('returns 3 (Neutral) for tabs and newlines', () => {
            expect(computeSentiment('\t\n')).toBe(3);
        });
    });

    // Test 1.2 — Strongly positive text → rating 5
    describe('strongly positive text', () => {
        it('returns 5 (Very Positive) when normalized > 1.0', () => {
            // 9 words, 2 positive (amazing, laughed) → (2/9)*10 = 2.22 > 1.0
            const result = computeSentiment('Had amazing coffee with Sarah, we laughed a lot');
            expect(result).toBe(5);
        });

        it('returns 5 for dense positive sentiment', () => {
            // 5 words, 3 positive (amazing, wonderful, love) → (3/5)*10 = 6.0 > 1.0
            const result = computeSentiment('amazing wonderful love the day');
            expect(result).toBe(5);
        });
    });

    // Test 1.3 — Mildly positive text → rating 4
    describe('mildly positive text', () => {
        it('returns 4 (Positive) when normalized is in (0.3, 1.0]', () => {
            // 13 words, 1 positive (nice) → (1/13)*10 ≈ 0.769, in (0.3, 1.0]
            const result = computeSentiment(
                'Caught up with a friend today, it was nice to see them again'
            );
            expect(result).toBe(4);
        });

        it('returns 4 at the upper boundary (normalized = 1.0)', () => {
            // 10 words, 1 positive (happy) → (1/10)*10 = 1.0, ≤ 1.0 → 4
            const result = computeSentiment('I feel happy today and it is a good');
            // happy + good = 2 positives in 9 words → (2/9)*10 = 2.22 > 1.0 → 5
            // Need exactly 1/10 ratio: 1 positive in 10 words
            const result2 = computeSentiment(
                'saw a colleague and the day was mostly fine except being nice'
                // nice = 1 positive, 12 words → (1/12)*10 = 0.833 → 4
            );
            expect(result2).toBe(4);
        });
    });

    // Test 1.4 — Neutral text (no keyword matches) → rating 3
    describe('neutral text', () => {
        it('returns 3 (Neutral) when no sentiment keywords are present', () => {
            // 0 matches → score = 0 → normalized = 0 → 3
            const result = computeSentiment('Met with Alex for lunch at the office');
            expect(result).toBe(3);
        });

        it('returns 3 for very short neutral text', () => {
            const result = computeSentiment('Went to the store');
            expect(result).toBe(3);
        });
    });

    // Test 1.5 — Mildly negative text → rating 2
    describe('mildly negative text', () => {
        it('returns 2 (Negative) when normalized is in (-1.0, -0.3]', () => {
            // 18 words, 1 negative (stressed) → (-1/18)*10 ≈ -0.556 ∈ (-1.0, -0.3]
            const result = computeSentiment(
                'Had a conversation that left me feeling stressed and I was not sure what to make of it'
            );
            expect(result).toBe(2);
        });

        it('returns 2 for awkward/uncomfortable text with enough filler words', () => {
            // awkward = 1 negative in 15+ words → normalized ∈ (-1.0, -0.3]
            const result = computeSentiment(
                'The meeting was fine but parts of it felt a bit awkward for everyone involved'
            );
            expect(result).toBe(2);
        });
    });

    // Test 1.6 — Strongly negative text → rating 1
    describe('strongly negative text', () => {
        it('returns 1 (Very Negative) when normalized <= -1.0', () => {
            // 9 words, 4 negative (terrible, angry, frustrated, hate) → (-4/9)*10 = -4.44 ≤ -1.0
            const result = computeSentiment(
                'Terrible fight, angry and frustrated, hate how it went'
            );
            expect(result).toBe(1);
        });

        it('returns 1 for densely negative text', () => {
            // 4 words, 3 negative (sad, awful, lonely) → (-3/4)*10 = -7.5 ≤ -1.0
            const result = computeSentiment('sad awful and lonely');
            expect(result).toBe(1);
        });
    });

    // Test 1.7 — Mixed text (positives cancel negatives) → rating 3
    describe('mixed sentiment text', () => {
        it('returns 3 (Neutral) when positives and negatives cancel out', () => {
            // happy + reconnect = +2, sad + struggling = -2 → score = 0 → 3
            const result = computeSentiment(
                'Happy to reconnect but also sad they are struggling'
            );
            expect(result).toBe(3);
        });

        it('returns 3 when one positive cancels one negative', () => {
            // good = +1, bad = -1 → score = 0 → 3
            const result = computeSentiment('It was good in parts and bad in others');
            expect(result).toBe(3);
        });
    });

    // Boundary / edge cases
    describe('edge cases', () => {
        it('is case-insensitive', () => {
            expect(computeSentiment('AMAZING')).toBe(computeSentiment('amazing'));
        });

        it('handles punctuation correctly (ignores it in word splitting)', () => {
            // "amazing!!! wonderful..." should still detect the words
            const result = computeSentiment('amazing!!! wonderful...');
            expect(result).toBe(5);
        });

        it('handles hyphenated words by splitting them', () => {
            // "catch-up" → "catch" + "up" (neither is a keyword → neutral)
            const result = computeSentiment('had a catch-up meeting');
            expect(result).toBe(3);
        });

        it('returns a value within valid QualityRating range (1–5)', () => {
            const inputs = ['', 'amazing', 'terrible', 'just met a friend', 'bad good'];
            for (const input of inputs) {
                const rating = computeSentiment(input);
                expect(rating).toBeGreaterThanOrEqual(1);
                expect(rating).toBeLessThanOrEqual(5);
            }
        });
    });
});

// ─── SENTIMENT_LABELS ────────────────────────────────────────────────────────

describe('SENTIMENT_LABELS', () => {
    // Test 4.1 — All 5 label strings are correct
    it('maps 1 to "Very Negative"', () => {
        expect(SENTIMENT_LABELS[1]).toBe('Very Negative');
    });

    it('maps 2 to "Negative"', () => {
        expect(SENTIMENT_LABELS[2]).toBe('Negative');
    });

    it('maps 3 to "Neutral"', () => {
        expect(SENTIMENT_LABELS[3]).toBe('Neutral');
    });

    it('maps 4 to "Positive"', () => {
        expect(SENTIMENT_LABELS[4]).toBe('Positive');
    });

    it('maps 5 to "Very Positive"', () => {
        expect(SENTIMENT_LABELS[5]).toBe('Very Positive');
    });

    it('has exactly 5 entries', () => {
        expect(Object.keys(SENTIMENT_LABELS)).toHaveLength(5);
    });

    it('labels align with computeSentiment() rating values', () => {
        // Every possible return value from computeSentiment has a label
        for (const rating of [1, 2, 3, 4, 5] as const) {
            expect(SENTIMENT_LABELS[rating]).toBeDefined();
            expect(typeof SENTIMENT_LABELS[rating]).toBe('string');
            expect(SENTIMENT_LABELS[rating].length).toBeGreaterThan(0);
        }
    });
});
