// Log Parser — extracts people, dates, interaction type, and location from natural language
import * as chrono from 'chrono-node';
import type { InteractionType, Person } from '../types';
import type { ParsedLogEntry } from '../types/parsed';

// ─── Stopwords: common words that look like names but aren't ──
const STOPWORDS = new Set([
    // Common English words that start capitalized at sentence start
    'I', 'The', 'A', 'An', 'My', 'We', 'It', 'He', 'She', 'They',
    'This', 'That', 'These', 'Those', 'There', 'Here', 'Just', 'Got',
    'Had', 'Was', 'Were', 'Been', 'Have', 'Has', 'Did', 'Does', 'Do',
    'Can', 'Could', 'Would', 'Should', 'Will', 'May', 'Might',
    'Some', 'All', 'Any', 'No', 'Not', 'But', 'And', 'Or', 'So',
    'Very', 'Really', 'Also', 'After', 'Before', 'During', 'About',
    'Today', 'Yesterday', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    'Morning', 'Afternoon', 'Evening', 'Night', 'Noon',
    // Interaction-related verbs/nouns (capitalized at sentence start)
    'Met', 'Called', 'Texted', 'Emailed', 'Messaged', 'Talked',
    'Went', 'Saw', 'Hung', 'Caught', 'Grabbed', 'Quick',
    'Coffee', 'Lunch', 'Dinner', 'Breakfast', 'Drinks', 'Meeting',
    'Zoom', 'FaceTime', 'Skype', 'Teams',
    // Prepositions / filler
    'At', 'In', 'On', 'For', 'With', 'From', 'To', 'Up',
    'Out', 'Over', 'Then', 'When', 'Where', 'How', 'What',
    'Who', 'Why', 'Now', 'Still', 'Already', 'Again',
]);

// ─── Keyword → Interaction Type mapping ──────────────────────
const TYPE_KEYWORDS: { keywords: string[]; type: InteractionType }[] = [
    {
        keywords: ['called', 'call', 'phone', 'rang', 'dialed', 'phoned'],
        type: 'call',
    },
    {
        keywords: ['texted', 'text', 'sms', 'messaged', 'message', 'imessage', 'whatsapp', 'dm', 'dmed'],
        type: 'text',
    },
    {
        keywords: ['zoom', 'facetime', 'video', 'skype', 'teams', 'google meet', 'webex'],
        type: 'video',
    },
    {
        keywords: ['emailed', 'email', 'e-mail', 'mailed'],
        type: 'email',
    },
    {
        keywords: ['instagram', 'twitter', 'facebook', 'snapchat', 'tiktok', 'linkedin', 'posted', 'commented', 'liked', 'tagged'],
        type: 'social-media',
    },
    {
        keywords: [
            'met', 'saw', 'coffee', 'lunch', 'dinner', 'breakfast', 'drinks',
            'hung out', 'hangout', 'hang out', 'grabbed', 'went to', 'walked',
            'ran into', 'bumped into', 'visited', 'party', 'event', 'concert',
            'movie', 'gym', 'workout', 'hike', 'trip', 'meeting', 'in person',
        ],
        type: 'in-person',
    },
];

// ─── Location extraction: "at [Place]" pattern ───────────────
function extractLocation(text: string, dateSource: string | null): string | null {
    // Remove the date reference to avoid false matches
    let cleanText = text;
    if (dateSource) {
        cleanText = cleanText.replace(dateSource, '');
    }

    // Match "at [Capitalized Place Name]" — but not "at home" (lowercase unless start of sentence)
    const atPattern = /\bat\s+([A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+)*)/g;
    const matches = [...cleanText.matchAll(atPattern)];

    if (matches.length > 0) {
        // Take the last "at X" match (usually the location, not "at calling" etc.)
        return matches[matches.length - 1][1];
    }

    return null;
}

// ─── Title extraction ────────────────────────────────────────
function extractTitle(text: string): string {
    // Take the first sentence or first 60 chars, whichever is shorter
    const firstSentence = text.split(/[.!?\n]/)[0].trim();
    if (firstSentence.length <= 60) return firstSentence;
    return firstSentence.substring(0, 57) + '...';
}

