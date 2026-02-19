# Natural Language Log Input

## Goal

Replace the current multi-field interaction form with a **single text input** where users type naturally — e.g. *"Had coffee with Sarah and Tom yesterday at Starbucks"* — and the app automatically extracts **people**, **time**, and other details. This makes logging feel instant rather than form-like.

## Affected Files

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `app/interaction/new.tsx` | Replace form with single input + extraction preview |
| NEW | `src/services/logParser.ts` | NLP engine: extract people, dates, interaction type |
| MODIFY | `src/stores/interactionsStore.ts` | Accept parsed data from natural language input |
| MODIFY | `src/stores/peopleStore.ts` | Add `quickAddPerson(name)` for inline creation |
| MODIFY | `src/types/index.ts` | Add `ParsedLogEntry` type |
| MODIFY | `src/components/ui/index.ts` | Export any new components |
| INSTALL | `chrono-node` | Natural language date parsing library |

## Implementation Steps

### 1. Install `chrono-node`
Lightweight JS library that parses "yesterday", "last Tuesday", "3pm", etc. into real dates.

### 2. Create `src/services/logParser.ts`
The core extraction engine:

```ts
interface ParsedLogEntry {
  rawText: string;
  title: string;              // first ~60 chars or first sentence
  notes: string;              // full text
  matchedPeople: Person[];    // matched against existing contacts
  unmatchedNames: string[];   // potential new people
  occurredAt: Date;           // parsed date or now
  dateSource: string | null;  // the text that was parsed ("yesterday")
  inferredType: InteractionType | null; // from keywords
  location: string | null;    // extracted location hints
}
```

**Extraction logic:**
- **People:** Tokenize text, match each capitalized word/phrase against existing people (name, nickname). Common words (I, The, Monday, etc.) are excluded via stopword list.
- **Time:** Use `chrono-node` to parse temporal references. Fall back to `new Date()` if none found.
- **Interaction type:** Keyword mapping — "called" → call, "texted" → text, "met"/"coffee"/"lunch"/"dinner" → in-person, "zoom"/"facetime" → video, etc.
- **Location:** Look for "at [Place]" patterns after removing matched people and time phrases.

### 3. Redesign `app/interaction/new.tsx`
New layout:
1. **Hero text input** — large, auto-focused, multiline, placeholder: *"What happened? e.g. Had lunch with Sarah yesterday"*
2. **Extraction preview** — appears below as the user types (debounced 500ms):
   - 🧑 People chips (tappable to confirm/remove, "+" for unmatched names)
   - 🕐 Parsed date/time (tappable to override)
   - 📍 Location (if detected)
   - 📱 Interaction type pill (tappable to change)
3. **Quality rating** — compact star row at bottom (optional, defaults to 3)
4. **"Log it"** button

### 4. Add `quickAddPerson(name)` to `peopleStore`
Creates a minimal person record (name only, relationship_type = 'acquaintance', closeness = 3) so unmatched names can be added inline without leaving the screen.

### 5. Update `InteractionFormData` type
No structural changes needed — the parser outputs the same shape the store already expects.

## Testing Strategy

### Manual
- Type "Called Mom this morning" → verify: Mom matched, time = today AM, type = call
- Type "Lunch with Jake and Emily at Olive Garden yesterday" → verify: 2 people, in-person, location, yesterday's date
- Type "texted Sarah" → verify: type = text, date = now, Sarah matched
- Type "Met Alex for the first time" → verify: Alex offered as unmatched name to quick-add
- Type something with no names → verify: empty people, no crash

### Automated (future)
- Unit tests for `logParser.ts` with various input strings
- Edge cases: no date, no people, multiple dates, ambiguous names

## Risks & Open Questions

1. **Name ambiguity** — Common words like "Will", "Grace", "Mark" are both names and verbs. The stopword list needs tuning. Matching against existing contacts first mitigates this.
2. **chrono-node bundle size** — ~50KB gzipped. Acceptable for the value it provides?
3. **Should extraction be real-time or on-submit?** Plan calls for debounced real-time preview, but on-submit is simpler. Recommend real-time for better UX.
