import type { QualityRating } from '../types';

const POSITIVE_WORDS = new Set([
    'happy', 'great', 'good', 'amazing', 'wonderful', 'excellent', 'fantastic',
    'love', 'loved', 'fun', 'perfect', 'awesome', 'enjoy', 'enjoyed', 'enjoying',
    'glad', 'thrilled', 'excited', 'pleased', 'proud', 'grateful', 'thankful',
    'laugh', 'laughed', 'smile', 'smiled', 'joy', 'joyful', 'better', 'best',
    'nice', 'beautiful', 'brilliant', 'outstanding', 'warm', 'kind', 'lovely',
    'delightful', 'productive', 'successful', 'accomplished', 'celebrate',
    'reconnect', 'reconnected', 'connected', 'supportive', 'uplifting',
]);

const NEGATIVE_WORDS = new Set([
    'sad', 'bad', 'awful', 'terrible', 'horrible', 'poor',
    'hate', 'hated', 'angry', 'frustrated', 'frustration', 'annoyed',
    'disappointed', 'disappointing', 'failed', 'failure', 'depressed', 'anxious',
    'anxiety', 'stressed', 'stress', 'difficult', 'struggle', 'struggling',
    'pain', 'painful', 'worst', 'boring', 'bored', 'lonely', 'hurt', 'hurting',
    'upset', 'worried', 'trouble', 'unhappy', 'regret', 'awkward', 'uncomfortable',
    'argument', 'fight', 'disagreement', 'missed', 'distant', 'cold',
]);

export function computeSentiment(text: string): QualityRating {
    if (!text.trim()) return 3;
    const words = text.toLowerCase().match(/\b\w+\b/g) ?? [];
    if (words.length === 0) return 3;
    let score = 0;
    for (const word of words) {
        if (POSITIVE_WORDS.has(word)) score++;
        if (NEGATIVE_WORDS.has(word)) score--;
    }
    const normalized = (score / words.length) * 10;
    if (normalized <= -1.0) return 1;
    if (normalized <= -0.3) return 2;
    if (normalized <= 0.3) return 3;
    if (normalized <= 1.0) return 4;
    return 5;
}
