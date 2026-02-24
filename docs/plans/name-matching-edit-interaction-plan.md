# First-Name Matching & Edit Interaction

## Goal

1. **First-name matching**: When a user types just a first name (e.g., "Mike"), auto-match to a contact whose name starts with that first name. If multiple contacts match (e.g., "Mike Johnson" and "Mike Chen"), show a disambiguation picker.
2. **Edit interaction**: Allow editing an existing interaction's title, notes, quality, type, and date.

---

## Proposed Changes

### Feature 1: First-Name Matching

#### [MODIFY] [parsed.ts](file:///home/benyoo/Dev/SocialQ/src/types/parsed.ts)
- Add `ambiguousMatches` field: `{ name: string; candidates: Person[] }[]` — holds first-name matches with 2+ candidates

#### [MODIFY] [logParser.ts](file:///home/benyoo/Dev/SocialQ/src/services/logParser.ts)
- In the "Match people" step: after full-name matching, add a first-name matching pass
  - For each unmatched capitalized word, check if any `existingPeople` have a first name matching it
  - **1 match** → auto-add to `matchedPeople`, remove from `unmatchedNames`
  - **2+ matches** → add to new `ambiguousMatches` array for UI disambiguation

#### [MODIFY] [new.tsx](file:///home/benyoo/Dev/SocialQ/app/interaction/new.tsx)
- Render an "ambiguous match" section in the extraction preview
- For each ambiguous entry, show the first name + list of candidate contacts as selectable chips
- When user picks a candidate → move to `matchedPeople` via local state

---

### Feature 2: Edit Interaction

#### [NEW] [edit.tsx](file:///home/benyoo/Dev/SocialQ/app/interaction/edit.tsx)
- Form pre-populated with existing interaction data (title, notes, quality, type, occurred_at)
- Receives interaction `id` via search params, loads data from store
- On save → calls `updateInteraction(id, data)` and navigates back
- Reuses styling patterns from `app/person/edit.tsx`

#### [MODIFY] [[id].tsx](file:///home/benyoo/Dev/SocialQ/app/interaction/[id].tsx)
- Add an "Edit" button (pencil icon or text) in the header or body
- Navigates to `app/interaction/edit?id=<interaction-id>`

#### [MODIFY] [_layout.tsx](file:///home/benyoo/Dev/SocialQ/app/_layout.tsx)
- Register `interaction/edit` Stack.Screen route

---

## Testing Strategy

- `npx tsc --noEmit` passes
- Manual: type a first name with one matching contact → auto-matched; type a first name with multiple → disambiguation shown
- Manual: open an interaction → tap edit → modify fields → save → changes reflected