// ─── Main parse function ─────────────────────────────────────
export function parseLogEntry(
    text: string,
    existingPeople: Person[]
): ParsedLogEntry {
    const trimmed = text.trim();
    if (!trimmed) {
        return {
            rawText: text,
            title: '',
            notes: '',
            matchedPeople: [],
            unmatchedNames: [],
            occurredAt: new Date(),
            dateSource: null,
            inferredType: null,
            location: null,
        };
    }

    // ── 1. Parse date/time ──
    const chronoResults = chrono.parse(trimmed, new Date(), { forwardDate: false });
    let occurredAt = new Date();
    let dateSource: string | null = null;

    if (chronoResults.length > 0) {
        occurredAt = chronoResults[0].start.date();
        dateSource = chronoResults[0].text;
    }

    // ── 2. Infer interaction type ──
    const lowerText = trimmed.toLowerCase();
    let inferredType: InteractionType | null = null;

    for (const mapping of TYPE_KEYWORDS) {
        if (mapping.keywords.some((kw) => lowerText.includes(kw))) {
            inferredType = mapping.type;
            break;
        }
    }

    // ── 3. Match people ──
    const matchedPeople: Person[] = [];
    const matchedPeopleIds = new Set<string>();

    // First try to match existing contact names/nicknames (case-insensitive)
    for (const person of existingPeople) {
        const nameVariants = [person.name, person.nickname].filter(Boolean) as string[];
        for (const variant of nameVariants) {
            // Match whole word (not substring of another word)
            const regex = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'i');
            if (regex.test(trimmed) && !matchedPeopleIds.has(person.id)) {
                matchedPeople.push(person);
                matchedPeopleIds.add(person.id);
                break;
            }
        }
    }

    // ── 4. Find unmatched names ──
    // Look for capitalized words that aren't stopwords, date text, or already-matched people
    const unmatchedNames: string[] = [];
    const matchedNameStrings = new Set(
        matchedPeople.flatMap((p) => [
            p.name.toLowerCase(),
            p.nickname?.toLowerCase(),
        ].filter(Boolean))
    );

    // Split into words and find capitalized sequences
    // Skip the very first word of a sentence (likely a verb like "Had", "Met")
    const sentences = trimmed.split(/[.!?\n]+/).filter(Boolean);
    for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[.,!?;:'"()]/g, '');
            if (!word || word.length < 2) continue;

            // Skip first word of sentence (usually a verb)
            if (i === 0) continue;

            // Check if it's capitalized
            if (word[0] !== word[0].toUpperCase() || word[0] === word[0].toLowerCase()) continue;

            // Skip stopwords
            if (STOPWORDS.has(word)) continue;

            // Skip if it's part of the date reference
            if (dateSource && dateSource.toLowerCase().includes(word.toLowerCase())) continue;

            // Skip if it's already a matched person
            if (matchedNameStrings.has(word.toLowerCase())) continue;

            // Skip if it's part of a matched person's full name
            const isPartOfMatchedName = matchedPeople.some(
                (p) => p.name.toLowerCase().includes(word.toLowerCase())
            );
            if (isPartOfMatchedName) continue;

            // This might be a person's name
            // Check if the next word is also capitalized — could be a full name
            const nextWord = i + 1 < words.length ? words[i + 1]?.replace(/[.,!?;:'"()]/g, '') : null;
            if (
                nextWord &&
                nextWord.length >= 2 &&
                nextWord[0] === nextWord[0].toUpperCase() &&
                nextWord[0] !== nextWord[0].toLowerCase() &&
                !STOPWORDS.has(nextWord)
            ) {
                const fullName = `${word} ${nextWord}`;
                if (!unmatchedNames.includes(fullName) && !matchedNameStrings.has(fullName.toLowerCase())) {
                    unmatchedNames.push(fullName);
                }
                i++; // skip the next word since we consumed it
            } else {
                if (!unmatchedNames.includes(word) && !matchedNameStrings.has(word.toLowerCase())) {
                    unmatchedNames.push(word);
                }
            }
        }
    }

    // ── 5. Extract location ──
    const location = extractLocation(trimmed, dateSource);

    // Remove location from unmatched names if it was picked up
    const filteredUnmatched = location
        ? unmatchedNames.filter((n) => !location.includes(n))
        : unmatchedNames;

    return {
        rawText: text,
        title: extractTitle(trimmed),
        notes: trimmed,
        matchedPeople,
        unmatchedNames: filteredUnmatched,
        occurredAt,
        dateSource,
        inferredType,
        location,
    };
}

// ─── Utility ─────────────────────────────────────────────────
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
