// ParsedLogEntry — result of parsing a natural language log input
import type { InteractionType, Person } from './index';

export interface AmbiguousMatch {
    name: string;           // the first name found in text
    candidates: Person[];   // 2+ contacts sharing that first name
}

export interface ParsedLogEntry {
    rawText: string;
    title: string;               // contextual summary (e.g. "Call with Sarah")
    notes: string;               // full text
    matchedPeople: Person[];     // matched against existing contacts
    unmatchedNames: string[];    // potential new people (capitalized words not in contacts)
    ambiguousMatches: AmbiguousMatch[]; // first-name matches with multiple candidates
    occurredAt: Date;            // parsed date or now
    dateSource: string | null;   // the text fragment that was parsed (e.g. "yesterday")
    inferredType: InteractionType | null; // from keyword matching
    location: string | null;     // from "at [Place]" patterns
}
