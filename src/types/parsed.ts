// ParsedLogEntry — result of parsing a natural language log input
import type { InteractionType, Person } from './index';

export interface ParsedLogEntry {
    rawText: string;
    title: string;               // first sentence or ~60 chars
    notes: string;               // full text
    matchedPeople: Person[];     // matched against existing contacts
    unmatchedNames: string[];    // potential new people (capitalized words not in contacts)
    occurredAt: Date;            // parsed date or now
    dateSource: string | null;   // the text fragment that was parsed (e.g. "yesterday")
    inferredType: InteractionType | null; // from keyword matching
    location: string | null;     // from "at [Place]" patterns
}
